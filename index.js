import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { prompts } from './prompts.js';

const app = express();
const client = new Anthropic();

app.use(express.json({ limit: '2mb' }));

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true);

    const allowed = process.env.ALLOWED_ORIGIN;

    if (
      origin === allowed ||
      origin.endsWith('.salesforce.com') ||
      origin.endsWith('.force.com')
    ) {
      callback(null, true);
    } else {
      console.log('[BACKEND] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.post('/analyze', async (req, res) => {
  const dealContext = req.body;
  console.log('[BACKEND] Received analyze request');
  console.log('[BACKEND] Quote ID:', dealContext?.quote?.Id);

  try {
    const [flags, discount] = await Promise.all([
      callClaude(prompts.flags(dealContext)),
      callClaude(prompts.discount(dealContext))
    ]);

    console.log('[BACKEND] Flags and discount done');

    const justification = await callClaude(
      prompts.justification(dealContext, flags, discount)
    );

    console.log('[BACKEND] Justification done');

    res.json({ flags, discount, justification });

  } catch (err) {
    console.error('[BACKEND] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

async function callClaude(prompt) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const text = response.content[0].text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Backend running on port ${process.env.PORT || 3000}`
  );
});