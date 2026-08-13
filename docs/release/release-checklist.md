# PandaWise Sprint 11 release checklist

## Automated gates

- [x] Apps Script syntax, architecture and contract tests pass locally.
- [x] Repository secret-pattern scan passes locally.
- [ ] Apps Script, Flutter and security jobs pass for the exact PR commit.
- [ ] Functional Android job uses the real deployed `/exec` URL.
- [ ] APK, SHA-256, Flutter version, manifest and source ZIP are retained together.

## Google Apps Script and Sheets

- [x] Live master/config rows required by Sprint 11 are present and validated.
- [ ] `PANDAWISE_SPREADSHEET_ID` and a new `PANDAWISE_AUTH_SECRET` are Script Properties.
- [ ] `verifyPandaWiseDeployment` returns healthy readiness and non-zero master counts.
- [ ] Web App executes as the authorized owner and access is set to Anyone.
- [ ] Health, readiness and bootstrap browser checks return JSON `ok:true`.
- [ ] Register/login/child/assessment/journey/report writes appear immediately.
- [ ] Three consecutive readiness checks and one synthetic full journey pass.
- [ ] A dated native backup and rollback owner are recorded.

## Functional acceptance

- [ ] Register and login work with a newly created fictional account.
- [ ] Child creation uses Chennai School Master dropdown values only.
- [ ] Assessment autosaves, Save & Exit works, and resume restores progress.
- [ ] Offline answer, mission and profile edits sync after reconnection.
- [ ] Explorer/Growth/Mastery visibility matches Subscription Master.
- [ ] GrowScore reports, dashboard and progress are derived from Sheets.
- [ ] Ages below 3, above 12 and the 12–15 group remain unavailable.

## Android and decision

- [ ] APK checksum matches `sprint-11-manifest.txt` and it installs successfully.
- [ ] Full fictional-data UAT passes on representative Android devices.
- [ ] No critical/high defect remains open.
- [ ] CPO/Product Owner approves evidence and Release 1 scope.
- [ ] Release owner records commit, workflow run, checksum, rollback and decision date.

The debug APK is for controlled testing. Public distribution requires protected
release signing, store review and approved privacy/operations controls.
