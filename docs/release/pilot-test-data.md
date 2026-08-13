# PandaWise Pilot Test Data

Use this pack only in the disposable pilot environment and rehearsal workbook. All
names, emails, phone numbers and child details are fictional. Never substitute real
family data during pilot testing.

## Important APK readiness notice

Use this data only with the Sprint 11 artifact named
`pandawise-sprint-11-android`. Its manifest must contain the deployed Google Apps
Script URL ending in `/exec`. Registration and feature testing are not valid on an
install-only artifact or before the Web App health/readiness checks pass.

## General entry rules

- Accept Terms for every registration.
- Marketing consent can be Yes or No as specified.
- Passwords below are disposable test-only values and must never be reused personally.
- If an email already exists, replace the three-digit suffix with another unique value.
- Registration creates the Explorer plan by default. Select Growth or Mastery from
  Profile → Subscription Plans before starting the Development Check where specified.
- School and Grade may be left as “Not selected”; this also tests optional fields.

## Parent accounts

| ID | Parent name | Type | Mobile | Email | Test-only password | Marketing | Required plan |
|---|---|---|---|---|---|---|---|
| PAR-T01 | Meera Test | Mother | 9000000001 | pw.explorer.20260813.001@example.com | PandaTest1 | No | Explorer — default |
| PAR-T02 | Rohan Test | Father | 9000000002 | pw.growth.20260813.002@example.com | PandaTest2 | Yes | Change to Growth |
| PAR-T03 | Kavya Test | Guardian | 9000000003 | pw.mastery.20260813.003@example.com | PandaTest3 | No | Change to Mastery |
| PAR-T04 | Nila Test | Grandparent | 9000000004 | pw.referral.20260813.004@example.com | PandaTest4 | Yes | Explorer — referral test |

Every password meets the API rule: 8–72 characters with uppercase, lowercase and a number.

## Primary child profiles

### CHD-T01 — AG01 / Explorer

| Field | Value |
|---|---|
| Parent | PAR-T01 |
| Full name | Tara Mehta |
| Nickname | Tara |
| Date of birth | 15/04/2022 |
| Expected age group on 13 Aug 2026 | AG01 — age 4 |
| Gender | Girl |
| Avatar | Pando Smile 🐼 |
| School / Grade | Not selected |
| Language | English |
| Known interests | Drawing, Music, Storytelling, Gardening |
| Family time | 10 minutes |
| Passions | Drawing, Music, Nature & Gardening, Acting & Storytelling |
| Development Check response pattern | Select **Agree** for all 30 questions |
| Focus areas | Select the first recommended area |
| Day-1 Mission feedback | Yes; enjoyment 5; Medium; note “Completed together after dinner.” |

Expected: registration and one child succeed, the Development Check completes, a
GrowScore appears and a 21-day journey is generated from the CPO-approved workbook.
If a pilot environment produces a 7-day Explorer journey, record a High defect because
it is using stale in-memory entitlements instead of the approved Sheet master.

### CHD-T02 — AG02 / Growth

| Field | Value |
|---|---|
| Parent | PAR-T02 |
| Full name | Arjun Rao |
| Nickname | Arjun |
| Date of birth | 10/04/2018 |
| Expected age group on 13 Aug 2026 | AG02 — age 8 |
| Gender | Boy |
| Avatar | Pando Book 📚 |
| School / Grade | Any values shown by the pilot master, or Not selected |
| Language | English |
| Known interests | Chess, Reading, Science, Coding |
| Family time | 20 minutes |
| Passions | Chess, Coding, Reading, Science |
| Development Check response pattern | Repeat: Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree |
| Focus areas | Select all three recommended areas |
| Day-1 Mission feedback | Partial; enjoyment 3; Hard; note “Needed one reminder but stayed curious.” |

Expected: Growth shows 50 questions, all 10 skills, weekly-summary availability and a
21-day journey. The mixed answers should produce varied skill scores and explainable
focus recommendations; no exact score is prescribed.

### CHD-T03 — AG03 / Mastery

| Field | Value |
|---|---|
| Parent | PAR-T03 |
| Full name | Mira Shah |
| Nickname | Mira |
| Date of birth | 10/02/2015 |
| Expected age group on 13 Aug 2026 | AG03 — age 11 |
| Gender | Prefer Not to Say |
| Avatar | Pando Star ⭐ |
| School / Grade | Any values shown by the pilot master, or Not selected |
| Language | Tamil |
| Known interests | Robotics, Public Speaking, Photography, Chess |
| Family time | 30 minutes |
| Passions | Robotics, Public Speaking, Photography, Chess, Science |
| Development Check response pattern | Questions 1–25: Strongly Agree; questions 26–50: Neutral |
| Focus areas | Select three areas, including the lowest recommended score |
| Day-1 Mission feedback | No; enjoyment 2; Hard; note “We will retry tomorrow with more time.” |

