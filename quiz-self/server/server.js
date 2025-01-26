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

// Generate Supabase upload URL
app.post('/api/generate-upload-url', async (req, res) => {
  const { fileName, fileType } = req.body;
  
  try {
    console.log('Generating upload URL for:', fileName);
    
    // Ensure the bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket('quiz-files');

    if (bucketError) {
      console.error('Bucket error:', bucketError);
      throw bucketError;
    }

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from('quiz-files')
      .createSignedUploadUrl(`${Date.now()}_${fileName}`);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Signed URL generated:', data.signedUrl);
    res.json({
      url: data.signedUrl,
      token: data.token
    });
  } catch (err) {
    console.error('Error generating upload URL:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});