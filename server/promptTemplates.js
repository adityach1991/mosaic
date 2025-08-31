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
Constraints: Options must be close and mutually exclusive, similar length, no giveaways, no "All of the above"/"None of the above". Only one clearly best answer based strictly on the passage. Explanations must justify why the correct option prevails and why each distractor fails.
Do NOT include answer letters; only correct_index.
`;

function topicLine({ subtopic, customTopic, articleUrl }) {
  const base = (customTopic && customTopic.trim()) || (subtopic && String(subtopic)) || '';
  if (articleUrl && String(articleUrl).trim()) {
    return `Focus: ${base ? base + '; ' : ''}emulate or synthesize a passage aligned with the article at ${articleUrl}. The model cannot browse; infer the likely angle from the URL text and write a self-contained passage that includes all facts needed for the questions.`;
  }
  return `Focus: ${base}. The passage must be self-contained and include all facts needed.`;
}

function englishTemplate({ subtopic, questionsPerPassage, tone, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(10, Number(questionsPerPassage) || 6));
  const styleTone = tone || 'narrative/critical/descriptive (choose the most fitting)';
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Slightly harder than CLAT 2021–2025; options should be very close and trap common misreadings, but with exactly one best answer strictly from the passage.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 400–500 word passage in ${styleTone} tone. The passage must be self-contained (do not rely on external knowledge) and precise.
Then create ${count} MCQs with 4 close options each. Mix:
- 1 central idea
- 1 author’s tone
- 1 inference
- 1 word/phrase meaning
- remaining factual detail questions.
Avoid ambiguity and absolute terms unless supported by the passage. Keep explanations concise and comparative.
Format as JSON.\n\n${COMMON_JSON_SCHEMA}`;
}

function currentAffairsTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Slightly harder than CLAT 2021–2025; options very close, plausible, mutually exclusive.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 400–500 word journalistic/editorial passage with balanced analysis and concrete facts. The passage should provide rich context but need not contain every fact needed to answer all questions; avoid niche trivia.

QUESTION DESIGN (reflect real CLAT Current Affairs):
- Target 70–80% questions that are NOT directly answerable from the passage. These should require application of widely known current affairs/general knowledge or reasonable real-world context beyond the passage.
- The remaining 20–30% can be directly answerable from the passage (detail/inference) to anchor the set.
- Every question must still have exactly one best answer. If the answer is non-direct, the explanation should briefly cite the relevant outside fact/context; if direct, reference the specific detail in the passage.
- Avoid pure rote trivia; prefer integrative questions involving policy, institutions, timelines, comparative data, or consequences.

Create ${count} MCQs with close distractors following the above mix.
Provide output as JSON.\n\n${COMMON_JSON_SCHEMA}`;
}

function legalTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Slightly harder than CLAT 2021–2025; emphasize nuanced application with tight options.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 350–450 word legal reasoning passage stating the governing principle(s) clearly, scope/limits, and 1–2 short illustrations. The passage must contain all facts needed; avoid requiring outside statutes beyond what you state.
Then create ${count} MCQs: 6–7 application-to-facts (with fine distinctions), 2 inference, 1 principle recall. Ensure only one option fits the stated rule and facts.
Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

function logicalTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Slightly harder than CLAT 2021–2025; options are subtle and close.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 400–500 word neutral editorial passage with clear claims and support that enable reasoning.
Create ${count} MCQs across inference, strengthen/weaken, assumption, principle, and evaluate-argument. Ensure one best answer strictly from the passage.
Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

function quantTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(10, Number(questionsPerPassage) || 6));
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Slightly harder than CLAT 2021–2025; multi-step arithmetic with close numeric options.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 180–480 word passage introducing a dataset (table/graph/survey) about ${subtopic}. Include 8–18 concrete numbers (e.g., quarterly values, category shares, year-over-year deltas) sufficient for diverse questions.
Then create ${count} MCQs requiring 2+ step calculations (percent change, ratios, weighted averages, comparisons). Options should be numerically tight. Include brief calculations in the explanation.
Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

export function buildPrompt({ subject, subtopic, questionsPerPassage, tone, customTopic, articleUrl }) {
  const normalized = String(subject || '').toLowerCase();
  switch (normalized) {
    case 'english':
    case 'english language':
      return englishTemplate({ subtopic, questionsPerPassage, tone, customTopic, articleUrl });
    case 'current affairs':
    case 'current affairs & gk':
    case 'gk':
      return currentAffairsTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl });
    case 'legal':
    case 'legal reasoning':
      return legalTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl });
    case 'logical':
    case 'logical reasoning':
      return logicalTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl });
    case 'quantitative techniques':
    case 'quant':
      return quantTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl });
    default:
      return englishTemplate({ subtopic, questionsPerPassage, tone, customTopic, articleUrl });
  }
}
