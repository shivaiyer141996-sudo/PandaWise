# PandaWise Development Sprint Plan

This is the approved Release 1.0 roadmap. Sprints 0–9 deliver the product; Sprint
10 is the controlled pilot and deployment-readiness sprint.

## Sprint 0 — Foundation

Deliverables:

- Monorepo, branch policy and CI.
- Product blueprint, architecture and Google Sheets repository boundary.
- API and Flutter skeletons, health endpoint and test harness.

Exit: API gates pass, Flutter gates run in CI and no credentials are committed.

## Sprint 1 — Authentication and parent account

Screens: SCR-001 through SCR-004.

Deliverables:

- Splash, login, signup and forgot-password flows.
- Parent registration, password hashing and safe session restoration.
- Short-lived JWT authentication, active-account checks and throttling.

Exit: a parent can register, log in and restore a session without exposing secrets.

## Sprint 2 — Parent and child foundation

Screens: SCR-005 through SCR-008.

Deliverables:

- Dashboard, five-tab shell, child list, add-child and child-profile flows.
- Age-group derivation and Release 1.0 age-boundary enforcement.
- School, grade, language, avatar and family-time master loading.
- Configuration-driven child limits and server-side ownership.

Exit: authenticated parents can manage only their eligible child profiles.

## Sprint 3 — Passion Discovery and Development Check

Screens: SCR-009 through SCR-012.

Deliverables:

- One-to-five non-scored Passion Discovery selections.
- Age- and respondent-based Development Check.
- Auto-save/resume, immutable attempts and response history.

Exit: correct AG01/AG02/AG03 banks load and incomplete checks resume safely.

## Sprint 4 — GrowScore and focus areas

Screens: SCR-013 and SCR-014.

Deliverables:

- Versioned GrowScore using the fixed 10-skill weights.
- Strengths-first, positive-language report and plan-aware visibility.
- Up-to-three eligible parent focus areas.

Exit: recalculation is deterministic, weights total 100 and history is preserved.

## Sprint 5 — Personalized journey

Screen: SCR-015.

Deliverables:

- Explainable recommendations and a personalized 21-day schedule.
- Age, GrowScore, focus, passion, plan and family-time consideration.
- Recent-mission exclusion and difficulty progression.

Exit: every eligible child receives 21 scheduled days linked to a completed check.

## Sprint 6 — Daily Missions and feedback

Screens: SCR-016 through SCR-018.

Deliverables:

- One visible daily Mission and locked future Missions.
- Yes/Partially/No feedback, enjoyment, difficulty and parent notes.
- Streaks, points, weekly summaries and journey completion.
- Day-21 and 70% reassessment gate.

Exit: feedback updates progress once and reassessment unlocks only after both rules.

## Sprint 7 — Analytics, reports and reassessment

Screens: SCR-019 through SCR-021.

Deliverables:

- Assessment growth and activity completion shown separately.
- Skill trends, assessment comparison and plan-aware history.
- Reassessment and next-journey loop.

Exit: parents can distinguish measured improvement from Mission activity.

## Sprint 8 — Subscriptions, notifications and preferences

Screens: SCR-022 through SCR-025.

Deliverables:

- Manual plan activation; no Release 1.0 payment gateway.
- Master-driven child, assessment, question-depth and feature entitlements.
- Notifications, profile, referral, language and family preferences.
- Marketing consent kept separate from Terms acceptance.

Exit: plan and profile changes are server-enforced and auditable.

## Sprint 9 — Release hardening

Deliverables:

- Full recurring parent-journey regression.
- Accessibility, timeout, malformed-response and low-connectivity handling.
- Google Sheets backoff, readiness and recovery controls.
- Dependency and secret scans plus a debug-signed Android artifact.

Exit: all automated gates pass and no critical release or security finding remains.

## Sprint 10 — Pilot release and deployment

Sprint 10 validates and distributes the completed candidate without adding features.

Deliverables:

- Publish a review branch and draft pull request.
- Run API, Flutter and security gates for the exact pilot commit.
- Produce a debug-signed Android APK, SHA-256 checksum and build manifest.
- Rehearse the Google Sheets schema on a dated native workbook copy.
- Execute 25-screen device UAT and maintain a severity-controlled defect log.
- Record a product/release-owner go/no-go decision.

Exit criteria:

- GitHub Actions passes for the exact pilot commit.
- The checksum-verified APK installs and completes the critical smoke flow.
- The copied workbook passes schema/read checks and one disposable fictional journey.
- No critical/high defect, security finding or data-integrity issue remains.
- The decision records commit, workflow run, API environment and artifact checksum.

## Implementation status

Sprints 0–9 are implemented in the Release 1.0 candidate on `main`. Sprint 10 is
release operations only and must remain on its review branch until CI and UAT gates pass.

## Later releases

School/teacher workflows, expert services, marketplace, AI features, media evidence,
communities, live classes and ages 12–15 require separate product approval.
