# Sprint 3 Traceability — Recommendation Engine and Journey

Status: Implemented on `agent/sprint-3-journey`

| Requirement | API / implementation | Automated evidence |
|---|---|---|
| Parent chooses 1–3 GrowScore focus areas | `POST /v1/children/{childId}/journeys` | Rejects invalid focus sets; journey test uses parent priorities |
| Generate an explainable plan-length schedule | `JourneyService.create`; Mission, Recommendation Rule, Subscription and App Configuration masters | Asserts seven Explorer schedules and 21 Growth/Mastery schedules with deterministic age/plan selection |
| Use age, score band, focus, passion, time and history | `JourneyService.chooseMission` and stored `Priority_Source` | Asserts age/plan duration fit, unique initial rotation and explainability |
| Exclude recent/completed missions when alternatives exist | `recentMissionIds` plus selection penalties | Asserts unique first skill rotation; service preserves exclusion reason |
| Expose only one daily mission | Journey view returns content only under `today`; future schedules expose metadata only | Asserts exactly one unlocked schedule and current mission |
| Capture Yes / Partially / No | `PUT /v1/journeys/{journeyId}/schedules/{scheduleId}/completion` | 21-day completion test covers Yes and No paths |
| Capture enjoyment, difficulty and optional notes | Mission completion schema and `17_Mission_Completion` adapter | API schema validation plus full completion flow |
| Update streak and completion snapshots | `saveJourneyProgress` updates completion, journey and child snapshots | Asserts completed count, percentage, journey status and child journey count |
| Weekly summary after each seven check-ins | `GET /v1/journeys/{journeyId}/weekly-summary/{week}` | Week-one response asserts seven days and 100% completion |
| Lock reassessment until journey end and at least 70% completion | `AssessmentService.start` and journey completion gate | Asserts locked mid-journey and unlocked at 15/21 (71.43%) |
| Prevent cross-parent access | All journey reads resolve the child through token-owned parent ID | Ownership path uses the same `ownedChild` enforcement as assessments |

## Screen coverage

| Screen | Flutter implementation |
|---|---|
| SCR-015 Journey Overview | `JourneyOverviewScreen` and the Journey bottom tab |
| SCR-016 Today's Mission | `TodayMissionScreen` |
| SCR-017 Mission Completion | `MissionCompletionScreen` |
| SCR-018 Weekly Summary | `WeeklySummaryScreen` |

The mobile app receives no Google credentials and accesses every journey operation
through the authenticated API. Mission content, rules, 7/21-day plan length and
journey thresholds remain configuration-driven through the master workbook.
