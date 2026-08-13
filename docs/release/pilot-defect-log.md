# PandaWise Pilot Defect Log

Use fictional identifiers and redacted evidence. Never paste passwords, tokens,
Google credentials or parent/child PII.

Severity:

- `Critical`: security/privacy exposure, data loss/corruption, cross-parent access
  or the critical journey cannot continue; stop the pilot.
- `High`: a Release 1.0 requirement fails with no safe practical workaround.
- `Medium`: a requirement is impaired but a safe workaround exists.
- `Low`: cosmetic/copy/minor usability issue without material workflow impact.

Status: `Open`, `Triaged`, `In progress`, `Ready to retest`, `Closed`,
`Accepted risk`.

| ID | UAT case | Summary | Severity | Environment/build | Reproduction | Expected/actual | Evidence | Owner | Status | Retest |
|---|---|---|---|---|---|---|---|---|---|---|
| PW-001 |  |  |  |  |  |  |  |  | Open |  |

## Triage rules

1. Stop the pilot for every critical defect and notify product/release owners.
2. Fix critical and high defects before go-live; accepted risk requires both owners.
3. Link every fix to a commit and re-run the affected case plus critical smoke.
4. Close only after a different tester records successful retest evidence.
5. Route unrelated feature requests to roadmap review outside Sprint 10.
