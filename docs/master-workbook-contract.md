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

## Operational headers used in Sprint 2

- Questions: `Question_ID`, `Assessment_Type`, `Age_Group_ID`, `Respondent_Type`,
  `Skill_ID`, `Question_Text`, `Question_Type_ID`, `Question_Set_Tier`, `Weight`,
  `Reverse_Scored_Flag`, `Display_Order`, `Assessment_Version`, `Required_Flag`,
  `Record_Status`.
- Options: `Option_ID`, `Question_Type_ID`, `Display_Text`, `Numeric_Score`,
  `Display_Order`, `Reverse_Score`, `Record_Status`.
- Assessments: `Assessment_ID`, `Child_ID`, `Assessment_Version`,
  `Assessment_Depth`, `Respondent_Mode`, `Started_At`, `Completed_At`,
  `Overall_GrowScore`, `Score_Band`, `Question_Count`, `Assessment_Sequence`,
  `Assessment_Status`, `Calculation_Version`.
- Responses: `Response_ID`, `Assessment_ID`, `Child_ID`, `Question_ID`,
  `Respondent_Type`, `Option_ID`, `Raw_Score`, `Adjusted_Score`, `Answered_At`,
  `Record_Status`.
- Skill scores: `Skill_Score_ID`, `Assessment_ID`, `Child_ID`, `Skill_ID`,
  `Weighted_Raw_Score`, `Normalized_Score`, `Skill_Weight_Percent`,
  `Weighted_Contribution`, `Score_Band`, `Previous_Score`,
  `Change_From_Previous`, `Calculated_At`, `Calculation_Version`.
- Passions: `Child_Passion_ID`, `Child_ID`, `Passion_ID`, `Preference_Rank`,
  `Passion_Status`, `Source`, `Captured_At`, `Assessment_ID`, `Record_Status`.

## Operational headers used in Sprint 3

- Missions: `Mission_ID`, `Skill_ID`, `Age_Group_ID`, `Mission_Name`,
  `Mission_Description`, `Difficulty_Level`, `Duration_Minutes`, `Materials_Needed`,
  `Parent_Guidance`, `Child_Instructions`, `Learning_Outcome`, `Mission_Points`,
  `Repeatable_Flag`, `Indoor_Outdoor`, `Plan_Eligibility`, `Mission_Category`,
  `Display_Order`, `Record_Status`.
- Recommendation rules: `Rule_ID`, `Age_Group_ID`, `Skill_ID`, `Min_Score`,
  `Max_Score`, `Score_Band`, `Priority_Rank`, `Recommended_Difficulty`,
  `Mission_Category`, `Focus_Percent`, `Parent_Message_Template`,
  `Exclude_Completed_Within_Days`, `Minimum_Journey_Completion_Percent`,
  `Record_Status`.
- Scheduler: `Schedule_ID`, `Journey_ID`, `Child_ID`, `Mission_ID`, `Journey_Day`,
  `Journey_Week`, `Scheduled_Date`, `Schedule_Status`, `Unlocked_Flag`,
  `Priority_Source`, `Skill_ID`, `Completion_ID`, `Generated_At`, `Created_By`,
  `Updated_At`, `Notes`.
- Journey tracker: `Journey_ID`, `Child_ID`, `Source_Assessment_ID`, `Plan_ID`,
  `Start_Date`, `Planned_End_Date`, `Actual_End_Date`, `Journey_Status`,
  `Current_Day`, `Missions_Planned`, `Missions_Completed`, `Completion_Percent`,
  `Reassessment_Unlocked_Flag`, `Created_At`, `Updated_At`, `Journey_Version`.
- Mission feedback: `Completion_ID`, `Journey_ID`, `Schedule_ID`, `Child_ID`,
  `Mission_ID`, `Completion_Status`, `Enjoyment_Score`, `Difficulty_Feedback`,
  `Parent_Notes`, `Completed_At`, `Mission_Points_Awarded`, `Streak_Day`,
  `Submission_Source`, `Record_Status`, `Created_At`, `Updated_At`.

## Entitlement headers used in Sprint 4

Subscription plans are resolved by `Plan_ID` and filtered by the live
`Record_Status` column. Enforcement uses:
`Plan_Name`, `Max_Children`, `Included_Assessments_Per_Year`, `Question_Count`,
`Skills_Visible`, `Missions_Per_Skill`, `Growth_Tracker_Enabled`,
`Assessment_History_Access`, `Assessment_Comparison`, `Weekly_Summary_Enabled`,
`Monthly_Report_Enabled` and `Advanced_Analytics_Enabled`.

History and comparison limits are applied in the API response. The Flutter app must
not receive hidden assessment or skill-history rows and then attempt to conceal them.

## Parent and commercial fields used in Sprint 5

- Plan comparison reads all 26 live headers, including positioning, monthly/annual
  price, journey length, passion insight level, GrowScore, growth timeline, parent
  guidance, support, export, language, display-order and recommended fields from
  `18_Subscription_Master`.
- Profile and settings updates write only the matching `01_Parent_Master` row by
  `Parent_ID`; they do not append a second parent record.
- `Push_Notification`, `Email_Notification`, `Weekly_Summary` and
  `Mission_Reminder` remain independent. `WhatsApp_Notification` stays false in
  Release 1.0.
- `Marketing_Consent` is mutable independently of immutable
  `Terms_Accepted_At`.
- `Referral_Code` is generated at registration; a valid external code sets
  `Referred_By` and moves `Referral_Status` to `Pending`.
