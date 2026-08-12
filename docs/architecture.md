# PandaWise Release 1.0 Architecture

## Context

PandaWise must ship as an Android APK, keep operational cost low and allow business
users to maintain product masters in Google Sheets. It must also avoid coupling the
mobile app to the spreadsheet so a later database migration stays feasible.

## Components

### Flutter mobile app

- Renders the 25 approved screens.
- Holds presentation state and a short-lived parent session.
- Calls only the PandaWise API.
- Never receives Google service-account credentials.
- Does not embed master data beyond harmless loading/empty-state copy.

### TypeScript API

- Authenticates parents and enforces plan entitlements.
- Validates all inputs and derives server-owned fields.
- Reads/writes Google Sheets through a repository interface.
- Selects versioned assessment content and computes weighted GrowScore server-side.
- Returns stable JSON contracts to the app.

### Google Sheets

- Acts as the V1 configurable data and operational store.
- Uses stable IDs and header names rather than row numbers as contracts.
- Remains editable by authorized business users.
- Is accessed by a least-privilege service account through the backend only.

## Dependency direction

`Flutter -> HTTP contracts -> API/domain -> repository interface -> Google Sheets`

No domain service imports Google APIs directly. This keeps the future replacement of
Google Sheets with PostgreSQL behind one adapter.

## Configuration

Required production variables:

- `DATA_PROVIDER=google-sheets`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`

Secrets are injected at runtime. They are not stored in Dart defines, source files,
CI logs or committed environment files.

## Authentication

- Registration hashes passwords with bcrypt before persistence.
- Login compares the hash and issues a short-lived JWT.
- Parent-owned resources are authorized by the token subject, never by trusting a
  parent ID supplied by the app.
- Account status is checked on every authentication flow.

Password reset delivery is intentionally represented as a safe acceptance response
in Sprint 1; notification delivery and one-time reset tokens are completed with the
notification module.

## Reliability controls

- Header-driven row mapping prevents accidental dependence on column position.
- Write operations use generated stable IDs and ISO timestamps.
- Assessment responses are append-only events; the latest response per question is
  used for auto-save/resume and completion.
- Completion is idempotent: existing skill results are reused and only missing
  score rows are appended before snapshots are updated.
- API errors have machine-readable codes and never expose credentials or stack data.
- Google Sheets timeouts, quota responses and malformed rows are translated into
  controlled service errors.
- The memory adapter supports deterministic local development and automated tests.

## Known V1 trade-offs

Google Sheets is appropriate for an early validation release but is not a high-write,
high-concurrency database. Before broader production scale, measure quotas, latency,
row growth and contention. The adapter boundary is the planned migration seam.
