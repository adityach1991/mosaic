import { google } from 'googleapis';

export function parseSheetId(urlOrId) {
  if (!urlOrId) throw new Error('Missing sheet URL or ID');
  const s = String(urlOrId).trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  // if it looks like an ID already, return as-is
  if (/^[a-zA-Z0-9-_]{30,}$/.test(s)) return s;
  throw new Error('Could not parse Google Sheet ID');
}

let cachedSheets = null;
function getSheetsClient() {
  if (cachedSheets) return cachedSheets;
  const raw = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!raw) {
    throw new Error('Missing GOOGLE_CREDENTIALS_JSON env var with full service account JSON');
  }
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch (e) {
    throw new Error('GOOGLE_CREDENTIALS_JSON is not valid JSON');
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  cachedSheets = google.sheets({ version: 'v4', auth });
  return cachedSheets;
}

async function getLastDataRow({ sheetId, sheetName = 'Sheet1' }) {
  const sheets = getSheetsClient();
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
  const sheets = getSheetsClient();

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
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}
