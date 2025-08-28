CLAT Passage & MCQ Generator

Overview
- Generate CLAT-style passages + MCQs via Gemini 1.5
- Review/edit in browser, then export to Google Sheets with TestMoz-compatible rows

Quick Start
1) Copy `.env.example` to `.env` and fill values.
   - Share your target Google Sheet with the service account email in `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
   - Keep the private key string in `GOOGLE_SERVICE_ACCOUNT_KEY` with literal \n newlines.
   - Put your `GEMINI_API_KEY`.
2) Install deps and run:
   - npm install
   - npm run dev
3) Open http://localhost:3000

Endpoints
- `POST /api/generate` body: `{ subject, subtopic, questionsPerPassage, tone? }`
  - Calls Gemini with a subject-specific prompt and asks for strict JSON schema.
  - Returns `{ passage, questions: [{question, options[4], correct_index, explanation}] }`.
- `POST /api/export` body: `{ sheetUrlOrId, payload }`
  - Formats rows as required and appends to the sheet (`SHEETS_TAB_NAME`).

Row Format (TestMoz-compatible)
- Row 1: Passage (col A)
- Row 2: empty
- Row 3: Question in col A, `1` in col B, Explanation in col D
- Next 4 rows: Options in col B; correct has `*` in col A
- Empty row; repeat

Notes
- For service accounts, your Google Sheet must be shared with the service account email.
- You can paste either the full Google Sheet URL or the spreadsheet ID.

