# PandaWise Release 1.0 Checklist

## Automated gates

- [x] TypeScript strict typecheck and API build.
- [x] API unit/integration suite, including a full signup-to-reassessment parent path.
- [x] Flutter analysis, widget regression and accessibility/resilience tests.
- [x] Dependency audit fails on high or critical findings.
- [x] Full-history secret scan.
- [x] Android debug-signed release-candidate APK build and artifact upload.
- [x] OpenAPI and sprint traceability updated.

## Environment and data

- [ ] Set a production `JWT_SECRET` of at least 32 random characters in the secret store.
- [ ] Set restrictive HTTPS `ALLOWED_ORIGINS`.
- [ ] Share PandaWise Masters only with the production service-account identity.
- [ ] Set the real HTTPS `PANDAWISE_API_BASE_URL` at production build time.
- [ ] Create and record a dated pre-launch workbook backup.
- [ ] Complete the synthetic-copy quota rehearsal in the Google Sheets runbook.
- [ ] Verify `/health` and three consecutive `/ready` responses after deployment.

## Android signing and distribution

- [ ] Enrol the application in Play App Signing and document the owner/recovery path.
- [ ] Store upload keystore, alias and passwords in the protected release environment.
- [ ] Generate the Android host with package ID `com.pandawise.pandawise_mobile`.
- [ ] Build a release AAB with the production API URL; never commit signing material.
- [ ] Verify the AAB signature, version `1.0.0+6`, permissions and absence of secrets.
- [ ] Install through an internal Play track and complete device smoke tests.

The CI APK is intentionally debug-signed. A production-signed build cannot be produced
until the organization supplies its protected keystore and approves the final API URL.

## Human acceptance

- [ ] Test 3–4, 5–6, 7–9 and 10–12 age paths on representative Android devices.
- [ ] Test TalkBack, 200% text, screen rotation and minimum target sizes.
- [ ] Test offline launch, slow network, interrupted writes and safe retry copy.
- [ ] Verify positive/non-judgmental copy across GrowScore, Missions and reassessment.
- [ ] Obtain CPO scope sign-off and privacy/legal approval.
- [ ] Record owners for support, incident response, workbook recovery and rollback.
