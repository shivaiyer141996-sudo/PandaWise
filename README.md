# PandaWise

PandaWise is a parent-led child growth journey for families with children aged
3–12. Pando, the PandaWise mascot, guides parents from a Development Check to a
personalized 21-day Mission journey and measurable reassessment.

## Release 1.0 outcome

PandaWise answers four parent questions:

1. Where is my child today?
2. What are their strengths and growth opportunities?
3. What should we do next?
4. Is the journey helping?

The approved loop is:

`Profile -> Passion Discovery -> Development Check -> GrowScore -> Focus areas -> 21-day journey -> Daily feedback -> Reassessment`

## Repository structure

- `apps/mobile` — Flutter Android application, designed for future iOS support.
- `services/api` — TypeScript API and Google Sheets adapter.
- `contracts` — API and configuration contracts.
- `docs` — Product, architecture, sprint, operations and release evidence.
- `config` — Non-secret workbook and feature-contract metadata.

## Source-of-truth links

- [Product conversation](https://chatgpt.com/share/6a7c3ec3-1a00-83ee-acaa-64c802be8a7c?ogimg=plain)
- [PandaWise Masters](https://docs.google.com/spreadsheets/d/1ox11C3hz0pozmjM3bwk6vh99OHH4HPxknSD0tejJRDY/edit)
- [Sprint 10 rehearsal workbook](https://docs.google.com/spreadsheets/d/1x5y3dREaGkdXPEKHU41dz0nThKMHLMeqW9IGdj7l2p4/edit)

## Current implementation status

- Sprints 0–2 provide foundation, authentication and parent/child profiles.
- Sprints 3–4 provide Passion Discovery, Development Check, GrowScore and focus areas.
- Sprints 5–6 provide personalized journeys, daily Missions, feedback and summaries.
- Sprint 7 provides progress analytics, history, reassessment and the recurring loop.
- Sprint 8 provides plan entitlements, notifications, profile and preferences.
- Sprint 9 provides release hardening, resilience, security and Android CI.
- Sprint 10 prepares the completed Release 1.0 candidate for a controlled pilot
  through CI evidence, a copied-workbook rehearsal, device UAT and a go/no-go review.

The code remains Release 1.0 candidate `1.0.0-rc.1` until the Sprint 10
environment and human acceptance gates pass. Sprint 10 adds no product features.

## Local API

```bash
npm install
cp services/api/.env.example services/api/.env
npm run dev:api
```

The default development provider is in-memory. To use Google Sheets, set
`DATA_PROVIDER=google-sheets` and provide the variables documented in
`services/api/.env.example`.

## Mobile app

Install Flutter 3.47.0, then:

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=PANDAWISE_API_BASE_URL=http://10.0.2.2:8080
```

## Quality gates

```bash
npm run check
npm run audit
npm run security:scan
npm run pilot:readiness
cd apps/mobile && flutter analyze && flutter test
```

Release evidence is maintained in `docs/release`; Google Sheets recovery is in
`docs/operations/google-sheets-runbook.md`. No Google credentials, production
secrets or family PII belong in this repository.
