# PandaWise Google Apps Script API

This folder is the complete Release 1 backend. It runs inside a Google Apps
Script Web App and reads/writes the existing **PandaWise Masters** workbook.
There is no Node server, database, container or paid cloud dependency.

## Runtime properties

`configurePandaWise()` sets these automatically for a Sheet-bound project:

| Property | Value |
|---|---|
| `PANDAWISE_SPREADSHEET_ID` | The bound PandaWise Masters spreadsheet ID |
| `PANDAWISE_AUTH_SECRET` | A generated server-only random secret |
| `PANDAWISE_TOKEN_TTL_SECONDS` | Optional; default `21600` (six hours) |

For a standalone project, set only `PANDAWISE_SPREADSHEET_ID` in Script
Properties first. Run `configurePandaWise()` once, authorize Sheets access, then run
`verifyPandaWiseDeployment()`. Deploy as a Web App that executes as the owner and
is accessible to anyone with the URL.

## Transport contract

Apps Script exposes only `doGet` and `doPost`. The Flutter client therefore sends
one HTTPS POST envelope to the deployed `/exec` URL:

```json
{
  "route": "/v1/auth/login",
  "method": "POST",
  "token": null,
  "payload": { "email": "...", "password": "..." }
}
```

The logical route and method preserve the REST contract while keeping session
tokens out of query strings. Responses are JSON-only:

```json
{ "ok": true, "data": {} }
```

or

```json
{ "ok": false, "error": { "code": "...", "message": "...", "status": 400 } }
```

Password rows contain salted SHA-256 hashes additionally protected by the
Apps Script authentication secret. Plain passwords and tokens are never written
to Google Sheets or logs.
