# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.specify/memory/constitution.md` (Saloum Évasion v1.0.0). Each gate must be checked
or the deviation recorded in Complexity Tracking with owner approval.

- [ ] **I. Mobile-first** — designed at 360 px, `min-width` media queries only, touch targets
      ≥ 44 px, no hover-only feature, sticky Réserver/WhatsApp bar, correct input types +
      autocomplete, flow usable on 3G
- [ ] **II. Performance** — LCP ≤ 2.5 s (lab ≤ 2.0 s slow 4G), INP ≤ 200 ms, CLS ≤ 0.1;
      Lighthouse mobile Perf ≥ 95 / SEO 100 / A11y ≥ 95 / BP 100; initial JS ≤ 150 KB gz per
      route; hero image ≤ 120 KB AVIF/WebP; no video before interaction; ≤ 2 self-hosted fonts
- [ ] **III. SEO** — SSR/SSG for public pages; unique title ≤ 60 / description ≤ 155; single
      H1; canonical, OG, Twitter; `/fr` + `/en` hreflang + x-default; valid JSON-LD; sitemap;
      301 for changed URLs; funnel/account pages noindex; single-source NAP
- [ ] **IV. Accessibility** — WCAG 2.2 AA, semantic HTML, contrast ≥ 4.5:1, full keyboard,
      axe zero errors
- [ ] **V. Trust** — real media only, reviews only from completed stays, prices TTC in FCFA
      with indicative EUR, cancellation terms shown before payment
- [ ] **VI. Senegal market** — XOF integer amounts, Wave + Orange Money on par with card,
      WhatsApp contact, data-frugal
- [ ] **VII. Quality** — TS strict, no `any`, unit tests on business logic, mobile E2E,
      Lighthouse CI + axe required checks
- [ ] **VIII. Simplicity** — MVP first, single repo, single web app, no new service without
      measured need
- [ ] **IX. Privacy & security** — Law 2008-12 + GDPR, cookie consent before non-essential
      trackers, no card data stored or proxied

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
