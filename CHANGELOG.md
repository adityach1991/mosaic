Changelog

1.3.2
- Model: prefer Gemini 2.x (set `GEMINI_MODEL=gemini-2.5` with 2.0 fallbacks; keep 1.5 as safety). Updated model selection order.
- Current Affairs prompt: explicit split — ~75% non-direct GK questions (outside passage) and remaining direct; enumerated GK categories (institutions, schemes, budgets, indices, judgments, awards, sports/science milestones); clarified explanations for non-direct vs direct; removed passage-only constraint for CA in the common schema note.

1.3.3
- UI breadth: expanded subtopics for all 5 subjects to diversify passages and question contexts.
- Tougher prompts: increased difficulty across subjects (denser rhetoric in English, institutional/temporal nuance in Current Affairs, overlapping principles & exceptions in Legal, layered claims and parallel reasoning in Logical, multi-step with unit/rounding traps in Quant). Added tight option design guidance and stricter explanation requirements.

1.3.1
- Current Affairs prompt: adjust to real CLAT trend — require 70–80% questions not directly answerable from the passage; explanations must cite outside context for non-direct and passage lines for direct; encourage integrative policy/institution/timeline/comparative framing.

1.3.0
- UI: added optional Custom Topic and Article URL fields; article note aligned and compact spacing; helper note aligned with input width.
- Prompts: enforce CLAT question-setter persona; higher difficulty than CLAT 2021–2025; close and mutually exclusive distractors; no All/None-of-the-above; single best answer strictly from passage; concise comparative explanations; subject-specific refinements (legal application-to-facts, logical S/W/assumption, quant multi-step with calc traces).
- Backend: accept and propagate customTopic/articleUrl; prompt builder focuses passage on provided topic/link while keeping content self-contained.

1.2.0
- Cleanup: remove server-side export debug log.
- UX: prefill default Google Sheet URL in the link field (editable by user).

1.1.0
- Deterministic Sheets export: switched from values.append to values.update anchored at A{lastRow+1} to preserve block ordering.
- Guaranteed blank line between blocks when exporting multiple passages.
- Server-side validation: require at least one non-empty question with 4 options; logs export stats.
- UI guard: prevent double export, block empty-question export, filter empty questions.

0.1.0
- Initial version: generate passages + MCQs and export to Google Sheets.
