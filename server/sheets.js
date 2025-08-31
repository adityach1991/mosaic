import { google } from 'googleapis';
import fs from 'fs';

export function parseSheetId(urlOrId) {
  if (!urlOrId) throw new Error('Missing sheet URL or ID');
  const s = String(urlOrId).trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  // if it looks like an ID already, return as-is
  if (/^[a-zA-Z0-9-_]{30,}$/.test(s)) return s;
  throw new Error('Could not parse Google Sheet ID');
}

function decodeIfBase64(s) {
  try {
    const buf = Buffer.from(s, 'base64');
    const text = buf.toString('utf8');
    if (text.includes('-----BEGIN')) return text;
  } catch {}
  return null;
}

function normalizePrivateKey(raw) {
  if (!raw) return '';
  let key = String(raw);
  // If looks like JSON with private_key field, parse it
  if (key.trim().startsWith('{')) {
    try {
      const obj = JSON.parse(key);
      if (obj.private_key) return String(obj.private_key);
    } catch {}
  }
  // Replace escaped newlines
  key = key.replace(/\\n/g, '\n');
  // If base64 encoded, decode
  if (!key.includes('-----BEGIN')) {
    const decoded = decodeIfBase64(key);
    if (decoded) key = decoded;
  }
  return key;
}

function getJwtClient() {
  // 1) Prefer full JSON via path
  const jsonPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (jsonPath) {
    const jsonStr = fs.readFileSync(jsonPath, 'utf8');
    const creds = JSON.parse(jsonStr);
    const auth = google.auth.fromJSON(creds);
    auth.scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    return auth;
  }

  // 2) JSON string in env (or base64)
  const jsonInline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (jsonInline) {
    const jsonStr = jsonInline.includes('{') ? jsonInline : Buffer.from(jsonInline, 'base64').toString('utf8');
    const creds = JSON.parse(jsonStr);
    const auth = google.auth.fromJSON(creds);
    auth.scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    return auth;
  }

  // 3) Email + Private key
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = normalizePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials are not set. Provide GOOGLE_APPLICATION_CREDENTIALS, or GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_KEY');
  }
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Invalid private key format. Ensure it contains -----BEGIN PRIVATE KEY----- and proper newlines. If stored in one line, use \\n escapes or base64.');
  }
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getLastDataRow({ sheetId, sheetName = 'Sheet1' }) {
  const auth = getJwtClient();
  const sheets = google.sheets({ version: 'v4', auth });
  // Fetch A:D to detect any non-empty cell across first 4 columns
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!A:D`,
    majorDimension: 'ROWS',
  });
  const rows = res.data.values || [];
  return rows.length; // trailing empty rows are trimmed by API
}

export async function appendToSheet({ sheetId, values, sheetName = 'Sheet1' }) {
  const auth = getJwtClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const last = await getLastDataRow({ sheetId, sheetName });
  const startRow = (last || 0) + 1; // 1-based
  const range = `'${sheetName}'!A${startRow}`;
  // Ensure a visible blank separator between blocks: if there is existing data,
  // prepend an empty row before writing the next block so the previous block's
  // last non-empty row (typically an option) is followed by a blank line.
  const toWrite = (last > 0) ? [[], ...values] : values;
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: toWrite,
      majorDimension: 'ROWS',
    },
  });
  return response.data;
}

export async function readRange({ sheetId, range }) {
  const auth = getJwtClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}
