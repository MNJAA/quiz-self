import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test endpoint for OpenAI integration
app.post('/api/test-openai', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Create one simple math question" }],
      model: "gpt-3.5-turbo",
    });

    res.json({ 
      success: true,
      question: completion.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files for the frontend
app.use(express.static('dist'));

// Catch-all route for frontend routing
app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: '.' });
});

// Export the app for Vercel
export default app;