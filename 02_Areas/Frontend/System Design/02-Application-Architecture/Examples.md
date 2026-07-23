# Application Architecture — Deep Examples

> 💡 **Core Idea:** These examples show how app category affects app structure. The goal is not just to organize files — it is to shape the app so it matches the product and the team.

## Table of Contents

- [How to Read These Examples](#how-to-read-these-examples)
- [1. Social Media Platform](#1-social-media-platform)
- [2. E-Commerce Storefront](#2-e-commerce-storefront)
- [3. Streaming / Media Product](#3-streaming--media-product)
- [4. Productivity / Collaboration Tool](#4-productivity--collaboration-tool)
- [5. Marketplace / Admin Console](#5-marketplace--admin-console)
- [Quick Comparison Notes](#quick-comparison-notes)

---

## How to Read These Examples

For each category, focus on these questions:

1. What is the core user flow?
2. What kind of state is changing?
3. What should stay local and what should be shared?
4. What is the main scaling risk?
5. Which part of the app deserves the strongest boundary?

> **Simple rule:** product shape first, architecture second.

---

## 1. Social Media Platform

### The Vague Prompt

**Interviewer/Manager:** “Design the frontend architecture for a social app.”

### Clarifying Phase

**You:**

- Is the main experience a feed, stories, messaging, or all of them?
- Is it mobile-first?
- Do we need real-time updates?
- Are images, videos, or text the main content type?
- Is offline mode needed?

**Example answers:**

- Feed is the main flow
- Mobile-first
- No real-time for MVP
- Text and images only

### Architecture Mapping

- Feed-heavy UI → list virtualization and pagination
- Content cards → reusable post modules
- Likes and comments → local interaction state + server sync
- Media loading → lazy loading and placeholders

### Recommended Structure

```txt
src/
  app/
  features/
    feed/
    post-actions/
    comments/
    profile/
  shared/
    ui/
    lib/
    api/
```

### Why This Works

- Feed stays isolated from profile logic
- Shared UI stays small and stable
- Interaction code does not leak into every component

### Common Mistake

Putting feed fetching, post rendering, and like handling in one large screen component.

### Edge Cases

- Variable-height posts
- Deleted posts while scrolling
- Network loss during refresh
- Image failures inside cards

---

## 2. E-Commerce Storefront

### The Vague Prompt

**Interviewer/Manager:** “Design the frontend architecture for an online store.”

### Clarifying Phase

**You:**

- Are we designing browsing, cart, checkout, or all three?
- Is guest checkout supported?
- Do prices and inventory change often?
- Do we need multi-currency support?
- Is the cart persistent across sessions?

**Example answers:**

- Browsing, cart, and checkout are all required
- Guest checkout is needed
- Multi-currency is required
- Cart must persist

### Architecture Mapping

- Product browsing → search, filtering, and catalog modules
- Cart → dedicated domain state
- Checkout → step-based flow
- Pricing → server-validated data
- Localization → locale-aware formatting layer

### Recommended Structure

```txt
src/
  features/
    catalog/
    product-details/
    cart/
    checkout/
    orders/
  shared/
    ui/
    lib/
    api/
```

### Why This Works

- Each shopping stage has its own logic
- Cart and checkout remain stable even when catalog changes
- Payment and pricing rules stay isolated

### Common Mistake

Letting product cards directly own cart and checkout logic.

### Edge Cases

- Item goes out of stock during checkout
- Coupon expires mid-flow
- Refresh during payment
- Currency changes between browse and pay

---

## 3. Streaming / Media Product

### The Vague Prompt

**Interviewer/Manager:** “Design a media app like Netflix or YouTube.”

### Clarifying Phase

**You:**

- Is this video, audio, or both?
- Is playback the main flow or just one part?
- Do we support offline downloads?
- Is adaptive bitrate playback needed?
- Are recommendations important?

**Example answers:**

- Video is the main flow
- Playback and browse matter most
- Offline download is a should-have
- Adaptive quality is important

### Architecture Mapping

- Browse page → content discovery module
- Playback → dedicated player module
- History → persistent state layer
- Downloads → offline storage and queue layer
- Recommendations → separate data-fetching flow

### Recommended Structure

```txt
src/
  features/
    browse/
    player/
    history/
    downloads/
    recommendations/
  shared/
    ui/
    media/
    api/
```

### Why This Works

- Player logic stays isolated
- Large media concerns do not pollute browse screens
- Offline and resume logic has a clear home

### Common Mistake

Mixing playback controls, recommendation loading, and download state in one component tree.

### Edge Cases

- Buffering or playback failure
- Quality drops on slow network
- Resume from last timestamp
- Device switch while watching

---

## 4. Productivity / Collaboration Tool

### The Vague Prompt

**Interviewer/Manager:** “Design a collaborative app like Notion or Trello.”

### Clarifying Phase

**You:**

- Is this document, board, or task focused?
- Do we need real-time collaboration?
- Is offline editing needed?
- How complex are permissions?
- Do we need comments, mentions, or activity logs?

**Example answers:**

- Real-time collaboration is required
- Offline editing is useful
- Permissions vary by workspace

### Architecture Mapping

- Editor or board → domain-owned workspace module
- Collaboration → sync layer
- Offline edits → local queue and reconciliation
- Permissions → policy module
- Comments and mentions → separate feature modules

### Recommended Structure

```txt
src/
  domains/
    documents/
    boards/
    permissions/
    collaboration/
  shared/
    ui/
    lib/
    sync/
```

### Why This Works

- Sync stays out of the UI layer
- Domain logic stays testable
- Permissions remain centralized

### Common Mistake

Letting the editor component directly manage network sync, conflict resolution, and permissions.

### Edge Cases

- Two users edit the same content
- Offline edits need later merge
- Permission changes mid-session
- Out-of-order updates arrive

---

## 5. Marketplace / Admin Console

### The Vague Prompt

**Interviewer/Manager:** “Design an admin portal or marketplace console.”

### Clarifying Phase

**You:**

- Who uses it: support, operations, finance, or all of them?
- Are the main screens tables and filters?
- Are actions mostly safe or high-risk?
- Do we need audit logs?
- Do permissions vary by role?

**Example answers:**

- Multiple internal teams use it
- Tables and filters are the main UI
- Some actions are high-risk
- Audit logging is mandatory

### Architecture Mapping

- Table views → reusable query and list state
- High-risk actions → isolated workflow modules
- Audit logs → central tracking module
- Permissions → shared policy layer
- Multiple teams → stronger feature boundaries

### Recommended Structure

```txt
src/
  features/
    users/
    orders/
    payouts/
    moderation/
    audit-log/
  shared/
    ui/
    lib/
    api/
```

### Why This Works

- Operations flows stay explicit
- Sensitive actions are easy to review
- Audit and permission logic are not scattered

### Common Mistake

Turning admin actions into a generic “action framework” too early.

### Edge Cases

- Action succeeds only partially
- Permission changes while open
- Large tables need pagination and filtering
- Undo support for dangerous actions

---

## Quick Comparison Notes

| Category | Main Flow | Main Architecture Driver |
|:---------|:----------|:-------------------------|
| Social media | Scroll and engage | Feed performance and interactions |
| E-commerce | Browse to buy | State safety and checkout reliability |
| Streaming | Browse and play | Playback stability and media handling |
| Productivity | Edit and collaborate | Sync and conflict resolution |
| Marketplace/Admin | Search and act | Permissions and safe workflows |

> **Fast memory trick:** feeds need speed, stores need safety, media needs stability, collaboration needs sync, and admin tools need control.
