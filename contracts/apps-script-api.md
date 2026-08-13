# PandaWise Apps Script API contract

The deployed Google Apps Script Web App is the only PandaWise backend. It returns
JSON and reads or writes the configured PandaWise Google Sheets workbook.

## Transport

Google Apps Script exposes `doGet` and `doPost`, so the Flutter client sends one
JSON envelope to the deployment `/exec` URL:

```json
{
  "route": "/v1/auth/login",
  "method": "POST",
  "token": "optional-signed-session-token",
  "payload": {}
}
```

Success:

```json
{"ok":true,"data":{}}
```

Failure:

```json
{"ok":false,"error":{"code":"STABLE_CODE","message":"Safe message"}}
```

Passwords are accepted only for register/login, salted and hashed with SHA-256
plus a server-side Script Property secret, and stored only in `Password_Hash`.
The secret and session tokens are never written to Sheets or the APK.

## Logical routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Process health |
| GET | `/ready` | Workbook contract readiness |
| GET | `/v1/config/bootstrap` | Sheet-backed onboarding masters |
| POST | `/v1/auth/register` | Parent registration |
| POST | `/v1/auth/login` | Parent login |
| POST | `/v1/auth/forgot-password` | Non-enumerating reset acknowledgement |
| GET | `/v1/me` | Parent profile |
| PUT | `/v1/me/profile` | Profile edit |
| PUT | `/v1/me/notification-preferences` | Notification preferences |
| PUT | `/v1/me/marketing-consent` | Marketing consent |
| PUT | `/v1/me/referral` | Referral code |
| GET | `/v1/plans` | Subscription master |
| PUT | `/v1/me/subscription` | Manual Release 1 plan selection |
| GET/POST | `/v1/children` | List/create child profiles |
| GET/PUT | `/v1/children/{childId}/passions` | Passion Discovery |
| POST | `/v1/children/{childId}/assessments` | Start or resume assessment |
| GET | `/v1/assessments/{assessmentId}` | Resume assessment |
| PUT | `/v1/assessments/{assessmentId}/responses/{questionId}` | Autosave answer |
| POST | `/v1/assessments/{assessmentId}/complete` | Calculate Sheet-backed report |
| GET | `/v1/assessments/{assessmentId}/report` | Assessment report |
| GET | `/v1/children/{childId}/growscore/latest` | Latest GrowScore |
| POST | `/v1/children/{childId}/journeys` | Generate journey |
| GET | `/v1/children/{childId}/journeys/current` | Current journey/dashboard |
| PUT | `/v1/journeys/{journeyId}/schedules/{scheduleId}/completion` | Mission progress |
| GET | `/v1/journeys/{journeyId}/weekly-summary/{week}` | Weekly summary |
| GET | `/v1/children/{childId}/progress` | Growth/report dashboard |
| GET | `/v1/notifications` | Notification centre |

Aliases such as `/register`, `/login`, `/schools`, `/grades`, `/skills`,
`/missions`, `/assessment/start`, `/assessment/save`, `/assessment/submit`,
`/report`, and `/dashboard` are normalized by the Apps Script router.
