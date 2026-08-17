# Sprint 11 traceability — Apps Script and Google Sheets migration

Status: source, Sheet contract and live Web App are verified on
`agent/sprint-11-live-backend`; functional APK and device UAT remain release gates.

| PRD/FSD requirement | Implementation | Evidence |
|---|---|---|
| Preserve existing UI | Existing Flutter feature screens and navigation retained | Flutter diff; no replacement app |
| Remove invalid backend | One Apps Script URL in `config.dart`; obsolete Node backend deleted | Static contract tests |
| Apps Script REST/JSON | `doGet`, `doPost`, JSON envelope and logical router | `services/apps-script`, API contract |
| Sheets-only database | Header-driven reads/writes across 23 live tabs with validation-aware preflight | Sheet store, readiness and regression tests |
| Register/login | Parent Master writes; salted SHA-256 password hash; signed token | auth source and tests |
| Child and Chennai school dropdown | Child Master writes; bootstrap from School Master | profile source and existing Flutter flow |
| 3–12 age logic only | Age Group Master drives eligibility; no 12–15 path | age resolver and workbook contract |
| Assessment autosave/resume | Append-only responses; latest answer per question; Save & Exit | assessment source and Flutter screen |
| Progress bar only | Existing linear progress retained; no question grid/sidebar | Flutter contract test |
| Reports/dashboard from Sheets | Skill weights, score bands, plan visibility and progress derived in Apps Script | assessment/progress source |
| Explorer/Growth/Mastery rules | All entitlements read from Subscription Master | plan source and plan UI |
| Offline support | Encrypted assessment, mission and profile mutation queue; automatic resume/periodic replay | offline store and tests |
| Configuration over hardcoding | Master validation/config rows drive options, labels, thresholds and content | bootstrap/config source; live config rows 53–67 |
| ₹0 infrastructure | Flutter + Apps Script + Sheets only; no server/cloud database/container | repository structure and test |
| Documentation and ZIP | README, API contract, deployment guide and CI source ZIP | repository and CI workflow |
| CI and APK | Apps Script, Node tooling, Flutter, security and URL-bound APK jobs | `.github/workflows/ci.yml` |
| Backend-free UI validation | Config-gated Demo button, global offline banner and stateful in-memory `PandaWiseApi` implementation | Flutter unit/widget tests and CI APK |

## Acceptance gate state

- Source and Sheet configuration: implemented across all 23 required tabs.
- Apps Script static/contract tests: 12 passing locally, including strict Sheet
  enum mappings and partial-write prevention.
- Live Web App URL: deployed and returning JSON for health, readiness and bootstrap.
- Functional registration/login/child creation and immediate Sheet writes: verified
  with fictional Sprint 11 test data; passwords are stored only as salted SHA-256 hashes.
- Offline Demo APK, checksum and ZIP: retained from the pre-deployment CI run.
- Server-backed functional APK: pending the current branch CI artifact.
- Android installation and full UAT: pending device testing.
