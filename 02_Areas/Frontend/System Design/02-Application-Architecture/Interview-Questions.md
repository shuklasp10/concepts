# Application Architecture — Interview Questions

> 💡 **Core Idea:** These questions are meant to train architectural judgment, not memorize buzzwords. A strong answer explains boundaries, trade-offs, and why a choice fits the context.

---

## Core Questions

### 1. What is application architecture in frontend engineering?

**What to say:**
Application architecture is how we organize UI, state, business logic, and data access so the app remains maintainable as it grows.

### 2. When should you use a feature-based architecture?

**What to say:**
Use it when the app has multiple product areas or workflows that should be owned independently and changed without affecting unrelated code.

### 3. What is the difference between UI state and domain state?

**What to say:**
UI state is temporary and screen-specific. Domain state represents business meaning and workflow data that matters beyond a single component.

### 4. What makes a module boundary good?

**What to say:**
A good boundary hides implementation details, exposes a clear public API, reduces accidental imports, and allows the module to change without breaking others.

### 5. When do micro-frontends make sense?

**What to say:**
Mostly when multiple teams need independent deployment and ownership boundaries, and the organizational cost of a single frontend is too high.

---

## Deeper Questions

### 6. How would you prevent a shared folder from becoming a dumping ground?

**What to say:**
Only place stable primitives there. If logic belongs to one business area, keep it inside that feature. Shared code should be intentionally generic.

### 7. Where should business logic live in a frontend app?

**What to say:**
In a domain or feature layer, not inside components. Components should render and delegate; logic should stay testable and reusable.

### 8. How do you choose between local state and global state?

**What to say:**
Use local state when only one screen or feature needs it. Use global state only when multiple parts of the app truly need shared, synchronized data.

### 9. How would you structure a large dashboard application?

**What to say:**
I’d use a modular or feature-based architecture, with shared primitives, feature-owned workflows, and clear separation between UI, domain, and data layers.

### 10. How do architecture decisions affect testability?

**What to say:**
Clear boundaries make logic easier to test in isolation. If business rules are buried in components, tests become brittle and expensive.

---

## Scenario-Based Questions

### 11. A team keeps importing internals from another feature. What do you do?

**What to say:**
Introduce public entry points, hide internals, and enforce dependency direction. If needed, extract truly shared primitives into a common layer.

### 12. A feature’s logic is duplicated in three screens. What do you do?

**What to say:**
Extract the shared business logic into a domain module or feature service, but only if the abstraction is stable enough to justify sharing.

### 13. The app is small today, but the team expects rapid growth. How do you plan architecture?

**What to say:**
Start simple, but choose a structure that can evolve into stronger boundaries. Don’t overbuild, but avoid patterns that make future separation impossible.

### 14. A workflow has high-risk actions like refunds or deletion. How would you design it?

**What to say:**
Keep the workflow isolated, make confirmations explicit, and keep auditing, permissions, and failure handling separate from visual presentation.

---

## Quick Evaluation Prompts

- When is layering enough?
- When do features deserve their own folders?
- What belongs in shared code?
- Which logic should never live in a component?
- When does global state become a liability?
