# PandaWise repository instructions

## Product boundary

PandaWise Release 1.0 is a parent-led child growth journey for children aged 3–12.
Preserve the approved loop:

`profile -> passion discovery -> development check -> GrowScore -> parent focus areas -> 21-day journey -> daily feedback -> reassessment`

Do not add school/teacher portals, AI chatbots, marketplaces, counsellor booking,
communities, live classes, media uploads, certificates, or the 12–15 age group to
Release 1.0.

Use the approved labels `Passion Discovery`, `Development Check`, `GrowScore`, and
`Missions`. Do not reintroduce `Interest Explorer`, `PandaWise Discovery`, or
`Pando's Corner` without an approved change request.

## Engineering rules

- Keep `main` release-ready. Develop each sprint on `agent/sprint-*` branches.
- Google Sheets is the V1 database; access it only through Google Apps Script.
- Never embed Google credentials, JWT secrets, or spreadsheet data in the APK.
- Keep all backend reads, writes and calculations inside `services/apps-script`.
- Prefer configuration over hardcoding for skills, questions, missions, plans,
  limits, badges, notification rules, and scoring rules.
- Store password hashes only; never log passwords, tokens, child PII, or credentials.
- Add tests for every business rule and update the product traceability documents
  when behavior changes.
- Use positive, non-judgmental language in user-facing copy.
