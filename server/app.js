import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPrompt } from './promptTemplates.js';
import { callGemini } from './llm.js';
import { toSheetRows } from './formatter.js';
import { appendToSheet, parseSheetId } from './sheets.js';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files for local development; Vercel serves from /public automatically
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health endpoint (preserve existing path)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { subject, subtopic, questionsPerPassage = 10, tone, customTopic, articleUrl } = req.body || {};
    if (!subject || !subtopic) {
      return res.status(400).json({ error: 'subject and subtopic are required' });
    }

    const prompt = buildPrompt({ subject, subtopic, questionsPerPassage, tone, customTopic, articleUrl });
    const result = await callGemini({ prompt, model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    // result must be { passage: string, questions: [ {question, options[4], correct_index, explanation} ] }
    if (!result?.passage || !Array.isArray(result?.questions)) {
      return res.status(502).json({ error: 'LLM output could not be parsed' });
    }
    res.json(result);
  } catch (err) {
    console.error('Generate error:', err?.message || err, err?.response?.data || '');
    const msg = err?.message || 'Failed to generate content';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { sheetUrlOrId, payload } = req.body || {};
    if (!sheetUrlOrId) {
      return res.status(400).json({ error: 'sheetUrlOrId is required' });
    }
    if (!payload?.passage || !Array.isArray(payload?.questions)) {
      return res.status(400).json({ error: 'payload with passage and questions is required' });
    }
    if (payload.questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required for export' });
    }
    // Validate questions have text and at least 4 options
    const invalid = payload.questions.some((q) => {
      const qtext = String(q?.question || '').trim();
      const opts = Array.isArray(q?.options) ? q.options : [];
      if (!qtext) return true;
      if (opts.length < 4) return true;
      // allow empty option text but prefer non-empty
      return false;
    });
    if (invalid) {
      return res.status(400).json({ error: 'Each question must have text and 4 options' });
    }

    const sheetId = parseSheetId(sheetUrlOrId);
    const values = toSheetRows(payload);
    const result = await appendToSheet({ sheetId, values, sheetName: process.env.SHEETS_TAB_NAME || 'Sheet1' });

    res.json({ ok: true, updates: result?.updates });
  } catch (err) {
    const gerr = err?.errors?.[0]?.message || err?.response?.data?.error?.message || err?.message || String(err);
    console.error('Export error:', gerr);
    res.status(500).json({ error: `Failed to export to Google Sheets: ${gerr}` });
  }
});

export default app;

