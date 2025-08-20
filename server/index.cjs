const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

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

// Routes

// General chat endpoint
app.post('/api/ask', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🤖 Processing chat request...');
    const response = await callGeminiAPI(prompt);
    
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

Return ONLY the JSON array, no additional text or formatting.

Example format:
[
  {
    "question": "What is the main concept?",
    "answer": "The main concept is..."
  }
]

Topic: ${topic}`;

    console.log('📚 Generating flashcards for:', topic);
    const response = await callGeminiAPI(prompt);
    
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
    const response = await callGeminiAPI(prompt);
    
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
