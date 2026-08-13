# Google Apps Script deployment guide

This creates the free PandaWise backend and the only URL embedded in the APK.

## 1. Create the project

1. Open [PandaWise Masters](https://docs.google.com/spreadsheets/d/1ox11C3hz0pozmjM3bwk6vh99OHH4HPxknSD0tejJRDY/edit).
2. Choose **Extensions → Apps Script**.
3. Rename the project to `PandaWise API`.
4. Create one script file for every `.gs` file in `services/apps-script` and paste
   the matching source. In the editor, enter file names without the `.gs` suffix.
5. In Project Settings, enable **Show "appsscript.json" manifest file in editor**,
   then replace it with `services/apps-script/appsscript.json`.

`clasp` is optional; `.clasp.json.example` is provided for maintainers who prefer
command-line synchronization. It is not needed for mobile-only deployment.

## 2. Configure the Sheet-bound project

Select and run `configurePandaWise`. It records the current PandaWise Masters
spreadsheet ID, creates a long random authentication secret and sets the default
six-hour token lifetime. Nothing sensitive needs to be copied into the editor.

For a standalone project only, set `PANDAWISE_SPREADSHEET_ID` under **Project
Settings → Script Properties** before running the function.

The resulting server-only properties are:

| Property | Value |
|---|---|
| `PANDAWISE_SPREADSHEET_ID` | The bound PandaWise Masters spreadsheet ID |
| `PANDAWISE_AUTH_SECRET` | Generated automatically; never copy or expose it |
| `PANDAWISE_TOKEN_TTL_SECONDS` | Optional; default is 21600 (6 hours) |

Never paste the auth secret into source, a Sheet cell, GitHub, chat or an APK.

## 3. Authorize and verify

1. Select `verifyPandaWiseDeployment` in the function picker.
2. Choose **Run**, review the requested Sheets permission and authorize it.
3. Confirm the execution returns `health`, `readiness`, and non-zero master counts.
4. If it fails, repair the reported tab/header/configuration before deployment.

The verification function is read-only for family data.

## 4. Deploy the Web App

1. Choose **Deploy → New deployment**.
2. Select **Web app**.
3. Description: `PandaWise Sprint 11`.
4. Execute as: **Me**.
5. Who has access: **Anyone**.
6. Choose **Deploy**, complete authorization, and copy the URL ending in `/exec`.

The Web App is public at the transport layer so the APK can register and log in.
Private routes still require a valid signed parent token, and the spreadsheet/auth
secret are never returned.

## 5. Smoke-test without a command line

On a phone browser, open:

```text
<exec-url>?route=/health&method=GET
<exec-url>?route=/ready&method=GET
<exec-url>?route=/v1/config/bootstrap&method=GET
```

Each must show JSON with `"ok":true`. Bootstrap should include Chennai schools,
three Release 1 age groups, languages, skills, passions and avatar options.

## 6. Build the functional APK in GitHub

1. In GitHub, open **Actions → CI → Run workflow**.
2. Paste the exact `/exec` URL into `apps_script_url`.
3. Run the workflow on the Sprint 11 branch.
4. Download `pandawise-sprint-11-android` after all checks pass.
5. Verify the SHA-256 in the artifact manifest before installation.

For automatic builds, set the non-secret repository variable
`PANDAWISE_APPS_SCRIPT_URL` to the same `/exec` URL.

## Updating the backend

Apps Script deployments are versioned. After changing source, use
**Deploy → Manage deployments → Edit**, select **New version**, and deploy. An
existing deployment keeps the same `/exec` URL, so `config.dart` and GitHub do not
need to change.

## Account migration note

Sprint 11 hashes newly registered passwords as `sha256$salt$digest`. Any earlier
bcrypt-formatted `Password_Hash` row needs an authorized reset/re-registration
process; plain passwords must never be collected or copied into the workbook.
