# PandaWise Release 1.0 pilot plan

Sprint 11 replaces the backend beneath the existing UI with Apps Script and Sheets.
The pilot uses only fictional family data until privacy and release controls are
approved.

## Execution stages

| Stage | Evidence | Status |
|---|---|---|
| Source and masters | Sprint 11 branch, Sheet configuration, local checks | Implemented |
| Web App deployment | Script Properties, `/exec` URL, health/readiness | Pending |
| Functional CI artifact | Green run, source ZIP, APK, SHA-256, manifest | Pending |
| End-to-end Sheet flow | Fictional register through dashboard with row evidence | Pending |
| Device UAT | Completed checklist and defect log | Pending |
| Go/no-go | CPO and release-owner decision | Pending |

## Environment prerequisites

- Deploy `services/apps-script` from the approved Google account.
- Store the workbook ID and auth secret only in Apps Script Script Properties.
- Supply the non-secret `/exec` URL to the GitHub manual workflow input or repository
  variable `PANDAWISE_APPS_SCRIPT_URL`.
- Restrict workbook editing and Apps Script project access to named operators.
- Confirm executions and audit rows omit passwords, tokens, secrets and family PII.

## Critical smoke flow

1. Open health, readiness and bootstrap URLs in a browser.
2. Build/download the checksum-verified Sprint 11 APK.
3. Register a unique fictional parent and verify `Parent_Master` immediately.
4. Add an eligible fictional child using a Chennai school dropdown option.
5. Complete Passion Discovery and part of a Development Check; Save & Exit/resume.
6. Complete the check, review GrowScore and choose focus areas.
7. Generate the journey, submit today's Mission and inspect the dashboard/report.
8. Repeat an answer, Mission and profile edit offline, reconnect and verify sync.

## Stop conditions

Stop and preserve evidence if credentials/real family data appear, another parent's
resource is exposed, a duplicate/destructive Sheet mutation occurs, readiness fails,
the APK checksum differs, or any critical/high defect remains unresolved.

## Go/no-go record

| Field | Value |
|---|---|
| Sprint 11 commit SHA | Pending |
| Pull request | Pending |
| Apps Script deployment ID | Pending |
| GitHub workflow run | Pending |
| APK SHA-256 | Pending |
| UAT result | Pending |
| Open critical/high defects | Pending |
| CPO decision | Pending |
| Release-owner decision/date | Pending |
