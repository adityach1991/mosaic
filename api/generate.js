import { buildPrompt } from '../server/promptTemplates.js';
import { callGemini } from '../server/llm.js';

export const config = { runtime: 'nodejs' };

function jsonError(res, code, msg, extra = {}) {
  console.error('GENERATE_FAILED:', msg, extra);
  return res.status(code).json({ error: msg, ...extra });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return jsonError(res, 405, 'Only POST allowed');

    const { subject, subtopic, questionsPerPassage = 10, tone, customTopic, articleUrl } = req.body || {};
    if (!subject || !subtopic) {
      return jsonError(res, 400, 'subject and subtopic are required');
    }

    const prompt = buildPrompt({ subject, subtopic, questionsPerPassage, tone, customTopic, articleUrl });
    const result = await callGemini({ prompt, model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

    if (!result?.passage || !Array.isArray(result?.questions)) {
      return jsonError(res, 502, 'LLM output could not be parsed');
    }
    res.json(result);
  } catch (e) {
    return jsonError(res, 500, e?.message || 'Unhandled error');
  }
}
