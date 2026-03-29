import { toSheetRows } from '../server/formatter.js';
import { appendToSheet, parseSheetId } from '../server/sheets.js';

export const config = { runtime: 'nodejs' };

function jsonError(res, code, msg) {
  console.error('EXPORT_FAILED:', msg);
  return res.status(code).json({ error: msg });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return jsonError(res, 405, 'Only POST allowed');
    const { sheetUrlOrId, payload } = req.body || {};
    if (!sheetUrlOrId) {
      return jsonError(res, 400, 'sheetUrlOrId is required');
    }
    if (!payload?.passage || !Array.isArray(payload?.questions)) {
      return jsonError(res, 400, 'payload with passage and questions is required');
    }
    if (payload.questions.length === 0) {
      return jsonError(res, 400, 'At least one question is required for export');
    }
    const invalid = payload.questions.some((q) => {
      const qtext = String(q?.question || '').trim();
      const opts = Array.isArray(q?.options) ? q.options : [];
      if (!qtext) return true;
      if (opts.length < 4) return true;
      return false;
    });
    if (invalid) {
      return jsonError(res, 400, 'Each question must have text and 4 options');
    }

    const sheetId = parseSheetId(sheetUrlOrId);
    const values = toSheetRows(payload);
    const result = await appendToSheet({ sheetId, values, sheetName: process.env.SHEETS_TAB_NAME || 'Sheet1' });

    res.json({ ok: true, updates: result?.updates });
  } catch (e) {
    const msg = e?.errors?.[0]?.message || e?.response?.data?.error?.message || e?.message || String(e);
    console.error('Export error:', msg);
    res.status(500).json({ error: `Failed to export to Google Sheets: ${msg}` });
  }
}

