import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import { createWorker } from 'tesseract.js';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
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
    const { data, error } = await supabase.storage
      .from('quiz-files')
      .createSignedUploadUrl(`${Date.now()}_${fileName}`);

    if (error) throw error;

    res.json({
      url: data.signedUrl,
      token: data.token,
      contentLength: req.headers['content-length']
    });
  } catch (err) {
    console.error('Error generating upload URL:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to validate quiz questions
const validateQuizQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    throw new Error('Quiz questions must be an array');
  }

  const validatedQuestions = questions.filter((question) => {
    if (!question.question || typeof question.question !== 'string') {
      return false;
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      return false;
    }

    if (
      !question.correctAnswer ||
      typeof question.correctAnswer !== 'string' ||
      !question.options.includes(question.correctAnswer)
    ) {
      return false;
    }

    return true;
  });

  return validatedQuestions;
};

// File processing endpoint with error handling
app.post('/api/process-file', async (req, res) => {
  const { fileUrl, fileType } = req.body;

  try {
    // Step 1: Extract text from the file
    let extractedText;
    try {
      if (fileType === 'application/pdf') {
        extractedText = await extractTextFromPDF(fileUrl);
      } else if (fileType.startsWith('image/')) {
        extractedText = await extractTextFromImage(fileUrl);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedText = await extractTextFromDOCX(fileUrl);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        extractedText = await extractTextFromXLSX(fileUrl);
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (err) {
      console.error('Error extracting text:', err);
      throw new Error(`Failed to extract text from file: ${err.message}`);
    }

    // Step 2: Use OpenAI to generate quiz questions
    let quizQuestions;
    try {
      quizQuestions = await generateQuizQuestions(extractedText);
    } catch (err) {
      console.error('Error generating quiz questions:', err);
      throw new Error(`Failed to generate quiz questions: ${err.message}`);
    }

    // Step 3: Validate the quiz questions
    let validatedQuestions;
    try {
      validatedQuestions = validateQuizQuestions(quizQuestions);
    } catch (err) {
      console.error('Error validating quiz questions:', err);
      throw new Error(`Failed to validate quiz questions: ${err.message}`);
    }

    if (validatedQuestions.length === 0) {
      throw new Error('No valid questions were generated');
    }

    res.json({ success: true, questions: validatedQuestions });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to extract text from PDF
const extractTextFromPDF = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const data = await pdf(Buffer.from(buffer));
    return data.text;
  } catch (err) {
    throw new Error(`Failed to extract PDF text: ${err.message}`);
  }
};

// Helper function to extract text from images (OCR)
const extractTextFromImage = async (fileUrl) => {
  try {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(fileUrl);
    await worker.terminate();
    return text;
  } catch (err) {
    throw new Error(`Failed to extract text from image: ${err.message}`);
  }
};

// Helper function to extract text from DOCX
const extractTextFromDOCX = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  } catch (err) {
    throw new Error(`Failed to extract DOCX text: ${err.message}`);
  }
};

// Helper function to extract text from XLSX
const extractTextFromXLSX = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    let extractedText = '';

    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row) => {
        const rowText = row.values.slice(1).join(', ');
        extractedText += rowText + '\n';
      });
    });

    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from XLSX:', error);
    throw new Error(`Failed to extract text from XLSX: ${error.message}`);
  }
};

// Helper function to generate quiz questions using OpenAI
const generateQuizQuestions = async (text) => {
  const prompt = `Generate 5 quiz questions based on the following text:\n\n${text}\n\nFormat the questions as a JSON array: [{ "question": "...", "options": ["...", "..."], "correctAnswer": "..." }]`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo-0125",
  });

  return JSON.parse(completion.choices[0].message.content);
};

// Add error middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Update all error responses to use JSON
res.status(500).json({ 
  error: 'Internal Server Error',
  message: error.message 
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});