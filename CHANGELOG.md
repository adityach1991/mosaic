Changelog

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
