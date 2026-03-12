import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { buildSystemPrompt } from './promptContext.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Venice AI is OpenAI-compatible — just swap the baseURL and key.
// Falls back to OpenAI if VENICE_API_KEY is not set.
const VENICE_KEY = process.env.VENICE_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const client = VENICE_KEY
  ? new OpenAI({
      apiKey: VENICE_KEY,
      baseURL: 'https://api.venice.ai/api/v1',
    })
  : OPENAI_KEY
  ? new OpenAI({ apiKey: OPENAI_KEY })
  : null;

// Venice model — use a capable instruction model. Swap to 'llama-3.1-405b' for max quality.
const CHAT_MODEL = process.env.CHAT_MODEL || (VENICE_KEY ? 'llama-3.3-70b' : 'gpt-4o-mini');

const provider = VENICE_KEY ? 'Venice AI' : OPENAI_KEY ? 'OpenAI' : null;

app.post('/api/chat', async (req, res) => {
  if (!client) {
    return res.status(503).json({
      error: 'Chat not configured',
      detail: 'Set VENICE_API_KEY (or OPENAI_API_KEY) in server/.env to enable the Dream Home analyst.',
    });
  }

  const { messages = [], projectSummary = null } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Body must include messages (array of { role, content }).' });
  }

  const projectSummaryJson =
    projectSummary && typeof projectSummary === 'object'
      ? JSON.stringify(projectSummary, null, 0)
      : null;
  const systemPrompt = buildSystemPrompt(projectSummaryJson);

  try {
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 1024,
      temperature: 0.4,
    });

    const choice = completion.choices?.[0];
    if (!choice?.message?.content) {
      return res.status(502).json({ error: 'Empty response from model' });
    }

    return res.json({ message: { role: 'assistant', content: choice.message.content } });
  } catch (err) {
    const status = err.status === 401 ? 401 : err.status === 429 ? 429 : 502;
    const message = err.message || 'Failed to get response from model';
    return res.status(status).json({ error: 'Chat request failed', detail: message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Chat server listening on http://localhost:${port}`);
  if (provider) {
    console.log(`Using ${provider} — model: ${CHAT_MODEL}`);
  } else {
    console.warn('No AI key set — POST /api/chat will return 503. Add VENICE_API_KEY to server/.env');
  }
});
