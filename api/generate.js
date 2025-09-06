import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from 'googleapis';

export const config = { runtime: 'nodejs' };

function sheetIdFromUrl(urlOrId) {
  const m = String(urlOrId || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : urlOrId;
}

function jsonError(res, code, msg, extra = {}) {
  console.error('GENERATION_FAILED:', msg, extra);
  return res.status(code).json({ ok: false, error: msg, ...extra });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return jsonError(res, 405, 'Only POST allowed');

    const body = req.body || {};
    console.log('incoming body keys:', Object.keys(body));

    // 1) Gemini client with fallbacks
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return jsonError(res, 500, 'GEMINI_API_KEY missing');

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidates = [
      process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      ...(process.env.GEMINI_MODEL_FALLBACKS || 'gemini-1.5-flash').split(','),
    ]
      .map((s) => s.trim())
      .filter(Boolean);

    let model = null,
      modelName = null;
    for (const name of candidates) {
      try {
        model = genAI.getGenerativeModel({ model: name });
        modelName = name;
        break;
      } catch (e) {
        console.warn('Model init failed:', name, e?.message || e);
      }
    }
    if (!model) return jsonError(res, 500, 'No Gemini model available');

    // 2) Generate (replace prompt with your logic)
    const prompt = body.prompt || 'Generate a short test passage.';
    const resp = await model.generateContent(prompt);
    const text =
      resp?.response?.text?.() ||
      resp?.response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') ||
      '';
    if (!text) return jsonError(res, 500, 'Gemini returned empty content');

    // 3) Sheets: auth via single JSON env (preferred) OR split vars
    let creds = null;
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      try {
        creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      } catch (e) {
        return jsonError(res, 500, 'GOOGLE_CREDENTIALS_JSON is not valid JSON');
      }
    } else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      creds = {
        project_id: process.env.GOOGLE_PROJECT_ID,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    } else {
      return jsonError(res, 500, 'Google credentials not set (JSON or split vars)');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = sheetIdFromUrl(body.googleSheetLink || body.sheetId);
    if (!spreadsheetId) return jsonError(res, 400, 'Missing Google Sheet link/ID');

    const sheetName = body.sheetName || process.env.SHEETS_TAB_NAME || 'Sheet1';

    // 4) Append a single row (adjust for your format)
    const values = [[new Date().toISOString(), modelName, text.slice(0, 200)]];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return res.status(200).json({ ok: true, model: modelName, preview: text.slice(0, 500) });
  } catch (e) {
    return jsonError(res, 500, 'Unhandled error', { message: e?.message, stack: e?.stack });
  }
}

