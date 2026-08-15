# PandaWise

PandaWise is a parent-led growth journey for families with children aged 3–12.
The existing Flutter UI leads a family through:

`Profile → Passion Discovery → Development Check → GrowScore → Focus areas → 21-day journey → Daily feedback → Reassessment`

## Sprint 11 architecture

Sprint 11 preserves the existing Flutter screens, navigation, branding, theme and
animations. It removes the former Node/Fastify backend and uses only free Google
infrastructure:

`Flutter APK → Google Apps Script Web App → PandaWise Google Sheets`

- `apps/mobile` — existing Flutter Android app, including durable offline writes.
- `services/apps-script` — complete Apps Script Web App backend.
- `contracts/apps-script-api.md` — JSON envelope and logical REST route contract.
- `docs/operations/apps-script-deployment-guide.md` — setup and deployment.
- `docs/sprint-11-traceability.md` — PRD/FSD acceptance mapping.

There is no Firebase, cloud database, Node server, container, VPS or paid runtime.
Google Sheets is the only database and all product masters remain editable there.

## Source-of-truth links

- [Product conversation](https://chatgpt.com/share/6a7c3ec3-1a00-83ee-acaa-64c802be8a7c?ogimg=plain)
- [PandaWise Masters](https://docs.google.com/spreadsheets/d/1ox11C3hz0pozmjM3bwk6vh99OHH4HPxknSD0tejJRDY/edit)
- [Sprint 10 rehearsal workbook](https://docs.google.com/spreadsheets/d/1x5y3dREaGkdXPEKHU41dz0nThKMHLMeqW9IGdj7l2p4/edit)

## Configuration

The APK has one environment-specific setting in
`apps/mobile/lib/core/config/config.dart`:

```text
PANDAWISE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzCz-UTefS3IKsDtOEPAJl7MgrN6LLv4rmx-gX-qwkTu9KQB8reBCJi4UKkuuiqoCeP/exec
```

The verified Sprint 11 URL is the default in `config.dart`; an environment
override remains available for future deployments:

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=PANDAWISE_APPS_SCRIPT_URL="https://script.google.com/macros/s/<deployment-id>/exec"
```

### Demo Mode fallback

When a development build explicitly uses an empty `PANDAWISE_APPS_SCRIPT_URL`,
`PandaWiseConfig.isConfigured` is
`false` and the login screen exposes **Explore Demo Mode**. Demo Mode bypasses
authentication, uses stateful in-memory family and master data, supports the
existing child, assessment, report, journey, progress, profile, settings,
notification, subscription and referral flows, and displays **Demo Mode -
Offline** above every route. It performs no network requests and stores no demo
session after the app process ends.

Supplying the deployed Apps Script `/exec` URL makes `isConfigured` true. The
Demo Mode entry and banner then disappear automatically and the unchanged UI
uses `HttpPandaWiseApi`.

## Quality gates

```bash
npm ci
npm run check
npm run audit
npm run security:scan
npm run pilot:readiness
cd apps/mobile && flutter pub get && flutter analyze && flutter test
```

GitHub Actions builds and uploads a debug APK on every pull request and milestone
branch push. The current default produces a backend-connected APK with
`backend_configured=true`. An intentionally empty environment build remains fully
usable for offline Demo Mode UI/UX validation. No dummy backend URL or manual APK
build is used.

No Apps Script secret, Google credential, password, session token or family PII
belongs in this repository or in an APK.
