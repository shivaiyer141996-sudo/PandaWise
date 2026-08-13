# PandaWise Release 1.0 Pilot UAT Checklist

Run this checklist on the checksum-verified Sprint 10 APK against the dedicated pilot
API and rehearsal workbook. Use fictional details only. Record a defect ID whenever
the observed result differs from the expected result; do not include PII in evidence.

## Test record

| Field | Value |
|---|---|
| Tester |  |
| Device / Android version |  |
| Pilot commit SHA |  |
| Workflow run |  |
| APK SHA-256 verified | Yes / No |
| API environment |  |
| Rehearsal workbook |  |
| Test date |  |

Status: `Not run`, `Pass`, `Fail`, `Blocked`, `Not applicable`.

## Screen and journey acceptance

| Case | Screens | Scenario | Expected result | Priority | Status / evidence |
|---|---|---|---|---|---|
| UAT-001 | SCR-001 | Launch without a session | Splash resolves to login without hanging or diagnostics. | Critical | Not run |
| UAT-002 | SCR-002 | Valid and invalid login | Valid account enters; invalid input gets a safe non-enumerating message. | Critical | Not run |
| UAT-003 | SCR-003 | Register fictional parent and accept Terms | Account is created once and required consent is recorded. | Critical | Not run |
| UAT-004 | SCR-004 | Recover known and unknown email | Both receive the same safe acknowledgement. | High | Not run |
| UAT-005 | SCR-005 | Dashboard before/after activity | Next action loads; measured growth and activity remain separate. | Critical | Not run |
| UAT-006 | SCR-006 | View owned children | Only the signed-in parent's children appear. | Critical | Not run |
| UAT-007 | SCR-007 | Add ages 3, 12, under 3 and over 12 | Eligible ages save; out-of-range ages are rejected positively. | Critical | Not run |
| UAT-008 | SCR-007 | Reach plan child limit | Configured limit is enforced with a useful next step. | High | Not run |
| UAT-009 | SCR-008 | Open child profile | Identity, avatar, school, language and family-time details match. | High | Not run |
| UAT-010 | SCR-009 | Select 0, 1 and over 5 passions | One to five save; invalid counts cannot continue. | High | Not run |
| UAT-011 | SCR-010–011 | Start Development Check | Age/respondent bank and plan question depth are correct. | Critical | Not run |
| UAT-012 | SCR-011 | Part-answer, close and resume | Progress resumes without overwriting history. | Critical | Not run |
| UAT-013 | SCR-012 | Complete required answers | Completion succeeds once and routes to the report. | Critical | Not run |
| UAT-014 | SCR-013 | Review GrowScore | Visible skills, positive wording and score match the attempt. | Critical | Not run |
| UAT-015 | SCR-014 | Choose focus areas | Up to three eligible visible skills save; invalid choices are blocked. | High | Not run |
| UAT-016 | SCR-015 | Generate journey | Exactly 21 days appear with explainable recommendations. | Critical | Not run |
| UAT-017 | SCR-016 | Open today and future Mission | Today's opens; future Missions remain locked. | Critical | Not run |
| UAT-018 | SCR-017 | Submit Yes/Partially/No feedback | Feedback saves once and updates progress. | Critical | Not run |
| UAT-019 | SCR-018 | View weekly summary | Counts, points, streak and positive wording match feedback. | High | Not run |
| UAT-020 | SCR-019 | Compare growth and activity | Both measures are distinct and source-consistent. | Critical | Not run |
| UAT-021 | SCR-020 | Open skill analytics | Trend order and plan visibility are correct. | High | Not run |
| UAT-022 | SCR-021 | Review history by plan | Explorer/Growth/Mastery history rules match the master. | High | Not run |
| UAT-023 | SCR-021 | Reassess before/after gate | Locked before day 21/70%; unlocked only after both. | Critical | Not run |
| UAT-024 | SCR-022 | Compare/change plan | Entitlements display; allowed changes save; invalid downgrade blocks. | Critical | Not run |
| UAT-025 | SCR-023 | Read notifications | Correct parent items load and read state persists. | High | Not run |
| UAT-026 | SCR-024 | Edit profile/referral | Valid values persist and create an audit entry. | High | Not run |
| UAT-027 | SCR-025 | Change language/channels | Preferences persist; marketing remains separate from Terms. | High | Not run |
| UAT-028 | SCR-001–025 | Sign out/relaunch/restore | Sign-out clears; valid persisted session restores safely. | Critical | Not run |

## Resilience, privacy and workbook checks

| Case | Scenario | Expected result | Priority | Status / evidence |
|---|---|---|---|---|
| UAT-029 | Disable/restore network during read | Retryable message appears and retry does not duplicate data. | High | Not run |
| UAT-030 | Interrupt feedback write and retry | Stable IDs prevent duplicate rows and one state remains. | Critical | Not run |
| UAT-031 | Timeout or malformed response | No stack/provider detail appears; app remains usable. | High | Not run |
| UAT-032 | Request another parent's child ID | Request rejects and returns no cross-parent data. | Critical | Not run |
| UAT-033 | Inspect UI, logs and network evidence | Secrets, credentials and unnecessary family data are absent. | Critical | Not run |
| UAT-034 | Large text, keyboard and screen reader | Critical controls remain readable, reachable and labelled. | High | Not run |
| UAT-035 | Compare headers with contract | Required headers/masters remain intact; live sheet unchanged. | Critical | Not run |
| UAT-036 | Inspect disposable journey rows | IDs are unique, events append and snapshots/audit update. | Critical | Not run |
| UAT-037 | Run bounded bootstrap reads | Sequential/concurrent reads avoid schema/quota/provider errors. | High | Not run |

## Completion summary

| Result | Count |
|---|---:|
| Pass |  |
| Fail |  |
| Blocked |  |
| Not applicable |  |
| Open critical defects |  |
| Open high defects |  |

Final recommendation: `Go` / `No-go` / `Conditional go`

Tester sign-off: ____________________  Date: ____________________

Product owner sign-off: ____________________  Date: ____________________
