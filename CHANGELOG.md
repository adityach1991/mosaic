Changelog

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
