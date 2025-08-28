const COMMON_JSON_SCHEMA = `
You must output strict JSON only (no markdown, no commentary) with this exact schema. Important: correct_index is 0-based (A=0, B=1, C=2, D=3).
{
  "passage": string, // the passage text
  "questions": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correct_index": 0 | 1 | 2 | 3, // 0-based index of the correct option
      "explanation": string
    }
  ]
}
Ensure options are close and plausible. Do NOT include answer letters; only correct_index.
`;

function englishTemplate({ subtopic, questionsPerPassage, tone }) {
  const count = Math.max(1, Math.min(10, Number(questionsPerPassage) || 6));
  const styleTone = tone || 'narrative/critical/descriptive (choose the most fitting)';
  return `Generate a 400–500 word passage in ${styleTone} tone on ${subtopic}.
Then create ${count} MCQs with 4 close options each. Mix:
- 1 central idea
- 1 author’s tone
- 1 inference
- 1 word/phrase meaning
- remaining factual detail questions.
Format as JSON.\n\n${COMMON_JSON_SCHEMA}`;
}

function currentAffairsTemplate({ subtopic, questionsPerPassage }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  return `Generate a 400–500 word journalistic-style passage based on ${subtopic}.
Use analysis + facts, avoid trivia style.
Create ${count} MCQs (approx 6 factual recall with close distractors, 2 fact-not-in-passage, 2 inference/application).
Provide output as JSON.\n\n${COMMON_JSON_SCHEMA}`;
}

function legalTemplate({ subtopic, questionsPerPassage }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  return `Generate a 350–450 word legal reasoning passage explaining ${subtopic}.
Include its scope, limitations, and 1–2 fictional illustrations.
Then create ${count} MCQs (6–7 application to fact scenarios, 2 inference, 1 principle recall).
Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

function logicalTemplate({ subtopic, questionsPerPassage }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  return `Generate a 400–500 word passage on ${subtopic} with a neutral, editorial tone.
Create ${count} MCQs testing inference, strengthen/weaken, assumptions, principles.
Ensure options are very close and tricky.
Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

function quantTemplate({ subtopic, questionsPerPassage }) {
  const count = Math.max(1, Math.min(10, Number(questionsPerPassage) || 6));
  return `Generate a 180–480 word passage introducing a dataset (table/graph/survey) about ${subtopic}.
Include numerical data (e.g., revenue across 4 quarters, student distribution, trade stats).
Then create ${count} MCQs requiring 2+ step calculations involving % change, ratios, averages, comparisons.
Provide answer key with calculations in the explanation field.
Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

export function buildPrompt({ subject, subtopic, questionsPerPassage, tone }) {
  const normalized = String(subject || '').toLowerCase();
  switch (normalized) {
    case 'english':
    case 'english language':
      return englishTemplate({ subtopic, questionsPerPassage, tone });
    case 'current affairs':
    case 'current affairs & gk':
    case 'gk':
      return currentAffairsTemplate({ subtopic, questionsPerPassage });
    case 'legal':
    case 'legal reasoning':
      return legalTemplate({ subtopic, questionsPerPassage });
    case 'logical':
    case 'logical reasoning':
      return logicalTemplate({ subtopic, questionsPerPassage });
    case 'quantitative techniques':
    case 'quant':
      return quantTemplate({ subtopic, questionsPerPassage });
    default:
      return englishTemplate({ subtopic, questionsPerPassage, tone });
  }
}
