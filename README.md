# PandaWise

PandaWise is a parent-led child growth journey for families with children aged
3–12. Pando, the PandaWise mascot, guides parents from a development check to a
personalized 21-day mission journey and measurable reassessment.

## Release 1.0 outcome

PandaWise answers four parent questions:

1. Where is my child today?
2. What are their strengths and growth opportunities?
3. What should we do next?
4. Is the journey helping?

The core loop is:

`Assess -> Recommend -> Complete missions -> Track -> Reassess`

## Repository structure

- `apps/mobile` — Flutter Android application, designed for future iOS support.
- `services/api` — Lightweight TypeScript API and Google Sheets adapter.
- `contracts` — API and configuration contracts shared across implementation work.
- `docs` — Product blueprint, architecture decisions, sprint plan and traceability.
- `config` — Non-secret workbook and feature-contract metadata.

## Source-of-truth links

- [Product conversation](https://chatgpt.com/share/6a7c3ec3-1a00-83ee-acaa-64c802be8a7c?ogimg=plain)
- [PandaWise Masters](https://docs.google.com/spreadsheets/d/1ox11C3hz0pozmjM3bwk6vh99OHH4HPxknSD0tejJRDY/edit)

## Current implementation status

- Product scope, 25-screen catalogue and Release 1.0 rules are frozen.
- Google Sheets master workbook has been expanded to 23 tabs.
- Sprint 0 repository and API foundation is included.
- Sprint 1 implements the design system, app shell, authentication and parent/child
  flows.
- Sprint 2 implements Passion Discovery, Development Check auto-save/resume,
  versioned GrowScore, strengths-first reports and parent focus-area selection.
- Sprint 3 implements explainable mission selection, the personalized 21-day
  journey, one visible daily mission, lightweight feedback, weekly summaries,
  streaks and the 70% reassessment gate.
- Sprint 4 implements a plan-aware Progress dashboard, skill trends, Development
  Check history, reassessment actions and new-journey generation after reassessment.
- Commercial preferences and manual plan controls remain sequenced into Sprint 5.

## Local API

```bash
npm install
cp services/api/.env.example services/api/.env
npm run dev:api
```

The default development provider is in-memory. To use the production Google Sheets
adapter, set `DATA_PROVIDER=google-sheets` and provide the variables documented in
`services/api/.env.example`.

## Mobile app

Install the stable Flutter SDK, then:

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=PANDAWISE_API_BASE_URL=http://10.0.2.2:8080
```

## Quality gates

```bash
npm run check
cd apps/mobile && flutter analyze && flutter test
```

No Google credentials or production secrets belong in this repository.
