export function toSheetRows(payload) {
  const rows = [];
  const passage = String(payload.passage || '').trim();
  if (passage) rows.push([passage]);
  rows.push([]); // empty row after passage

  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  for (const q of questions) {
    const qText = String(q.question || '').trim();
    const explanation = String(q.explanation || '').trim();
    const options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    const correctIndex = Number.isInteger(q.correct_index) ? q.correct_index : 0;

    // Question row: A=question, B=1, D=explanation
    rows.push([qText, '1', '', explanation]);

    // Next 4 rows: options. Correct has * in Col A, option text in Col B
    for (let i = 0; i < 4; i++) {
      const isCorrect = i === correctIndex;
      rows.push([isCorrect ? '*' : '', options[i] ?? '']);
    }

    // Empty row between questions
    rows.push([]);
  }

  return rows;
}

