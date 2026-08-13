# Google Sheets operations runbook

PandaWise Release 1 uses Google Sheets as its only database. Only the deployed
Apps Script project should perform app reads and writes.

## Normal operation

- Open the Web App with `?route=/health&method=GET` to verify request handling.
- Open it with `?route=/ready&method=GET` to validate the spreadsheet ID, required
  tabs, required headers and active master content.
- Verify register/login and one synthetic parent journey after each deployment.
- Confirm writes appear immediately in Parent, Child, Assessment Response,
  Assessment Result/Skill Score, Journey, Mission Completion and Audit tabs.

## Workbook administration

1. Make a dated native Drive copy before changing headers, validations or formulas.
2. Preserve stable IDs and exact header names.
3. Configure skills, weights, questions, missions, plans, badges and thresholds only
   in their master tabs.
4. Keep the ten active Skill weights at 100 in total.
5. Keep Release 1 age groups limited to 3–6, 6–9 and 9–12.
6. Keep Chennai schools active in School Master; the app never accepts free text.
7. Run `verifyPandaWiseDeployment` in Apps Script after a change.

## Incident recovery

1. Do not repeatedly redeploy when `/health` works but `/ready` fails.
2. Inspect Apps Script Executions for a stable error code; do not copy parent or
   child rows into logs or support chats.
3. For missing headers or invalid master values, compare the tab with
   `docs/master-workbook-contract.md` and restore from the latest dated native copy.
4. For quota or lock errors, pause nonessential testing and let executions drain.
5. For authorization errors, verify the deploying Google account still owns or can
   edit the workbook and reauthorize the script if necessary.
6. Require three consecutive readiness successes and a synthetic end-to-end smoke
   test before reopening the pilot.

## Security

- Restrict Sheet editors to named operators.
- Store `PANDAWISE_AUTH_SECRET` only in Apps Script Script Properties.
- Never place passwords, tokens or the auth secret in `21_Audit_Log`.
- Use Drive version history for rollback and a restricted dated copy for backup.
- Never download live family data to a developer device for debugging.
