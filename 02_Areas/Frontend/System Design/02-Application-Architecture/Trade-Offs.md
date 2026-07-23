# Application Architecture — Trade-Offs

> 💡 **Core Idea:** Every architecture choice creates a trade-off. Senior engineers don’t avoid trade-offs — they make them explicit.

---

## 1. Simplicity vs Structure

**The tension:**

- Simple architecture is easier to start with.
- Structured architecture is easier to scale.

**When to lean simple:**

- small team
- short-lived product
- low feature churn

**When to lean structured:**

- multiple teams
- long-lived product
- frequent change

**Senior move:** start simple, add structure only when friction appears.

---

## 2. Reuse vs Coupling

**The tension:**

- Sharing code reduces duplication.
- Sharing code also creates dependencies.

**Best practice:**

- share primitives like buttons, inputs, formatters, and base utilities
- keep feature workflows inside their feature boundary

> **Rule:** If the shared abstraction is not obviously stable, it is probably too early to share.

---

## 3. Global State vs Local State

**The tension:**

- Global state is convenient.
- Global state is also a magnet for accidental complexity.

**Use global state for:**

- auth session
- theme
- feature flags
- app-wide user context

**Keep local when possible for:**

- form inputs
- modal visibility
- temporary UI selections
- screen-specific state

---

## 4. Modular Monolith vs Micro-Frontends

**The tension:**

- Modular monoliths keep things simpler.
- Micro-frontends offer team autonomy.

**Modular monolith wins when:**

- one deployment pipeline is fine
- the team wants fast coordination
- the product is still evolving

**Micro-frontends win when:**

- independent deployability matters
- teams are large and separated
- organizational boundaries are strong

> **Warning:** micro-frontends often add more complexity than they remove.

---

## 5. Abstraction vs Speed

**The tension:**

- abstractions can make code elegant
- abstractions can also slow delivery

**Use abstraction when:**

- the pattern is repeated
- the shape is stable
- the business cost of inconsistency is high

**Avoid abstraction when:**

- the feature is still changing rapidly
- the duplication is small
- the “reusable” shape is still unclear

---

## 6. Boundaries vs Convenience

**The tension:**

- strict boundaries help maintainability
- convenience often pushes people to bypass them

**Practical guideline:**

The harder it is to accidentally misuse a module, the better the architecture.

---

## 7. Performance vs Maintainability

**The tension:**

- highly optimized structures can be harder to maintain
- clean structures can sometimes leave performance on the table

**Good default:**

Prefer maintainability until performance actually becomes a user problem.

---

## 8. Final Trade-Off Summary

| Trade-Off | Favor This When |
|:----------|:----------------|
| Simplicity vs Structure | Favor simplicity early |
| Reuse vs Coupling | Favor reuse only for stable primitives |
| Global vs Local State | Favor local unless shared access is required |
| Modular Monolith vs Micro-Frontends | Favor modular monolith first |
| Abstraction vs Speed | Favor speed until repetition proves abstraction |
| Performance vs Maintainability | Favor maintainability until performance is a real issue |
