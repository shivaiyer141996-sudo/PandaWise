# Google Sheets Operations Runbook

PandaWise Release 1.0 uses Google Sheets as the business-data provider. The API is
the only production component permitted to access it.

## Readiness and normal operation

- `GET /health` proves the API process is alive and never calls Google.
- `GET /ready` makes a bounded master-data read. It returns `200 ready` only when
  the provider and workbook contract are readable; otherwise it returns `503`.
- Google API status `408`, `429` and `5xx` responses are retried up to
  `GOOGLE_SHEETS_MAX_ATTEMPTS` with exponential backoff and jitter.
- Authentication/permission (`401`/`403`) and workbook-contract errors are not
  retried because repetition cannot repair them.

Recommended production defaults:

```text
GOOGLE_SHEETS_MAX_ATTEMPTS=3
GOOGLE_SHEETS_RETRY_BASE_MS=200
```

## Quota or provider incident

1. Confirm `/health` is `200` and `/ready` is `503`; do not restart a healthy API
   repeatedly because this adds provider load.
2. Check structured API logs for the operation name, attempt count and provider
   status. Logs and client responses intentionally omit sheet values and credentials.
3. For `429` or `5xx`, allow bounded retries to drain. Reduce client traffic or
   temporarily pause nonessential administrative writes if errors persist.
4. For `401` or `403`, verify the configured service-account identity and that the
   workbook is shared directly with that identity. Rotate credentials only through
   the deployment secret store.
5. For a missing-header message, compare the named tab to
   `docs/master-workbook-contract.md`; restore the expected header without reordering
   or deleting data rows.
6. After remediation, require three consecutive `/ready` successes and run the
   parent-journey smoke path before declaring recovery.

## Capacity rehearsal

Before a production launch or major campaign:

1. Copy the workbook and use synthetic, non-child data.
2. Run read-heavy bootstrap/plan/profile traffic and representative append/update
   operations against the copy.
3. Increase load gradually while monitoring p95 response time, `429` rate, retry
   count and write failures. Never load-test the production family workbook.
4. Stop if any write is duplicated, p95 exceeds the agreed SLO, or provider errors
   exceed 1% for five minutes.
5. Record the tested concurrency, provider quota, results and date in the release
   evidence. The automated adapter tests cover retry/recovery mechanics; they do not
   claim a provider quota that was not measured in the target Google Workspace.

## Backup and recovery

- Restrict edit access and use Drive version history for ordinary rollback.
- Before a schema change, create a dated workbook copy and record its file ID in the
  change ticket.
- Restore a damaged tab from that copy, then validate headers and `/ready` before
  reopening traffic.
- Never download production child/parent rows to developer machines for debugging.
