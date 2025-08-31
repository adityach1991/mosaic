import { readRange, parseSheetId } from '../server/sheets.js';

async function main() {
  const [sheetUrlOrId, tabName = process.env.SHEETS_TAB_NAME || 'Sheet1', a1 = 'A1:D200'] = process.argv.slice(2);
  if (!sheetUrlOrId) {
    console.error('Usage: node scripts/peek.mjs <sheetUrlOrId> [tabName] [A1range]');
    process.exit(1);
  }
  const sheetId = parseSheetId(sheetUrlOrId);
  const range = `'${tabName}'!${a1}`;
  const values = await readRange({ sheetId, range });
  for (let i = 0; i < values.length; i++) {
    const row = values[i] || [];
    // Print 1-based row number and columns A..D joined with | for readability
    console.log(String(i + 1).padStart(3, ' '), '|', (row.join(' | ') || ''));
  }
}

main().catch((e) => {
  console.error('Peek failed:', e?.message || e);
  process.exit(2);
});

