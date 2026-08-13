# Release 1.0 security review

Status: Sprint 11 source controls implemented; deployed Web App and device checks
remain launch gates.

## Controls implemented

- Parent-owned resources are authorized from an HMAC-signed, expiring token subject.
- Passwords use a random salt, SHA-256 and a server-only auth secret; only the hash
  format is written to `Password_Hash` and public models omit it.
- Apps Script errors expose stable codes/messages, never stack traces, tokens,
  secrets or workbook values.
- `PANDAWISE_AUTH_SECRET` and spreadsheet configuration are Script Properties, not
  Sheet cells, GitHub source, Dart defines or APK assets.
- Flutter uses secure storage for the parent token and clears account-scoped offline
  mutations on logout.
- Inputs, ownership, active status, master values and plan entitlements are validated
  in Apps Script before writes.
- Marketing consent is independent from Terms; notification channels are independent.
- ScriptLock protects mutations; assessment history is append-only and latest-answer
  reads make autosave/resume deterministic.
- CI runs the static/contract suite, npm audit, repository secret scan and Gitleaks.

## Accepted controlled-pilot constraints

- The Web App transport is accessible to anyone so an APK can register/login;
  private logical routes still require a valid token.
- Manual plan selection is a pilot control, not a payment system.
- Forgot-password is enumeration-safe but delivery/reset tokens are not implemented;
  public recovery remains blocked.
- The CI APK is debug-signed for controlled device testing only.
- Apps Script/Sheets quotas and locking limit scale; measure them before expansion.
- Pre-Sprint 11 bcrypt hashes require authorized reset/re-registration.

## Launch-blocking checks

- No secret, token, password, family PII or live-data export in source/history/logs.
- Deploy as the workbook owner/editor with a new 32+ character auth secret.
- Verify cross-parent resource requests do not disclose existence.
- Verify registration writes a `sha256$...` value and never a plain password.
- Assign owners for privacy disclosures, retention, child-data deletion and rollback.
- Use protected production signing and store ownership before public distribution.
