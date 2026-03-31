---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when building web components, pages, posters, artifacts, or applications (including websites, landing pages, dashboards, React components, HTML/CSS layouts, or styling/beautifying any web UI). Generates creative, polished code and UI direction that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Build bold, production-grade frontend UI with a clear aesthetic point of view. Prefer real, runnable code over mockups.

## When To Apply

Apply this skill when the user asks to:
- Build or style a web UI (component, page, app, dashboard, landing page, poster-like layout)
- Improve visual quality, polish, or brand distinctiveness
- Create a memorable interface instead of a generic template

## Core Standard

Always deliver:
1. Working code that can run in the target stack
2. A deliberate visual concept (not default patterns)
3. High-detail polish (spacing, states, hierarchy, rhythm)
4. Accessible, performant baseline behavior

## Design Thinking Before Coding

Capture these four decisions first, then implement:

1. **Purpose**
   - What problem does the interface solve?
   - Who is the primary user?

2. **Tone**
   - Commit to a strong direction (examples: brutally minimal, retro-futuristic, editorial, art deco, playful, industrial, organic, luxury, brutalist)
   - Intentional minimalism is valid; intentional maximalism is valid

3. **Constraints**
   - Framework/runtime (React, Vue, plain HTML/CSS/JS, etc.)
   - Device targets, accessibility level, performance budgets

4. **Differentiation**
   - Define one memorable signature element
   - Ensure this element appears in composition, motion, or visual language

## Aesthetic Rules

### Typography
- Avoid generic defaults and overused combinations
- Choose characterful display + readable body pairing
- Use scale, contrast, and rhythm intentionally

### Color System
- Commit to a clear palette with dominant tones and confident accents
- Store tokens in CSS variables/design tokens
- Avoid timid, evenly distributed color usage

### Motion
- Use motion to support hierarchy and delight
- Prefer one orchestrated, high-impact sequence over scattered random effects
- Use stagger, reveal timing, and meaningful hover/focus transitions
- For React, use Motion library when available; otherwise use CSS/WAAPI cleanly

### Composition
- Favor distinctive structure: asymmetry, overlap, broken-grid moments, controlled negative space
- Keep readability and interaction clarity intact

### Atmosphere and Detail
- Build depth with texture, lighting, pattern, shadow, translucency, grain, or decorative framing
- Match details to concept; do not add effects without purpose

## Hard Anti-Patterns

Do not produce:
- Cookie-cutter layouts and predictable hero/cards/footer boilerplate
- Generic AI look-and-feel with familiar gradient tropes and repetitive composition
- Reused default font stacks with no typographic intent
- Effects-heavy UI without a coherent concept

## Implementation Workflow

Use this checklist during execution:

```markdown
Progress:
- [ ] Confirm purpose, audience, constraints
- [ ] Choose and state bold aesthetic direction
- [ ] Define palette, type system, spacing, motion rules
- [ ] Implement production-ready UI code
- [ ] Add interaction states (hover/focus/active/loading where relevant)
- [ ] Validate responsiveness and accessibility
- [ ] Refine for signature memorable detail
```

## Code Quality Requirements

- Ensure semantic structure and keyboard accessibility
- Preserve sufficient contrast and visible focus styles
- Keep animations performant (transform/opacity first)
- Avoid unnecessary dependencies
- Match implementation complexity to design intent:
  - Maximalist concept -> richer structure, motion, layering
  - Minimal/refined concept -> restraint, precision, micro-detail

## Response Format

When generating output for the user:

1. **Concept Direction** (2-4 bullets)
2. **Design System Choices** (type, palette, spacing, motion)
3. **Production Code** (complete runnable code in requested stack)
4. **Polish Notes** (what makes it memorable, how to iterate)

## Quick Prompting Hints

If the user gives vague input, infer a strong direction and proceed. Ask only when constraints are blocking (for example required framework, strict brand colors, or mandatory component library).

Default to shipping excellent working UI, not discussing generic options.
