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
Constraints: Options must be close and mutually exclusive, similar length, no giveaways, no "All of the above"/"None of the above". Only one clearly best answer. For English/Logical/Legal/Quant, answers must be strictly passage-based. For Current Affairs, non-direct questions may require widely known context beyond the passage (see template instructions). "Cannot be determined" is allowed only if the passage/data is genuinely insufficient, and the explanation must show why.
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
DIFFICULTY: Tougher than recent CLATs; subtle rhetoric, layered viewpoints, close paraphrases, and traps for superficial readings.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 420–520 word passage in ${styleTone} tone. Include nuanced stance shifts, hedging, and at least one counterpoint addressed. Keep it self-contained and precise.
Then create ${count} MCQs with 4 close options each. Mix:
- 1 central idea
- 1 author’s tone
- 1 inference
- 1 word/phrase meaning
- remaining factual detail questions.
Options should include near-synonyms and plausible reinterpretations; avoid ambiguity unless firmly resolvable. Explanations must contrast why distractors fail.
Format as JSON.\n\n${COMMON_JSON_SCHEMA}`;
}

function currentAffairsTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  const nonDirectCount = Math.max(1, Math.round(count * 0.75));
  const directCount = Math.max(0, count - nonDirectCount);
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Tougher than recent CLATs; options very close with institutional and temporal nuance.
${topicLine({ subtopic, customTopic, articleUrl })}

PASSAGE: Write a 420–520 word journalistic/editorial passage with balanced analysis and concrete facts (dates/windows, mandates, jurisdictions). Provide rich context, but you do not need to include every fact required to answer all questions; avoid niche trivia.

QUESTION DESIGN — MATCH CLAT CURRENT AFFAIRS:
- Create ${nonDirectCount} NON-DIRECT questions that are not answerable from the passage alone. These rely on widely known/current GK (e.g., institutions & mandates, major schemes, budget heads/highlights, international organizations/summits, indices & issuing bodies, landmark judgments, appointments/awards, sports/science milestones, geography-based facts). The correct answer should be the only option consistent with general knowledge; explanations must cite the needed outside fact in one short sentence.
- Create ${directCount} DIRECT questions answerable from the passage (detail/inference). Explanations should point to the specific line/idea in the passage.
- Keep all options close, mutually exclusive, similar length; no “All/None of the above”. Exactly one best answer for each question. Prefer competing institutions/years/thresholds as distractors.

Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

function legalTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Tougher than recent CLATs; overlapping principles, narrow exceptions, and fact-sensitive distinctions.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 380–480 word legal reasoning passage stating the governing principle(s), scope/limits, exceptions, and any conflicts between principles. Include 1–2 compact illustrations that require attention to qualifiers.
Then create ${count} MCQs: 6–7 application-to-facts with fine distinctions (altered facts that trigger/defeat exceptions), 2 inference, 1 principle recall. Ensure only one option fits the stated rule and specific facts; no moral/commonsense answers.
Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

function logicalTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(12, Number(questionsPerPassage) || 10));
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Tougher than recent CLATs; dense arguments with multiple claims/counterclaims.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 420–520 word neutral editorial passage with layered claims, counterarguments, and implicit assumptions.
Create ${count} MCQs across inference, strengthen/weaken, necessary assumption (use negation test), principle, evaluate-argument, method of reasoning, and parallel reasoning. Ensure one best answer strictly from the passage. Options should include close paraphrases and require paying attention to qualifiers and scope.
Output JSON only.\n\n${COMMON_JSON_SCHEMA}`;
}

function quantTemplate({ subtopic, questionsPerPassage, customTopic, articleUrl }) {
  const count = Math.max(1, Math.min(10, Number(questionsPerPassage) || 6));
  return `ROLE: You are a seasoned CLAT UG question setter.
DIFFICULTY: Tougher than recent CLATs; multi-step arithmetic with unit/rounding traps.
${topicLine({ subtopic, customTopic, articleUrl })}

TASK: Generate a 200–480 word passage introducing a dataset (table/graph/survey) about ${subtopic}. Include 10–20 concrete numbers (e.g., quarterly values, category shares, YoY deltas) sufficient for diverse questions; ensure units and time windows are explicit.
Then create ${count} MCQs requiring 2–3 step calculations (percent change incl. base/chain, ratios, weighted averages, mixture/alligation, comparisons). Options should be numerically tight (within 1–2% or nearby integers). Include concise calculations in the explanation. Allow "Cannot be determined" only when data is genuinely insufficient and explain why.
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
