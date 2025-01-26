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
  process.env.SUPABASE_ANON_KEY // Use service key for bypassing RLS during development
);

// Generate Supabase upload URL
app.post('/api/generate-upload-url', async (req, res) => {
  const { fileName, fileType } = req.body;
  
  try {
    const { data, error } = await supabase.storage
      .from('quiz-self-storage') // Updated bucket name
      .createSignedUploadUrl(`${Date.now()}_${fileName}`);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      url: data.signedUrl,
      token: data.token
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});