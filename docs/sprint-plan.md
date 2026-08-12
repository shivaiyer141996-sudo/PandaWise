# PandaWise Development Sprint Plan

The shared product conversation contains product milestones and design sprints. This
plan translates them into buildable engineering increments while preserving their
order and scope.

## Sprint 0 — Foundation

Goal: create an implementation-ready repository.

Deliverables:

- Monorepo, branch policy and CI.
- Product blueprint and architecture decisions.
- Google Sheets repository contract and non-secret configuration.
- Lightweight API skeleton, health endpoint and test harness.
- Flutter project skeleton and design tokens.

Exit criteria:

- API typecheck, tests and build pass.
- Flutter analyze and tests pass in CI.
- No secrets or spreadsheet credentials are committed.

## Sprint 1 — Parent and child foundation

Screens: SCR-001 through SCR-008.

Deliverables:

- Splash, login, signup and forgot-password flows.
- Parent session handling.
- Dashboard and five-tab app shell.
- Child list, add-child and child-profile flows.
- Age-group derivation, school/grade/language/time-commitment master loading.
- API authentication and parent/child endpoints.

Exit criteria:

- Parent can register/login and create/view a child.
- Inputs are validated and secrets remain backend-only.
- All Sprint 1 rules have automated API or widget tests.

## Sprint 2 — Discovery and GrowScore

Screens: SCR-009 through SCR-014.

Deliverables:

- Passion Discovery with one-to-five selections.
- Age/respondent-based Development Check.
- Auto-save/resume and assessment completion.
- Versioned scoring using the fixed 10-skill weights.
- GrowScore report with strengths first and positive-language policy.
- Up-to-three parent focus areas.

Exit criteria:

- Correct assessment bank is selected for AG01, AG02 and AG03.
- Recalculations are deterministic and weights total 100.
- Existing assessment history is never overwritten.

## Sprint 3 — Recommendation engine and journey

Screens: SCR-015 through SCR-018.

Deliverables:

- Explainable mission selection.
- Personalized 21-day schedule.
- One visible daily mission.
- Yes/Partially/No, enjoyment, difficulty and notes feedback.
- Weekly summary, streak and journey completion.

Exit criteria:

- Every eligible child receives a 21-day plan.
- Completed/recent missions and time commitment affect selection.
- Reassessment remains locked until journey and 70% completion rules pass.

## Sprint 4 — Progress and reassessment

Screens: SCR-019 through SCR-021.

Deliverables:

- Growth dashboard, completion and streak snapshots.
- Skill trends and assessment comparison.
- Assessment history and reassessment loop.
- New journey generation after reassessment.

Exit criteria:

- Parents can distinguish assessment improvement from activity completion.
- Explorer/Growth/Mastery history rules are enforced server-side.

## Sprint 5 — Commercial controls and preferences

Screens: SCR-022 through SCR-025.

Deliverables:

- Plan comparison and manual subscription controls; no payment gateway yet.
- Notification centre and channel preferences.
- Parent profile, referral fields, marketing consent, language and settings.
- Family/child-count and annual-assessment entitlements.

Exit criteria:

- All plan limits are configuration-driven and server-enforced.
- Marketing consent remains separate from terms acceptance.

## Sprint 6 — Release hardening

Deliverables:

- End-to-end regression tests for the full parent journey.
- Accessibility, low-connectivity, retry and corrupted-response handling.
- Security review, dependency scan and secret scan.
- Google Sheets quota/load tests and recovery procedures.
- Signed Android test build and release checklist.

Exit criteria:

- All CI gates pass.
- Release 1.0 scope is traceable from requirement to API/test.
- No critical defects or security findings remain open.

## Later releases

School/teacher workflows, expert services, marketplace, AI features, media evidence
and ages 12–15 remain separate roadmap items and must not enter these sprints without
an approved scope change.
