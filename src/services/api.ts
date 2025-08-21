import { Flashcard } from '../types/flashcard';
import { QuizQ, QuestionWithExplanation } from '../types/quiz';

const API_BASE = '/api';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Helper function to make requests to Gemini API via our proxy
async function callGemini(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get AI response');
  }
}

// Clean up numbered/step-formatted responses so they read well in the UI.
function cleanNumberedSteps(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let s = text;

  // Ensure there is a space after numbered markers like "1." or "1)" when missing: "1.Step" -> "1. Step"
  s = s.replace(/(\d+)([\.\)])(?=\S)/g, '$1$2 ');

  // Insert a newline before any numbered step that directly follows text (e.g. "...text1.")
  // We add a newline when a digit+dot sequence appears and the previous character is not a newline.
  s = s.replace(/([^\n])(?:\s*)(\d+\.)/g, '$1\n$2');

  // Also handle patterns where numbers are concatenated like "1.2.3." — break before each numbered token
  s = s.replace(/(\d+\.)/g, '\n$1');

  // Convert sequences of multiple newlines into a single blank line
  s = s.replace(/\n{2,}/g, '\n\n');

  // Trim leading/trailing whitespace
  s = s.trim();

  return s;
}

// Basic chat functionality
export async function askAI(question: string): Promise<string> {
  const prompt = `You are a helpful study buddy AI. Answer the following question in a clear, educational way:

Question: ${question}

Please provide a comprehensive but concise answer that helps the user learn.`;

  const raw = await callGemini(prompt);
  return cleanNumberedSteps(raw);
}

// Generate flashcards for a given topic
export async function generateFlashcards(topic: string): Promise<Flashcard[]> {
  const prompt = `Generate 6 educational flashcards for the topic: "${topic}". 

Format your response as a valid JSON array of objects, where each object has "question" and "answer" properties. Make sure the questions are clear and the answers are informative but concise.

Example format:
[
  {
    "question": "What is the main concept?",
    "answer": "The main concept is..."
  }
]

Topic: ${topic}`;

  try {
    const response = await callGemini(prompt);
    const cleaned = cleanNumberedSteps(response);
    // Try to extract JSON from the cleaned response
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const flashcards = JSON.parse(jsonMatch[0]);
      return flashcards.map((card: any, index: number) => ({
        ...card,
        id: `flashcard-${index}-${Date.now()}`
      }));
    }
    
    // Fallback if JSON parsing fails
    return [
      {
        id: `fallback-${Date.now()}`,
        question: `What is ${topic}?`,
        answer: response.substring(0, 200) + '...'
      }
    ];
  } catch (error) {
    console.error('Error generating flashcards:', error);
    // Return fallback flashcards
    return [
      {
        id: `error-${Date.now()}`,
        question: `Tell me about ${topic}`,
        answer: 'Sorry, I could not generate flashcards at this time. Please try again.'
      }
    ];
  }
}

// Generate quiz questions for a given topic
export async function generateQuiz(topic: string): Promise<QuizQ[]> {
  const prompt = `Generate 5 multiple choice quiz questions for the topic: "${topic}". 

Format your response as a valid JSON array of objects, where each object has:
- "question": the quiz question
- "options": array of 4 possible answers
- "correctAnswer": the correct answer (must match one of the options exactly)
- "explanation": brief explanation of why the answer is correct

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

  try {
    const response = await callGemini(prompt);
    const cleaned = cleanNumberedSteps(response);
    // Try to extract JSON from the cleaned response
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const quizQuestions = JSON.parse(jsonMatch[0]);
      return quizQuestions.map((q: any, index: number) => ({
        ...q,
        id: `quiz-${index}-${Date.now()}`
      }));
    }
    
    // Fallback if JSON parsing fails
    return [
      {
        id: `fallback-${Date.now()}`,
        question: `What is the most important concept in ${topic}?`,
        options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
        correctAnswer: 'Concept A',
        explanation: 'This is a fallback question. Please try generating the quiz again.'
      }
    ];
  } catch (error) {
    console.error('Error generating quiz:', error);
    // Return fallback quiz
    return [
      {
        id: `error-${Date.now()}`,
        question: `Sorry, could not generate quiz for ${topic}`,
        options: ['Try again', 'Check connection', 'Refresh page', 'Contact support'],
        correctAnswer: 'Try again',
        explanation: 'There was an error generating the quiz. Please try again.'
      }
    ];
  }
}

// Generate 100+ company-specific questions with explanations and no options
export async function generateCompanyQuestions(topic: string): Promise<QuestionWithExplanation[]> {
  const prompt = `Generate 100+ company-specific interview questions with detailed explanations for the topic: "${topic}". 

Format your response as a valid JSON array of objects, where each object has:
- "question": the interview question
- "answer": the detailed explanation for the question

Example format:
[
  {
    "question": "What is...?",
    "answer": "This is the detailed explanation for the question."
  }
]

Topic: ${topic}`;

  try {
    const response = await callGemini(prompt);
    const cleaned = cleanNumberedSteps(response);
    // Try to extract JSON from the cleaned response
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const companyQuestions = JSON.parse(jsonMatch[0]);
      return companyQuestions.map((q: any, index: number) => ({
        question: q.question,
        explanation: q.answer,
        id: `company-${index}-${Date.now()}`
      }));
    }
    
    // Fallback if JSON parsing fails
    return [
      {
        id: `fallback-${Date.now()}`,
        question: `What is the most important concept in ${topic}?`,
        explanation: 'This is a fallback explanation. Please try generating the questions again.'
      }
    ];
  } catch (error) {
    console.error('Error generating company-specific questions:', error);
    // Return fallback questions
    return [
      {
        id: `error-${Date.now()}`,
        question: `Sorry, could not generate questions for ${topic}`,
        explanation: 'There was an error generating the questions. Please try again.'
      }
    ];
  }
}
