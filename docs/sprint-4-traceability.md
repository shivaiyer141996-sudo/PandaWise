# Sprint 4 Traceability — Progress and Reassessment

Status: Implemented on `agent/sprint-4-progress`

| Requirement | API / implementation | Automated evidence |
|---|---|---|
| Separate assessment improvement from activity | `GET /v1/children/{childId}/progress` returns `assessmentSnapshot` and `activitySnapshot` independently | Integration test asserts GrowScore history separately from zero mission activity |
| Show completion, streak and points | `ProgressService.activitySnapshot` derives the latest journey and completion events | Progress contract and journey regression tests cover completion and streak snapshots |
| Compare GrowScore only when entitled | `ProgressService.comparisonAssessment` applies `Assessment_Comparison` from Subscription Master | Explorer receives no previous score; Growth receives latest-vs-previous |
| Enforce history access server-side | `assessmentHistory` is sliced from configured `Assessment_History_Access` before serialization | Explorer receives one entry; Growth and Mastery receive full history |
| Enforce skill-trend depth server-side | Growth receives two points per skill; Mastery receives full history; Explorer receives none | One integration test changes the plan and asserts all three filtered payloads |
| Keep child and annual assessment limits configurable | `ChildService` and `AssessmentService` read `PlanEntitlements` through the repository | Existing child-limit and Development Check tests pass through the configuration adapter |
| Restrict weekly summaries by plan | `JourneyService.weeklySummary` reads `Weekly_Summary_Enabled` | Explorer receives 403; Growth completes a seven-day summary |
| Unlock reassessment only after eligible journey | Progress actions are derived from the latest assessment's linked journey | Existing 21-day test asserts 70% gate and reassessment creation |
| Generate a new journey after reassessment | A completed reassessment without a linked journey returns `START_JOURNEY`; existing journey creation is idempotent per assessment | Progress integration test creates a 21-day journey from the latest seeded reassessment; Flutter action reopens the latest GrowScore focus flow |
| Prevent cross-parent progress access | Progress lookup uses `store.getChild(parentId, childId)` | Same ownership boundary used by child, assessment and journey endpoints |

## Screen coverage

| Screen | Flutter implementation |
|---|---|
| SCR-019 Growth Dashboard | `ProgressDashboardScreen` with separate assessment and mission cards |
| SCR-020 Skill Analytics | `SkillAnalyticsScreen` with plan-filtered assessment points |
| SCR-021 Assessment History | `AssessmentHistoryScreen` with linked journey activity |

The app does not calculate or hide paid insights locally. The API filters all plan
data before serialization, and plan values come from `18_Subscription_Master` through
the repository interface.
