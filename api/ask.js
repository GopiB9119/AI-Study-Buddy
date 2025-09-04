const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiAPI(prompt) {
  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
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
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        const text = await response.text();
        // Handle rate limit specifically
        if (status === 429 && attempt < maxRetries) {
          const retryAfter = response.headers && response.headers.get ? response.headers.get('retry-after') : null;
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
          console.warn(`Gemini 429 received, retrying after ${waitMs}ms (attempt ${attempt + 1})`);
          await sleep(waitMs);
          attempt++;
          continue;
        }
        throw new Error(`Gemini API error: ${status} ${text}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error('Invalid response format from Gemini API');
    } catch (err) {
      lastError = err;
      // If it's a transient network error, retry a bit
      if (attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 1000;
        console.warn(`Transient error calling Gemini API, retrying in ${waitMs}ms:`, err.message || err);
        await sleep(waitMs);
        attempt++;
        continue;
      }
      // no more retries
      throw lastError;
    }
  }
  throw lastError || new Error('Unknown Gemini API error');
}

export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }
      const response = await callGeminiAPI(prompt);
      res.status(200).json({ response });
    } catch (error) {
      console.error('Error in /api/ask:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};
