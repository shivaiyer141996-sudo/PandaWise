# PandaWise Release 1.0 Pilot Plan

Sprint 10 turns the completed Release 1.0 candidate into a controlled pilot. It
creates release evidence and does not introduce product features.

## Pilot boundary

- Audience: invited parent testers using fictional child data only.
- Client: CI-built, debug-signed Android APK for controlled testing.
- Data: dedicated API environment connected to the dated rehearsal workbook.
- Scope: the 25 approved screens and recurring parent journey.
- Exclusions: public distribution, payment collection and post-Release-1.0 ideas.

## Execution stages

| Stage | Owner | Required evidence | Status |
|---|---|---|---|
| 1. Source and CI | Engineering | Draft PR, green workflow run, commit SHA | Pending |
| 2. Workbook structure | Engineering / Operations | Copied workbook, headers and key master checks | Passed |
| 3. API workbook flow | Engineering / Operations | Sequential/concurrent reads and disposable journey | Pending |
| 4. Artifact verification | Release owner | APK, checksum, manifest and installation | Pending |
| 5. Device UAT | Product / pilot testers | Completed UAT checklist and defect log | Pending |
| 6. Go/no-go | Product and release owners | Signed decision with blockers resolved | Pending |

## Environment prerequisites

- Configure the API with a least-privilege Google service account and rehearsal-workbook ID.
- Store JWT and Google credentials only in the environment secret manager.
- Set the manual-workflow `api_base_url` input to the non-secret pilot API URL.
- Restrict the workbook and pilot API to named release operators.
- Confirm logs omit passwords, tokens, credentials and parent/child PII.

## Workbook rehearsal evidence

- Workbook: [PandaWise Masters - Sprint 10 Pilot Rehearsal - 2026-08-13](https://docs.google.com/spreadsheets/d/1x5y3dREaGkdXPEKHU41dz0nThKMHLMeqW9IGdj7l2p4/edit)
- The rehearsal and live workbook IDs are distinct.
- All 23 source tabs and sheet IDs were preserved before adding `Pilot_Readiness`.
- All 23 bounded header reads succeeded and the CPO master fields are present.
- Ten active skill weights total 100.
- Explorer, Growth and Mastery assessment limits are 2, 6 and 12; every journey is 21 days.
- No write request targeted the live PandaWise Masters workbook.
- Pending: restricted `.xlsx` backup destination, API throughput reads and one
  disposable parent journey with fictional data.

## Critical smoke flow

1. Install the checksum-verified APK and confirm splash/session behavior.
2. Register or log in with a fictional pilot parent.
3. Add an eligible fictional child and complete Passion Discovery.
4. Complete a Development Check, review GrowScore and choose focus areas.
5. Generate the 21-day journey and submit today's Mission feedback.
6. Review progress, notifications, profile, plan and preferences.
7. Confirm stable IDs, append-only events and snapshots in the rehearsal workbook.

## Stop conditions

Stop the pilot and preserve evidence if:

- credentials or real family data appear in source, logs, APK or evidence;
- authorization exposes another parent's or child's data;
- a schema mismatch, duplicate ID or destructive workbook write occurs;
- APK checksum differs from the CI manifest;
- any critical/high defect remains unresolved; or
- the artifact targets the live master or an unapproved API environment.

## Go/no-go record

| Field | Value |
|---|---|
| Pilot commit SHA | Pending |
| Draft PR | Pending |
| GitHub workflow run | Pending |
| APK SHA-256 | Pending |
| Rehearsal workbook | `1x5y3dREaGkdXPEKHU41dz0nThKMHLMeqW9IGdj7l2p4` |
| UAT result | Pending |
| Open critical/high defects | Pending |
| Product owner decision | Pending |
| Release owner decision | Pending |
| Decision date | Pending |
