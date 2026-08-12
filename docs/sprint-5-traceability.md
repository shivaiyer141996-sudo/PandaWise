# Sprint 5 Traceability — Commercial Controls and Preferences

Status: Implemented on `agent/sprint-5-commercial`

| Requirement | API / implementation | Automated evidence |
|---|---|---|
| Compare Explorer, Growth and Mastery | `GET /v1/plans` reads all 26 Subscription Master commercial and entitlement fields | Plan test asserts all three plans, live Explorer limit and Growth pricing/recommendation |
| Manual subscription controls, no gateway | `PUT /v1/me/subscription`; response declares `MANUAL_V1` and `paymentGatewayEnabled=false` | Upgrade test changes parent and child snapshots |
| Safe plan downgrade | `AccountService.changePlan` checks active child count and family Development Checks used this year | Three-child Growth family cannot select Explorer |
| Enforce child limit | `ChildService` reads `Max_Children` | Explorer and Growth creation-limit tests |
| Enforce annual assessment limit | `AssessmentService` counts family attempts and reads `Included_Assessments_Per_Year` | Explorer's second annual attempt returns 403 |
| Enforce plan journey length and mission depth | `JourneyService` applies `Journey_Length_Days` and `Missions_Per_Skill` | Explorer journey test asserts seven days; Growth and Mastery assert 21 |
| Notification centre | `GET /v1/notifications` derives private, actionable family notices | Empty-family centre returns the get-started notice |
| Independent channel preferences | `PUT /v1/me/notification-preferences` | Push/email/reminder persist; Explorer weekly summary is rejected |
| WhatsApp future-only | API rejects true and Flutter renders a disabled future option | Integration test asserts `WHATSAPP_NOT_AVAILABLE` |
| Parent persona, language and time | `PUT /v1/me/profile` validates language against master data | Profile test updates Guardian, Tamil and 20-minute commitment |
| Marketing consent separate from terms | `PUT /v1/me/marketing-consent` updates only consent | Test proves `Terms_Accepted_At` is unchanged |
| Referral lifecycle | Unique registration code plus `PUT /v1/me/referral` validation | Valid external code becomes Pending; duplicate application is rejected |

## Screen coverage

| Screen | Flutter implementation |
|---|---|
| SCR-022 Subscription Plans | `SubscriptionPlansScreen` |
| SCR-023 Notification Centre | `NotificationCentreScreen` and `NotificationPreferencesScreen` |
| SCR-024 Profile | `ProfileTab` and `ParentProfileEditScreen` |
| SCR-025 Settings | `SettingsScreen` and `ReferralScreen` |

All prices, plan positioning and limits are returned by the API from
`18_Subscription_Master`. The mobile app does not duplicate commercial values.
