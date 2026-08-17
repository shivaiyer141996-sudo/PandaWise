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
| PW-001 | UAT-010 | Passion Discovery could not continue | Critical | Sprint 11 live backend / run 42 APK | Select valid passions and continue | Valid selection saves / generic request failure | Apps Script wrote `Selected` into strict `PRIMARY\|SECONDARY\|EMERGING` column | Engineering | Ready to retest | Pending deployed SIT |
| PW-002 | UAT-011 | Assessment start used invalid Sheet enums | Critical | Sprint 11 live backend | Complete Passion Discovery and start check | Check starts / strict assessment status or respondent validation rejects write | Contract audit against `12_Child_Assessments` | Engineering | Ready to retest | Pending deployed SIT |
| PW-003 | UAT-016 | Journey generation used invalid Sheet enums | Critical | Sprint 11 live backend | Complete check and generate journey | 21-day journey appears / strict journey status or priority source rejects write | Contract audit against scheduler and journey validations | Engineering | Ready to retest | Pending deployed SIT |
| PW-004 | UAT-036 | Strict validation could leave partial transaction rows | Critical | Sprint 11 live backend | Repeat a write with incompatible generated enum | No row written / partial row cells could remain | Incomplete Child Passion rows after failed requests | Engineering | Ready to retest | Pre-write guard covered by regression test |

## Triage rules

1. Stop the pilot for every critical defect and notify product/release owners.
2. Fix critical and high defects before go-live; accepted risk requires both owners.
3. Link every fix to a commit and re-run the affected case plus critical smoke.
4. Close only after a different tester records successful retest evidence.
5. Route unrelated feature requests to roadmap review outside Sprint 10.
