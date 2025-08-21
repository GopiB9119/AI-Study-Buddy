const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const ajv = new Ajv();

// ensure logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const badResponsesLog = path.join(logsDir, 'bad_responses.log');

function logBadResponse(endpoint, prompt, response) {
  const entry = {
    timestamp: new Date().toISOString(),
    endpoint,
    prompt: prompt.substring(0, 500),
    response: (response || '').substring(0, 2000)
  };
  fs.appendFileSync(badResponsesLog, JSON.stringify(entry) + '\n');
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  console.log('Please set it in your environment or .env file');
  process.exit(1);
}

// Helper function to call Gemini API
async function callGeminiAPI(prompt) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Try to extract a JSON array from text
function extractJsonArray(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

// Check if text looks like a numbered Markdown list (1. item)
function isNumberedMarkdownList(text) {
  if (!text || typeof text !== 'string') return false;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  // Require at least half of lines to start with a number + dot
  const numbered = lines.filter(l => /^\d+\.[\s\-]/.test(l) || /^\d+\.\s+/.test(l));
  return numbered.length >= Math.max(1, Math.floor(lines.length / 2));
}

// Call Gemini with 1 retry and a strengthening instruction when validation fails
async function callGeminiWithRetry(prompt, options = { expect: 'any' }) {
  // options.expect: 'any' | 'json' | 'markdownList'
  const maxTries = 2;
  let lastText = null;

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    try {
      const text = await callGeminiAPI(prompt);
      lastText = text;

      if (options.expect === 'any') {
        return text;
      }

      if (options.expect === 'json') {
        const parsed = extractJsonArray(text);
        if (parsed) return text;
      }

      if (options.expect === 'markdownList') {
        if (isNumberedMarkdownList(text)) return text;
      }

      // If validation failed and we're going to retry, strengthen the prompt
      if (attempt < maxTries) {
        if (options.expect === 'json') {
          prompt = prompt + "\n\nIMPORTANT: Return ONLY the raw JSON array exactly as shown in the example. Do not include any surrounding backticks, commentary, or numbered lists. If you cannot, reply with an empty array [].";
        } else if (options.expect === 'markdownList') {
          prompt = prompt + "\n\nIMPORTANT: When providing step-by-step instructions, return a numbered Markdown list (example:\n1. Step one\n2. Step two). Do not add extra commentary or code fences. Return only the list.";
        } else {
          // generic strengthening
          prompt = prompt + "\n\nPlease respond concisely and avoid extra commentary.";
        }
      }
    } catch (err) {
      lastText = null;
      console.error('callGeminiWithRetry attempt error:', err);
      if (attempt >= maxTries) break;
    }
  }

  // After retries, return whatever we have (or null) so caller can handle fallback
  return lastText;
}

// JSON Schemas
const flashcardSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question: { type: 'string' },
      answer: { type: 'string' }
    },
    required: ['question', 'answer']
  }
};

const quizSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question: { type: 'string' },
      options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
      correctAnswer: { type: 'string' },
      explanation: { type: 'string' }
    },
    required: ['question', 'options', 'correctAnswer', 'explanation']
  }
};

const companySchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question: { type: 'string' },
      answer: { type: 'string' }
    },
    required: ['question', 'answer']
  }
};

const validateFlashcards = ajv.compile(flashcardSchema);
const validateQuiz = ajv.compile(quizSchema);
const validateCompany = ajv.compile(companySchema);

// Routes

// General chat endpoint
app.post('/api/ask', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🤖 Processing chat request...');

    let finalPrompt = prompt;
    const expectMarkdownList = /step|steps|step-by-step|stepwise|procedure/i.test(prompt);

    if (expectMarkdownList) {
      finalPrompt = `${prompt}\n\nWhen you provide step-by-step instructions, return them as a numbered Markdown list (\n1. Step one\n2. Step two\n) with a blank line between items. Do not include extra commentary.`;
    }

    const response = await callGeminiWithRetry(finalPrompt, { expect: expectMarkdownList ? 'markdownList' : 'any' });
    
    res.json({ response });
  } catch (error) {
    console.error('Error in /api/ask:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

// Flashcards generation endpoint
app.post('/api/flashcards', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

  const prompt = `Generate 6 educational flashcards for the topic: "${topic}". 

Format your response as a valid JSON array of objects, where each object has "question" and "answer" properties. Make sure the questions are clear and the answers are informative but concise.

IMPORTANT: Return ONLY the JSON array, with no surrounding backticks, commentary, or numbered lists — just the raw JSON array.

Example format:
[
  {
    "question": "What is the main concept?",
    "answer": "The main concept is..."
  }
]

Topic: ${topic}`;

  console.log('📚 Generating flashcards for:', topic);
  let response = await callGeminiWithRetry(prompt, { expect: 'json' });
  const parsed = extractJsonArray(response || '');
  if (!parsed || !validateFlashcards(parsed)) {
    // Log and retry once with a stricter instruction
    logBadResponse('/api/flashcards', prompt, response);
    const retry = await callGeminiWithRetry(prompt + "\n\nIMPORTANT: Return ONLY the raw JSON array exactly as shown. No commentary.", { expect: 'json' });
    const parsed2 = extractJsonArray(retry || '');
    if (parsed2 && validateFlashcards(parsed2)) {
      response = retry;
    } else {
      // keep original response but warn client
      return res.json({ response, warning: 'AI output could not be validated; returned raw text.' });
    }
  }

  res.json({ response });
  } catch (error) {
    console.error('Error in /api/flashcards:', error);
    res.status(500).json({ 
      error: 'Failed to generate flashcards',
      details: error.message 
    });
  }
});

// Quiz generation endpoint
app.post('/api/quiz', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const prompt = `Generate 5 multiple choice quiz questions for the topic: "${topic}". 

Format your response as a valid JSON array of objects, where each object has:
- "question": the quiz question
- "options": array of 4 possible answers
- "correctAnswer": the correct answer (must match one of the options exactly)
- "explanation": brief explanation of why the answer is correct

Return ONLY the JSON array, no additional text or formatting.

Example format:
[
  {
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Option B is correct because..."
  }
]

Topic: ${topic}`;

  console.log('🧠 Generating quiz for:', topic);
  // Force the model to return raw JSON only for easier parsing
  const quizPrompt = `${prompt}\n\nIMPORTANT: Return ONLY the JSON array, with no extra text, numbered lists, or markdown. Use the exact keys shown in the example.`;
  let response = await callGeminiWithRetry(quizPrompt, { expect: 'json' });
  const parsed = extractJsonArray(response || '');
  if (!parsed || !validateQuiz(parsed)) {
    logBadResponse('/api/quiz', quizPrompt, response);
    const retry = await callGeminiWithRetry(quizPrompt + "\n\nIMPORTANT: Return ONLY the raw JSON array exactly as shown. No commentary.", { expect: 'json' });
    const parsed2 = extractJsonArray(retry || '');
    if (parsed2 && validateQuiz(parsed2)) {
      response = retry;
    } else {
      return res.json({ response, warning: 'AI output could not be validated; returned raw text.' });
    }
  }

  res.json({ response });
  } catch (error) {
    console.error('Error in /api/quiz:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    geminiApiConfigured: !!GEMINI_API_KEY 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Gemini API configured: ${!!GEMINI_API_KEY}`);
  console.log('📡 Available endpoints:');
  console.log('  POST /api/ask - General chat');
  console.log('  POST /api/flashcards - Generate flashcards');
  console.log('  POST /api/quiz - Generate quiz');
  console.log('  GET  /api/health - Health check');
});
