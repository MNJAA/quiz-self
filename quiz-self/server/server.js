import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

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
      model: "gpt-3.5-turbo-0125",
    });

    res.json({ 
      success: true,
      question: completion.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});