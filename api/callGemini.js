// api/callGemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_ENDPOINT = process.env.GEMINI_ENDPOINT || 'https://api.generativeai.google.com/v1/models/text-bison-001:generate';

  if (!GEMINI_KEY) return res.status(500).json({ error: 'Server not configured' });

  try {
    const payload = {
      prompt: prompt,
      maxOutputTokens: 256,
      temperature: 0.2
    };

    const r = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Upstream error', details: data });

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
