# PandaWise UX baseline

The files in `wireframes/` are the previously approved low-fidelity references. They
are retained as UX evidence, while the Flutter implementation follows the frozen
25-screen catalogue in `docs/product-blueprint.md`.

The contact sheet and four detailed wireframes cover the early child-profile,
assessment and discovery-result direction. They are intentionally low fidelity:
field behavior, validation, navigation and plan rules take priority over decorative
polish.

The approved interaction rules are:

- One primary objective and one dominant action per screen.
- Five bottom-navigation tabs only.
- Strengths before growth opportunities.
- No judgmental labels.
- No photo/video evidence in Release 1.0.
- Avatar selection instead of child-profile uploads.
- Pando encourages and celebrates without acting as a chatbot.

Sprint 3 implements SCR-015 through SCR-018 in Flutter: Journey Overview, Today's
Mission, Mission Completion and Weekly Summary. The journey tab lists eligible child
journeys; schedule metadata is visible, while future mission content remains locked
until the current daily feedback is submitted.

Sprint 4 implements SCR-019 through SCR-021: Growth Dashboard, Skill Analytics and
Assessment History. Assessment growth and mission activity are presented as separate
concepts, while plan-locked analytics explain the available upgrade outcome without
using judgmental language.
