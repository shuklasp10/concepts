# Application Architecture — Deep Examples

> 💡 **Core Idea:** These examples show how to move from product context to app structure. The goal is not just to “organize files” — it is to make the app easier to evolve.

## Table of Contents

- [Example 1: Design a SaaS Dashboard](#example-1-design-a-saas-dashboard)
- [Example 2: Design a Multi-Step Checkout App](#example-2-design-a-multi-step-checkout-app)
- [Example 3: Design a Collaboration Workspace](#example-3-design-a-collaboration-workspace)
- [Example 4: Design an Admin Portal for a Marketplace](#example-4-design-an-admin-portal-for-a-marketplace)
- [Quick-Fire Scenarios](#quick-fire-scenarios)

---

## Example 1: Design a SaaS Dashboard

### The Vague Prompt

**Interviewer/Manager:** “Design the frontend architecture for our SaaS dashboard.”

### Clarifying Phase

**You:** “Before I suggest folder structure or state tools, I’d like to understand the product shape.”

- Is this a single product area or many independent modules?
- Which screens change most often?
- Do we have different user roles?
- Is there a design system already?
- Are we expecting multiple teams to work in parallel?

**Them:**

- Multiple modules: analytics, billing, account settings, team management
- Several roles: owner, admin, member
- Design system exists
- Two teams will work in parallel

### Extracted Spec Sheet

**Functional Requirements**

| Priority | Requirement |
|:---------|:------------|
| Must Have | Separate modules for analytics, billing, settings, and teams |
| Must Have | Role-based access control in the UI |
| Must Have | Shared design system components |
| Should Have | Feature flags for staged rollout |
| Could Have | Per-module lazy loading |

**Non-Functional Requirements**

| Constraint | Target | Reason |
|:-----------|:-------|:-------|
| Maintainability | Easy to scale across 2+ teams | Parallel work without collisions |
| Performance | Fast initial load | Dashboard should not feel heavy |
| Testability | Unit tests for business logic | Reduce regressions in workflows |

### Architecture Mapping

- **Multiple modules** → feature-based architecture
- **Role-based UI** → shared auth/permission layer with feature guards
- **Parallel teams** → strict boundaries and public entry points
- **Design system** → shared UI layer for primitives only

### Recommended Structure

```txt
src/
  app/
  features/
    analytics/
    billing/
    settings/
    teams/
  shared/
    ui/
    lib/
    api/
  entities/
```

### Trade-Offs

| Trade-Off | Decision |
|:----------|:---------|
| Shared UI vs feature-specific UI | Share only primitives, keep workflows local |
| Global state vs local ownership | Local by default, global only for auth and theme |
| Monolithic routing vs module routing | Route by feature to preserve boundaries |

### Edge Cases

- What happens when a role loses access mid-session?
- How do we avoid importing billing internals into analytics?
- How do we prevent shared components from becoming feature-specific?

---

## Example 2: Design a Multi-Step Checkout App

### The Vague Prompt

**Interviewer/Manager:** “How would you structure the frontend for checkout?”

### Clarifying Phase

**You:**

- Is checkout a wizard or a single page?
- Do we need guest checkout?
- Does shipping estimation update live?
- Is cart state shared across pages?
- Do we need draft persistence on refresh?

**Them:**

- Wizard flow
- Guest checkout allowed
- Cart must survive refresh
- Pricing and shipping should update dynamically

### Architecture Mapping

- **Wizard flow** → step-oriented module with local workflow state
- **Draft persistence** → state layer with storage adapter
- **Shared cart** → dedicated cart domain module
- **Dynamic pricing** → domain logic isolated from components

### Recommended Structure

```txt
checkout/
  steps/
  state/
  domain/
  api/
  ui/
```

### Why This Works

- The checkout workflow is isolated.
- The pricing rules can evolve without rewriting UI.
- The cart can be reused by mini-cart and order review screens.

### Common Mistake

Putting all checkout logic directly inside screen components.

That works for one step and fails for five.

---

## Example 3: Design a Collaboration Workspace

### The Vague Prompt

**Interviewer/Manager:** “Design the app architecture for a Notion-like workspace.”

### Clarifying Phase

**You:**

- Is real-time editing required?
- Are documents deeply nested?
- How many entity types exist: docs, comments, mentions, tasks?
- Is offline editing needed?
- Do different workspaces have different permissions?

**Them:**

- Real-time collaboration required
- Offline support is important
- Many entity types
- Workspace-level permissions

### Architecture Mapping

- **Many entity types** → domain-driven structure
- **Real-time collaboration** → separate sync layer
- **Offline support** → persistence and queue layer
- **Permissions** → shared policy module

### Recommended Structure

```txt
src/
  domains/
    documents/
    comments/
    permissions/
    presence/
  sync/
  storage/
  shared/
```

### Key Decision

Do not let the editor UI own sync logic.

The editor should render state; the sync layer should negotiate state.

---

## Example 4: Design an Admin Portal for a Marketplace

### The Vague Prompt

**Interviewer/Manager:** “We need an internal admin portal.”

### Clarifying Phase

**You:**

- Is the portal used by support, operations, or finance?
- Are most actions read-only or write-heavy?
- Do we need audit logs?
- Which workflows are critical?

**Them:**

- Used by support and operations
- Many read-heavy views
- Audit logs are important
- A few high-risk actions like refunds and bans

### Architecture Mapping

- **Read-heavy UI** → table/list-first structure
- **High-risk actions** → isolated domain workflows with confirmations
- **Audit logs** → shared observability and action tracking layer

### Important Pattern

High-risk workflows should not be casually reusable.

Refunds, bans, approvals, and manual overrides deserve explicit modules.

---

## Quick-Fire Scenarios

1. **You have a small app and one engineer.**
   - Keep the structure simple.

2. **You have three teams shipping in parallel.**
   - Add stronger feature boundaries.

3. **A workflow has business rules that change often.**
   - Extract domain logic out of components.

4. **A feature needs offline persistence and sync.**
   - Add a storage and synchronization layer.

5. **You are tempted to use micro-frontends “for future scale.”**
   - First ask whether the org structure truly requires it.
