import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
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
      contentLength: req.headers['content-length'] // Include content length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File processing endpoint
app.post('/api/process-file', async (req, res) => {
  const { fileUrl, fileType } = req.body;

  try {
    // Step 1: Extract text from the file
    let extractedText;
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

    // Step 2: Use OpenAI to generate quiz questions
    const quizQuestions = await generateQuizQuestions(extractedText);

    res.json({ success: true, questions: quizQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to extract text from PDF
const extractTextFromPDF = async (fileUrl) => {
  // Use a library like pdf-parse or pdf-lib
  // Example: https://www.npmjs.com/package/pdf-parse
  return "Extracted text from PDF";
};

// Helper function to extract text from images (OCR)
const extractTextFromImage = async (fileUrl) => {
  // Use Tesseract.js for OCR
  // Example: https://github.com/naptha/tesseract.js
  return "Extracted text from image";
};

// Helper function to extract text from DOCX
const extractTextFromDOCX = async (fileUrl) => {
  // Use a library like mammoth
  // Example: https://www.npmjs.com/package/mammoth
  return "Extracted text from DOCX";
};

// Helper function to extract text from XLSX
const extractTextFromXLSX = async (fileUrl) => {
  try {
    // Fetch the file
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    // Load the workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    let extractedText = '';

    // Iterate through each worksheet
    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row) => {
        // Extract cell values and join them with commas
        const rowText = row.values.slice(1).join(', ');
        extractedText += rowText + '\n';
      });
    });

    return extractedText.trim(); // Remove trailing newline
  } catch (error) {
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

// Add this function to validate quiz questions
const validateQuizQuestions = (questions) => {
  if (!Array.isArray(questions)) {
    throw new Error('Quiz questions must be an array');
  }

  const validatedQuestions = questions.filter((question) => {
    // Check if the question has a valid question text
    if (!question.question || typeof question.question !== 'string') {
      return false;
    }

    // Check if the question has at least 2 options
    if (!Array.isArray(question.options) || question.options.length < 2) {
      return false;
    }

    // Check if the correctAnswer is valid and matches one of the options
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

// Update the /api/process-file endpoint to include validation
app.post('/api/process-file', async (req, res) => {
  const { fileUrl, fileType } = req.body;

  try {
    // Step 1: Extract text from the file
    let extractedText;
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

    // Step 2: Use OpenAI to generate quiz questions
    const quizQuestions = await generateQuizQuestions(extractedText);

    // Step 3: Validate the quiz questions
    const validatedQuestions = validateQuizQuestions(quizQuestions);

    if (validatedQuestions.length === 0) {
      throw new Error('No valid questions were generated');
    }

    res.json({ success: true, questions: validatedQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});