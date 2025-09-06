# mosaic

CLAT passage + MCQ generator with export to Google Sheets. Tuned for tough, CLAT‑style sets with close options and realistic Current Affairs behavior.

Features
- Generate a passage and N MCQs for 5 subjects: English, Current Affairs & GK, Legal Reasoning, Logical Reasoning, Quantitative Techniques
- New fields: Custom topic (optional) and Article URL (optional) to steer content
- Current Affairs: ~75% questions can require GK/context beyond the passage
- Export to Google Sheets with one click

Setup
- Node.js 22.x
- Env vars: copy `.env.example` to `.env` and fill values
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL` (default `gemini-2.5`), optional `GEMINI_MODEL_FALLBACKS`
  - Google Sheets credentials via one of the documented methods in `.env.example`

Run
- Development: `npm run dev` then open http://localhost:3000

Usage
- Subject + Subtopic: choose from curated lists (expanded for variety)
- Custom topic (optional): precise theme to focus the passage
- Article URL (optional): emulate/synthesize content aligned to the link (model doesn’t browse; keep topic clear)
- Tone (English only): e.g., narrative/critical/descriptive
- Questions per passage: 1–12
- Generate → review/edit → Confirm & Export to Google Sheets

Prompting & Difficulty
- “Seasoned CLAT question setter” persona; harder than recent years
- Close, mutually exclusive options; no “All/None of the above”
- English/Logical/Legal/Quant: answers strictly passage‑based (Quant allows “Cannot be determined” only if justified)
- Current Affairs: majority non‑direct GK questions; explanations cite outside fact briefly

Notes
- Default model preference: 2.x (gemini‑2.5, 2.0‑flash) with 1.5 fallbacks
- Sheets tab name defaults to `Sheet1` (override via `SHEETS_TAB_NAME`)

Deploy (Vercel)
- Structure: API under `api/` (serverless), static under `public/`.
- Runtime: Node 22 (set via `api/index.js` and `package.json` engines).
- Routes:
  - `GET /api/health` → health check
  - `POST /api/generate` → generate passage + MCQs
  - `POST /api/export` → append rows to Google Sheet
- Env on Vercel: add the same variables as `.env` (e.g., `GEMINI_API_KEY`, `GEMINI_MODEL`, `SHEETS_TAB_NAME`, and one of the Google service account options like `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`).
- Static site: Vercel serves `/public` at root (`/`).
- Optional config: `vercel.json` included to route `/api/*` and serve `/public`.

Steps
- Push to Git and import the repo in Vercel, or run `npx vercel`.
- Set Environment Variables in Vercel Project Settings.
- Deploy; test `https://<your-app>.vercel.app/api/health`.
