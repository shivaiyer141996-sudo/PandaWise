# Release 1.0 Security Review

Status: no known critical or high findings in the Release 1.0 candidate.

## Controls verified

- Parent routes require JWT authentication, and child/assessment/journey reads are
  ownership-scoped. Cross-parent regression tests expect `404` rather than disclosing
  resource existence.
- Passwords are bcrypt-hashed with cost 12; password hashes never enter public models.
- API logs redact `Authorization`; generic `500` responses do not expose provider
  errors, credentials or workbook content.
- Google service-account JSON and JWT secrets are deployment-only environment
  secrets. `.env`, private keys and service-account files are ignored by Git.
- Flutter stores the parent token in platform secure storage and contains no Google
  credential or sheet access path.
- Request validation constrains email/password/body sizes and Release 1.0 enums.
- Marketing consent is separate from terms acceptance; notification channels are
  independently controlled.
- CI runs `npm audit --audit-level=high` and a full-history Gitleaks scan. At review
  time, `npm audit` reports 0 vulnerabilities across 281 dependencies.
- Third-party CI actions used for the secret scan and APK upload are commit-pinned.

## Accepted Release 1.0 constraints

- Manual subscription selection is a product pilot control, not a payment system.
- Forgot-password is enumeration-safe but requires a production mail/token service
  before public account recovery can be enabled.
- The Android CI artifact is debug-signed and intended only for internal testing.
  Production Play signing and the real API base URL remain deployment responsibilities.
- Google Sheets is suitable for the approved V1 scale only. The repository interface
  preserves a migration path to a transactional database.

## Launch-blocking checks

- No Google or JWT credential may appear in Git history, APK contents or logs.
- Production must use a non-development JWT secret, restrictive CORS origins and a
  TLS API URL.
- Play Console/App Signing ownership, privacy disclosures, retention rules and child
  data deletion procedures require named operational owners before public launch.
