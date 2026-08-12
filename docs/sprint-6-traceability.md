# Sprint 6 Traceability — Release Hardening

Status: Implemented on `agent/sprint-6-release-hardening`

| Release requirement | Implementation | Evidence |
|---|---|---|
| Full parent journey regression | Signup, Growth selection, child, Passion Discovery, Development Check, 15 mission completions, reassessment and fresh journey | `full-parent-journey.test.ts` |
| Low connectivity and retry | Flutter GET-only retry with timeout/backoff; writes never auto-repeat | `http_api_resilience_test.dart` |
| Corrupted response handling | Stable `INVALID_RESPONSE` mapping | Flutter resilience test |
| Accessible primary actions | Large-text and progress-semantics coverage | `accessibility_test.dart` |
| Sheets quota recovery | Bounded retry for 408/429/5xx, no retry for permanent errors | `google-sheets-resilience.test.ts` |
| Provider readiness | `/ready` validates configured business data separately from liveness | API integration test and operations runbook |
| Dependency and secret safety | High/critical npm audit gate plus full-history Gitleaks | `Security checks` CI job |
| Installable Android candidate | Deterministic Flutter 3.47.0 debug APK | `Android release candidate` CI artifact |
| Signing/launch controls | Explicit protected-keystore, AAB and human acceptance checklist | `docs/release/release-checklist.md` |

Release 1.0 remains within the parent-led, ages 3–12 scope. The internal APK does not
represent a production-signed public release.
