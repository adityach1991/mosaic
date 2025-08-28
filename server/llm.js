import { GoogleGenerativeAI } from '@google/generative-ai';

function coerceCorrectIndex(q, options) {
  const val = q?.correct_index ?? q?.correctIndex ?? q?.answer_index ?? q?.answerIndex ?? q?.answer;
  const opts = Array.isArray(options) ? options : [];

  // number 0-3
  if (Number.isInteger(val) && val >= 0 && val <= 3) return val;
  // number 1-4
  if (Number.isInteger(val) && val >= 1 && val <= 4) return val - 1;

  // string digits
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^[0-3]$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^[1-4]$/.test(trimmed)) return parseInt(trimmed, 10) - 1;
    if (/^[A-Da-d]$/.test(trimmed)) return trimmed.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  }

  // string equal to option text
  if (typeof val === 'string' && opts.length) {
    const idx = opts.findIndex(o => String(o).trim().toLowerCase() === val.trim().toLowerCase());
    if (idx >= 0) return idx;
  }

  return 0; // fallback
}

function ensureEnv() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return key;
}

function parseModelList(primary) {
  const envPrimary = primary || process.env.GEMINI_MODEL;
  const fallbacks = (process.env.GEMINI_MODEL_FALLBACKS || '').split(',').map(s => s.trim()).filter(Boolean);
  const defaults = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];
  const list = [];
  if (envPrimary) list.push(envPrimary);
  list.push(...fallbacks);
  for (const d of defaults) if (!list.includes(d)) list.push(d);
  return list;
}

async function tryGenerate(genAI, model, prompt, attempt = 0) {
  const m = genAI.getGenerativeModel({ model });
  try {
    const resp = await m.generateContent(prompt);
    return resp?.response?.text?.();
  } catch (err) {
    const status = err?.status || err?.response?.status;
    const msg = err?.message || '';
    const retriable = status === 429 || status === 503 || /overloaded|rate|unavailable/i.test(msg);
    if (retriable && attempt < 3) {
      const delay = Math.min(4000, 300 * Math.pow(2, attempt)) + Math.floor(Math.random() * 200);
      await new Promise(r => setTimeout(r, delay));
      return tryGenerate(genAI, model, prompt, attempt + 1);
    }
    throw err;
  }
}

export async function callGemini({ prompt, model }) {
  const key = ensureEnv();
  const genAI = new GoogleGenerativeAI(key);
  const models = parseModelList(model);
  let lastErr;
  for (const m of models) {
    try {
      const text = await tryGenerate(genAI, m, prompt);
      if (!text) throw new Error('Empty response from model');

      const cleaned = text.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw e;
      }

      if (!Array.isArray(parsed.questions)) parsed.questions = [];
      parsed.questions = parsed.questions.map((q) => {
        const options = Array.isArray(q.options) ? q.options.slice(0, 4).map((o) => String(o)) : [];
        const correct_index = coerceCorrectIndex(q, options);
        return {
          question: String(q.question || '').trim(),
          options,
          correct_index: (correct_index >= 0 && correct_index < 4) ? correct_index : 0,
          explanation: String(q.explanation || '').trim(),
        };
      });

      return parsed;
    } catch (err) {
      lastErr = err;
      // try next model
    }
  }
  throw lastErr || new Error('Gemini call failed');
}
