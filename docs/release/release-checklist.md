# PandaWise Release 1.0 Pilot Checklist

## Automated gates

- [x] Release candidate API typecheck, build and parent-journey regression pass.
- [x] Release candidate Flutter analysis, widget, accessibility and resilience tests pass.
- [x] Dependency audit and full-history Gitleaks gates exist.
- [ ] Sprint 10 `npm run pilot:readiness` passes for the exact PR commit.
- [ ] Sprint 10 API, Flutter and security jobs pass in GitHub Actions.
- [ ] Pilot APK, SHA-256, Flutter version and manifest are retained together.

## Google Sheets readiness

- [x] Header-driven mapping, controlled schema errors and transient retry/backoff exist.
- [x] A dated native rehearsal copy preserves all 23 source tabs.
- [x] Bounded header/master reads passed on the rehearsal copy.
- [x] Ten active skill weights total 100; plan assessment limits are 2/6/12 and
  every active plan has a 21-day journey.
- [ ] Sequential/concurrent API reads and one disposable fictional journey pass.
- [ ] A restricted `.xlsx` backup destination is approved and recorded.
- [ ] Monitoring owners and alert thresholds are assigned.

Rehearsal workbook:
[PandaWise Masters - Sprint 10 Pilot Rehearsal - 2026-08-13](https://docs.google.com/spreadsheets/d/1x5y3dREaGkdXPEKHU41dz0nThKMHLMeqW9IGdj7l2p4/edit)

The live PandaWise Masters workbook was not written during the structural rehearsal.

## Environment and data

- [ ] Store a production/pilot JWT secret of at least 32 random characters.
- [ ] Restrict HTTPS origins and workbook access to named pilot operators.
- [ ] Point the pilot API only to the copied workbook.
- [ ] Verify `/health` and three consecutive `/ready` responses.
- [ ] Confirm logs omit passwords, tokens, credentials and family PII.

## Android pilot artifact

- [ ] GitHub Actions builds `pandawise-1.0.0-pilot-android`.
- [ ] APK checksum matches `pilot-manifest.txt`.
- [ ] Manifest commit, workflow run and non-secret API URL match the test environment.
- [ ] APK installs on representative Android devices.
- [ ] Critical smoke flow passes: login, child, assessment, GrowScore, journey,
  Mission feedback, progress and settings.

The CI APK is debug-signed for controlled testing only. Public distribution requires
protected release signing, Play review and an approved production API environment.

## Human acceptance and decision

- [ ] All 37 UAT cases have results and evidence.
- [ ] No critical or high-severity defect remains open.
- [ ] CPO/Product Owner approves Release 1.0 scope and pilot evidence.
- [ ] Release owner records commit, workflow run, checksum and rollback owner.
- [ ] Go/no-go decision is dated and signed.
