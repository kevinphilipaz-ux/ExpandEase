import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { buildSystemPrompt } from './promptContext.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini';

app.post('/api/chat', async (req, res) => {
  if (!openai) {
    return res.status(503).json({
      error: 'Chat not configured',
      detail: 'Set OPENAI_API_KEY in the server .env to enable the Dream Home analyst.',
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
    const completion = await openai.chat.completions.create({
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
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set — POST /api/chat will return 503 until you add it.');
  }
});