Expected: AG03 uses the hybrid respondent bank, shows 50 questions/all 10 skills and
creates a 21-day Mastery journey.

## Referral test

1. Register PAR-T01 and open Profile.
2. Copy the dynamically generated “Your referral code”.
3. Log out and register PAR-T04.
4. Open Profile → Apply code and enter PAR-T01’s code.
5. Expected: PAR-T04 shows the applied code with status `Pending`.
6. Attempt to apply another code to PAR-T04.
7. Expected: the second application is rejected.
8. Do not type PAR-T04’s own code; self-referral must be rejected.

## Plan and entitlement data

| Check | Account | Data/action | Expected |
|---|---|---|---|
| Default plan | PAR-T01 | Register | Explorer selected |
| Explorer child limit | PAR-T01 | Add CHD-T01, then attempt a second child | First succeeds; second is blocked if Max Children = 1 |
| Growth plan | PAR-T02 | Select Growth before assessment | 50 questions, 10 visible skills, weekly summary enabled |
| Growth child limit | PAR-T02 | Add three fictional children, attempt a fourth | Fourth is blocked if Max Children = 3 |
| Mastery plan | PAR-T03 | Select Mastery | 50 questions, 10 visible skills, advanced analytics enabled |
| Invalid downgrade | A parent with more children/checks than Explorer permits | Select Explorer | Downgrade is blocked with a clear message |
| WhatsApp | Any account | Notification preferences | Disabled and labelled future |
| Weekly summary | PAR-T01 vs PAR-T02 | Notification preferences | Disabled for Explorer; available for Growth |

The CPO-approved rehearsal workbook currently expects assessment allowances of
Explorer 2, Growth 6 and Mastery 12 per year, with 21-day journeys for all three plans.

## Additional fictional children for limit testing

| ID | Full name | Nickname | DOB | Gender | Language | Interests | Time |
|---|---|---|---|---|---|---|---|
| CHD-T04 | Neel Patel | Neel | 20/03/2021 | Boy | English | Music, Drawing | 15 minutes |
| CHD-T05 | Sana Roy | Sana | 12/05/2017 | Girl | English | Reading, Science | Weekends only |
| CHD-T06 | Dev Kumar | Dev | 08/07/2019 | Prefer Not to Say | Tamil | Football, Cooking | 10 minutes |

## Age-boundary data

These values are dated for 13 Aug 2026. Use the device date consistently.

| Case | Date of birth | Expected |
|---|---|---|
| Minimum supported age | 12/08/2023 | Accepted as age 3 / AG01 |
| AG01→AG02 boundary | 12/08/2020 | Accepted as age 6 / AG02 |
| AG02→AG03 boundary | 12/08/2017 | Accepted as age 9 / AG03 |
| Maximum supported age | 12/08/2014 | Accepted as age 12 / AG03 |
| Unsupported age 13 | 13/08/2013 | Rejected with positive ages-3-to-12 message |

The mobile date picker prevents most under-3/over-12 inputs. Where an invalid date is
not selectable, record that the client constraint passed rather than bypassing it.

## Negative input data

| Case | Test value/action | Expected |
|---|---|---|
| Weak password | `pandatest` | Registration blocked: uppercase and number required |
| Short password | `Pan1` | Registration blocked: minimum 8 characters |
| Invalid email | `meera.test` | Registration blocked |
| Terms not accepted | Leave Terms unchecked | Registration blocked |
| Duplicate account | Register PAR-T01 twice | Second registration rejected |
| Wrong login | PAR-T01 email with `WrongPass1` | Safe invalid-credentials response |
| Empty passions | Select none and continue | Continue blocked |
| Excess passions | Attempt more than five | Sixth selection blocked |
| Assessment before passions | Try to start without Passion Discovery | Start blocked |
| Incomplete check | Leave one required response unanswered | Completion blocked; progress retained |
| Empty focus | Continue without a focus area | Continue blocked |
| Future Mission | Open day 2 immediately | Locked |
| Referral self-use | Apply the same parent’s own referral code | Rejected |
| Explorer weekly summary | Turn it on | Disabled / plan message shown |

## Day-1 verification record

For each primary account capture these values without PII screenshots:

| Field | PAR-T01 | PAR-T02 | PAR-T03 |
|---|---|---|---|
| Registration |  |  |  |
| Plan displayed |  |  |  |
| Child age group |  |  |  |
| Passion count |  |  |  |
| Question count |  |  |  |
| GrowScore |  |  |  |
| Visible skills |  |  |  |
| Journey days |  |  |  |
| Day-1 feedback saved once |  |  |  |
| Future Mission locked |  |  |  |
| Defect IDs |  |  |  |

## Test completion rule

Do not mark device UAT passed merely because the APK installs. Functional test data
is valid only when the manifest contains the approved Apps Script `/exec` URL,
health/readiness succeed, and the deployment targets the workbook approved for that
test run. Use only fictional family data and record every created test ID for cleanup.
