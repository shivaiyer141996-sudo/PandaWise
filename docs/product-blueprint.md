# PandaWise Product Blueprint — Release 1.0

Status: Frozen baseline
Product: PandaWise
Mascot: Pando
Primary user: Parent
Target children: Ages 3–12

## Vision

Help parents systematically identify, nurture and track their child's holistic
development through personalized development checks, structured missions and
measurable progress.

PandaWise is a child growth journey, not a school-learning or one-time assessment
app. The assessment is the entry point; the recurring 21-day journey is the product.

## Release goal

`Assess -> Recommend -> Build habits -> Track growth -> Reassess`

Release 1.0 contains parent accounts, child profiles, passion discovery, age-based
development checks, GrowScore, parent focus areas, personalized missions, daily
feedback, weekly summaries, progress history and plan controls.

## Age and respondent model

| Age group | Code | Respondent |
|---|---|---|
| 3–6 | AG01 | Parent |
| 6–9 | AG02 | Parent |
| 9–12 | AG03 | Parent + child |

The upper boundary of AG01 and AG02 is exclusive. AG03 includes age 12.

## Child Development Framework

| Skill | Weight |
|---|---:|
| Communication | 12% |
| Confidence | 12% |
| Logical Thinking | 12% |
| Creativity | 10% |
| Curiosity | 10% |
| Reading Habit | 10% |
| Emotional Intelligence | 10% |
| Discipline | 10% |
| Leadership | 7% |
| Financial Awareness | 7% |
| **Total** | **100%** |

Every question and mission maps to one primary skill so results stay explainable.

### Score interpretation

| Score | Parent-facing interpretation |
|---|---|
| 90–100 | Exceptional |
| 75–89 | Strong |
| 60–74 | Age appropriate |
| 40–59 | Needs development |
| Below 40 | Priority area |

User-facing summaries lead with strengths and use `growth opportunity` rather than
negative labels.

## Passion model

Passions are non-scored interests used to personalize missions. Release 1.0 stores
the selected interests and supports recommendation tags for indoor/outdoor,
individual/group and creative/analytical preferences.

## Journey rules

- A journey lasts 21 days and exposes one mission at a time.
- Mission selection considers age group, skill scores, parent focus areas, passion
  fit, prior missions, available family time and difficulty progression.
- Daily feedback is deliberately lightweight: Yes/Partially/No, enjoyment,
  perceived difficulty and optional notes.
- No photo, video or audio evidence is required in Release 1.0.
- Reassessment unlocks after a 21-day journey and at least 70% mission completion,
  subject to plan limits.
- Weekly summaries appear after each seven-day block.

## Plans

| Capability | Explorer | Growth | Mastery |
|---|---|---|---|
| Price | Free | ₹1,999/year | ₹3,999/year |
| Children | 1 | Up to 3 | Unlimited |
| Assessments/year | 2 | 6 | 12 |
| Skill visibility | Top 5 | All | All |
| Missions per skill | 1 | 2 | 3 |
| Progress tracker | No | Yes | Yes |
| Assessment comparison | Latest only | Latest vs previous | Full history |
| Weekly/monthly reports | No | Yes | Yes |
| Advanced analytics | No | No | Yes |

The UI sells outcomes, not question counts.

## Approved screen catalogue

| ID | Screen | Sprint |
|---|---|---:|
| SCR-001 | Splash | 1 |
| SCR-002 | Login | 1 |
| SCR-003 | Signup | 1 |
| SCR-004 | Forgot Password | 1 |
| SCR-005 | Dashboard | 1 |
| SCR-006 | My Children | 1 |
| SCR-007 | Add Child | 1 |
| SCR-008 | Child Profile | 1 |
| SCR-009 | Passion Discovery | 2 |
| SCR-010 | Development Check | 2 |
| SCR-011 | Assessment Questions | 2 |
| SCR-012 | Assessment Complete | 2 |
| SCR-013 | GrowScore Report | 2 |
| SCR-014 | Parent Focus Areas | 2 |
| SCR-015 | Journey Overview | 3 |
| SCR-016 | Today's Mission | 3 |
| SCR-017 | Mission Completion | 3 |
| SCR-018 | Weekly Summary | 3 |
| SCR-019 | Growth Dashboard | 4 |
| SCR-020 | Skill Analytics | 4 |
| SCR-021 | Assessment History | 4 |
| SCR-022 | Subscription Plans | 5 |
| SCR-023 | Notification Centre | 5 |
| SCR-024 | Profile | 5 |
| SCR-025 | Settings | 5 |

Each screen has one primary objective and must document fields, validation, business
rules, navigation, plan visibility, data sources and API contracts.

## Navigation

Five bottom tabs only:

1. Home
2. Children
3. Journey
4. Progress
5. Profile

## Brand and interaction language

- Product: PandaWise
- Mascot: Pando
- Primary blue: `#2563EB`
- Growth green: `#22C55E`
- White: `#FFFFFF`
- Surface: `#F8FAFC`
- Primary text: `#1E293B`
- Secondary text: `#64748B`
- Font: Inter
- Design motto: **Calm for Parents. Fun for Children. Focused on Growth.**
- One primary action per screen, large touch targets and minimal text.

## Release 1.0 exclusions

- Age group 12–15
- School, teacher, counsellor or psychologist logins
- School dashboards and benchmarking
- AI chatbot
- Marketplace, expert booking, courses, communities and live classes
- Photo/video/voice uploads
- Certificates
- Dark mode

## Source of business truth

The native Google Sheet `PandaWise Masters` is the Release 1.0 configurable business
source. Skills, questions, passions, missions, rules, plans, limits, badges,
notifications and configuration must not be duplicated as hardcoded mobile logic.
