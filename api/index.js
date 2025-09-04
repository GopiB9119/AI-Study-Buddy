import { json } from 'micro';
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGeminiAPI(prompt) {
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
            { text: prompt }
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
    throw new Error(`Gemini API error: ${response.status}`);
  }
  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Invalid response format from Gemini API');
  }
}

export default async (req, res) => {
  if (req.method === 'POST') {
    try {
      const body = await json(req);
      const { prompt } = body;
      if (!prompt) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Prompt is required' }));
        return;
      }
      const response = await callGeminiAPI(prompt);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ response }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.statusCode = 405;
    res.end('Method Not Allowed');
  }
};
