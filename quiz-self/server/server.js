import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Test OpenAI endpoint
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

// Generate Supabase upload URL
app.post('/api/generate-upload-url', async (req, res) => {
  const { fileName, fileType } = req.body;
  
  try {
    const { data, error } = await supabase.storage
      .from('quiz-files')
      .createSignedUploadUrl(`${Date.now()}_${fileName}`);

    if (error) throw error;
    
    res.json({
      url: data.signedUrl,
      token: data.token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});