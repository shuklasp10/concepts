# Application Architecture in Frontend System Design

## Overview
After requirement analysis tells you **what** to build, application architecture decides **how the app should be shaped** so the codebase stays maintainable as features grow.

Application architecture is the crucial second step in the system design process. It is the act of turning a product shape into boundaries, layers, and ownership rules.

If you get this wrong, the app may work today but become hard to change tomorrow.

## Table of Contents

### 📖 [Concepts — Complete Engineering Guide](Concepts.md)
The single source of truth for this topic. Covers architecture styles, layer models, module boundaries, decision factors, trade-offs, anti-patterns, and a quick-recall cheat sheet — all in one structured, revision-friendly document.

### 🛠️ [Examples — Deep Full-Journey Walkthroughs](Examples.md)
5 detailed category-based examples showing how product shape affects frontend architecture. Each example demonstrates boundaries, state ownership, shared primitives, trade-offs, and edge cases.

### 🎙️ [Interview Strategy — The Performance Guide](Interview-Strategy.md)
How to answer architecture questions clearly under pressure. Covers the first 5 minutes playbook, communication techniques, presentation framework, quick recall, interviewer traps, and practice prompts.

## What This Topic Covers

- How to structure a frontend application by domain, feature, or layer
- How to choose between monoliths, modular monoliths, and micro-frontends
- How to separate UI, state, business logic, and data access
- How to keep large frontend codebases testable and maintainable
- How architecture decisions affect team velocity, performance, and reliability

## Why It Matters

If requirement analysis tells you *what* to build, application architecture decides *how the app should be shaped* so the codebase doesn’t collapse under its own weight.

This is the difference between:

- a quick prototype that ships,
- and a frontend that can survive 12 engineers, 40 features, and 3 years of change.

## What a Senior Engineer Looks For

- Clear module boundaries
- Low coupling, high cohesion
- Stable public APIs between app layers
- Reusable patterns without over-engineering
- Easy testing and predictable data flow

## Quick Mental Model

Think in layers:

1. **Presentation layer** — components, screens, visual states
2. **State layer** — local state, server state, shared client state
3. **Domain layer** — business rules and feature logic
4. **Data layer** — API clients, caching, persistence
5. **Infrastructure layer** — logging, analytics, auth, feature flags

> **Rule of thumb:** If a feature becomes hard to change, your boundaries are probably in the wrong place.

## Useful References

- Feature-sliced architecture examples
- Modular monolith discussions
- React and state organization guides
- Real-world design system structure examples

## What to Practice

- Refactor a small app into feature folders
- Identify accidental coupling in a medium-sized codebase
- Separate UI rendering from business rules
- Write tests for logic that was previously embedded in components



