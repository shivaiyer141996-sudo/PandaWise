# PandaWise Masters Contract

Workbook: [PandaWise Masters](https://docs.google.com/spreadsheets/d/1ox11C3hz0pozmjM3bwk6vh99OHH4HPxknSD0tejJRDY/edit)

The workbook currently contains 23 tabs. Google Sheets is the source of values;
this document records integration responsibilities and does not duplicate its rows.

| Tab | Responsibility |
|---|---|
| `01_Parent_Master` | Parent identity, persona, preferences, referral and subscription snapshot |
| `02_Child_Master` | Child profile and latest dashboard snapshots |
| `03_School_Master` | Chennai-first schools, boards and school types |
| `04_Age_Group_Master` | Primary age rules for questions, missions, journeys and reports |
| `04_Language_Master` | Supported languages and RTL capability |
| `04_Grade_Master` | Secondary academic-grade reference |
| `05_Skill_Master` | Fixed skills, weights, age expectations and display metadata |
| `06_Passion_Master` | Non-scored interests and recommendation tags |
| `07_Question_Master` | Versioned, age-based assessment questions |
| `08_Question_Options` | Configurable response options and scores |
| `09_Mission_Master` | Mission library and guidance |
| `10_Recommendation_Rules` | Score-band and mission-selection rules |
| `11_Mission_Scheduler` | Generated journey-to-mission scheduling |
| `12_Child_Assessments` | Immutable assessment attempts |
| `13_Child_Responses` | Per-question responses |
| `14_Child_Skill_Scores` | Per-assessment skill results |
| `15_Child_Passions` | Child-to-passion mappings |
| `16_Journey_Tracker` | 21-day journey state and completion |
| `17_Mission_Completion` | Daily completion and parent feedback |
| `18_Subscription_Master` | Explorer, Growth and Mastery entitlements |
| `19_Badge_Master` | Configurable achievements |
| `20_App_Configuration` | Global rules, allowed values and feature configuration |
| `21_Audit_Log` | Important operational actions |

## Required adapter behavior

- Resolve columns from the header row; reject missing required headers.
- Ignore unknown additive columns so safe workbook evolution does not break the API.
- Trim textual IDs but preserve meaningful case in display values.
- Treat timestamps as ISO-8601 strings at the API boundary.
- Never reorder, delete or rewrite historical assessment, response, journey or audit
  rows during normal operations.
- Validate foreign keys and configured values before appending operational rows.
- Use `04_Age_Group_Master`, not grade, for product eligibility decisions.
- Treat Child Master score/count/streak fields as dashboard snapshots; transactional
  tabs remain the source of truth.

## Parent headers used in Sprint 1

`Parent_ID`, `Parent_Name`, `Parent_Type`, `Mobile_Number`, `Email`,
`Password_Hash`, `Subscription_Plan_ID`, `Subscription_Start_Date`,
`Subscription_End_Date`, `Preferred_Language_ID`, `Daily_Time_Commitment`,
`Push_Notification`, `Email_Notification`, `WhatsApp_Notification`,
`Weekly_Summary`, `Mission_Reminder`, `Marketing_Consent`, `Terms_Accepted_At`,
`Referral_Code`, `Referred_By`, `Referral_Status`, `Last_Login_At`,
`Account_Status`, `Created_At`, `Updated_At`, `Created_By`.

## Child headers used in Sprint 1

`Child_ID`, `Parent_ID`, `Child_Name`, `Nickname`, `Avatar_ID`, `Date_of_Birth`,
`Age_Years`, `Age_Group_ID`, `Gender`, `School_ID`, `Grade_ID`, `Language_ID`,
`Known_Interests`, `Parent_Time_Commitment_Code`, `Current_Plan_ID`,
`Assessment_Status`, `Journey_Status`, `Assessment_Count`, `Journey_Count`,
`Current_GrowScore`, `Current_Badge_Level`, `Current_Streak`, `Record_Status`,
`Created_At`, `Updated_At`, `Created_By`, `Updated_By`.
