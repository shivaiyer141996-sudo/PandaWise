# PandaWise Release 1.0 architecture

## Components

### Flutter mobile app

- Keeps the existing Release 1 UI and product journey unchanged.
- Calls one configured Google Apps Script `/exec` URL.
- Sends a logical route, logical HTTP method, token and payload in a JSON envelope.
- Follows the Google ContentService redirect without exposing credentials.
- Persists offline assessment answers, mission completions and profile edits with
  `SharedPreferences`; connectivity recovery triggers ordered replay.
- Keeps the parent token in secure storage and clears account-scoped offline data
  on logout.

### Google Apps Script Web App

- Is the only backend and returns JSON only.
- Uses `doGet`/`doPost` as physical transports and dispatches logical REST routes.
- Validates all input, ownership, age eligibility and plan entitlement server-side.
- Reads and writes the configured workbook by header name, never fixed row number.
- Uses `LockService` around mutations to protect concurrent Sheet writes.
- Calculates GrowScore, reports, recommendations, journeys, summaries and dashboard
  data from Sheet masters and operational tabs.
- Uses stable error codes and never returns stack traces or sensitive values.

### Google Sheets

- Is the only Release 1 database and configuration source.
- Holds masters, parent/child profiles, assessment events/results, journey events,
  subscriptions, badges, configuration and audit records.
- Uses append-only events where history matters and updates snapshot columns for
  dashboard performance.
- Is administered through native Sheets validation and Drive version history.

## Request flow

1. Flutter posts an envelope to the Apps Script `/exec` URL.
2. Apps Script validates the route and signed parent token.
3. Apps Script reads or mutates the workbook and derives the response.
4. Apps Script returns `{ "ok": true, "data": ... }` or a stable error envelope.
5. Flutter maps the JSON to the existing screen models.

## Authentication

- Registration validates the parent against master-backed options.
- Passwords use a per-password random salt, SHA-256 and a server-side Script
  Property secret. Only `sha256$salt$digest` is stored in `Password_Hash`.
- The secret is not stored in Sheets, source, logs or the APK.
- Session tokens are HMAC signed, time limited and scoped to a parent ID.
- Parent ownership is checked for every child, assessment, report and journey route.

Pre-Sprint 11 bcrypt hashes are not silently converted. If such rows exist, an
authorized password-reset migration is required before those accounts can log in.

## Master-driven rules

- Age support and respondent mode: `04_Age_Group_Master` (3–6, 6–9, 9–12 only).
- Schools: `03_School_Master` (Chennai Release 1 list; never free-typed).
- Questions/options/scoring: question, option, skill and app-configuration masters.
- Missions/recommendations: mission and recommendation-rule masters.
- Explorer/Growth/Mastery entitlements: `18_Subscription_Master`.
- Badges and thresholds: badge and app-configuration masters.

Missing or invalid master configuration fails readiness with a controlled workbook
contract error; the backend does not invent business defaults.

## Reliability and trade-offs

- Assessment answers are append-only; the latest answer per question enables
  autosave and resume.
- Completion reuses existing score rows, and journey creation reuses the current
  journey, to reduce duplicate mutations.
- Apps Script and Sheets are suitable for a free controlled pilot, not unlimited
  high-concurrency traffic. Monitor execution time, quotas, sheet growth and lock
  contention before broader rollout.
- A future database migration would replace Apps Script/Sheets, but no alternate
  backend exists in Release 1.
