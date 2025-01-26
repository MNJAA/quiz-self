import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets with proper headers
app.use('/assets', express.static(path.join(__dirname, '../dist/assets'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
  }
}));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// API Endpoint
app.post('/api/test-openai', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Create one simple math question" }],
      model: "gpt-3.5-turbo",
    });
    res.json({ question: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve HTML for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

export default app;