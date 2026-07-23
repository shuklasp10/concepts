 # Requirement Analysis — Deep Examples

> 💡 **Core Idea:** These examples show how to move from a broad product idea to a clear frontend plan. The goal is simple: understand the app category, define the core flow, and spot the real architecture drivers early.

## Table of Contents

- [How to Use These Examples](#how-to-use-these-examples)
- [1. Social Media App](#1-social-media-app)
- [2. E-Commerce App](#2-e-commerce-app)
- [3. Streaming / Media App](#3-streaming--media-app)
- [4. Productivity / Collaboration App](#4-productivity--collaboration-app)
- [5. Marketplace / Admin Platform](#5-marketplace--admin-platform)
- [Quick Learning Patterns](#quick-learning-patterns)

---

## How to Use These Examples

For every category, we look at the same learning steps:

1. **The vague prompt** — what the interviewer says
2. **Clarifying questions** — what you should ask
3. **Extracted requirements** — what actually matters
4. **Core flow** — the main user journey
5. **Architecture hints** — what the requirements push you toward
6. **Trade-offs** — what you gain and what you lose
7. **Edge cases** — what most people forget

> **Simple rule:** first understand the app type, then the user goal, then the constraints.

---

## 1. Social Media App

### 1.1 The Vague Prompt

**Interviewer/Manager:** “Design a social media feed like Instagram or X.”

### 1.2 Clarifying Questions

**You:**

- Is the focus on a feed, stories, comments, or messaging?
- Is content mostly text, images, or video?
- Do we need real-time updates or is refresh okay?
- Are we optimizing for mobile, desktop, or both?
- Do we need offline mode or poor-network support?
- Do we need accessibility basics like keyboard navigation and screen readers?

**Example answers:**

- Main flow is scrolling a personalized feed
- Mostly images and short text
- Pull-to-refresh is fine; no real-time for MVP
- Mobile-first
- Strong performance on slow networks

### 1.3 Extracted Spec Sheet

**Functional Requirements**

| Priority | Requirement |
|:---------|:------------|
| Must Have | Feed of posts with infinite scroll |
| Must Have | Like, comment, and share actions |
| Must Have | Image upload and display |
| Should Have | Pull-to-refresh |
| Should Have | Post bookmarking |
| Could Have | Stories or short-form content |
| Won’t Have | Live video, DMs, creator monetization |

**Non-Functional Requirements**

| Constraint | Target | Why it matters |
|:-----------|:-------|:---------------|
| Performance | Fast initial load on mobile | Users scroll immediately |
| Scale | Thousands of posts per session | Feed can grow very large |
| Network | Works well on slow connections | Global audience |
| Accessibility | Semantic HTML, alt text, keyboard support | Basic usability |

### 1.4 Core Flow

**Open app → load feed → scroll → react to post → open comments → share or save**

That flow tells you the app is mostly about:

- list rendering
- cached data
- interaction state
- viewport tracking
- content loading

### 1.5 Architecture Hints

- Infinite scroll → pagination + virtualization
- Images → lazy loading + placeholders
- Large feed → server pagination with cursor-based data
- Impression tracking → viewport observer pattern
- Offline tolerance → cache-first or stale-while-revalidate

### 1.6 Trade-Offs

| Trade-Off | Simple Decision |
|:----------|:----------------|
| Freshness vs performance | Show cached feed fast, refresh in background |
| Rich media vs speed | Compress images and load them lazily |
| Infinite scroll vs memory | Virtualize the list |

### 1.7 Edge Cases

- What happens when a post image fails to load?
- What if the user scrolls while a refresh is happening?
- What if a post is deleted while it is still visible?
- What if the feed contains mixed media sizes?

---

## 2. E-Commerce App

### 2.1 The Vague Prompt

**Interviewer/Manager:** “Design an e-commerce shopping experience.”

### 2.2 Clarifying Questions

**You:**

- Is this browsing, cart, checkout, or all of them?
- Do we support guest checkout?
- Do prices change often?
- Do we need coupons, shipping estimates, or taxes?
- Is inventory real-time?
- Are we supporting one country or many?

**Example answers:**

- Browsing, cart, and checkout are all in scope
- Guest checkout is required
- Global customers, multiple currencies
- Inventory and pricing can change

### 2.3 Extracted Spec Sheet

**Functional Requirements**

| Priority | Requirement |
|:---------|:------------|
| Must Have | Product listing and product detail pages |
| Must Have | Add to cart and cart editing |
| Must Have | Multi-step checkout |
| Must Have | Guest checkout |
| Should Have | Coupon support |
| Should Have | Shipping and tax estimation |
| Could Have | Saved addresses and wishlists |
| Won’t Have | Subscriptions, BNPL, auction flow |

**Non-Functional Requirements**

| Constraint | Target | Why it matters |
|:-----------|:-------|:---------------|
| Security | PCI-safe payment handling | Never expose card data |
| Reliability | No data loss during checkout | Abandonment is expensive |
| Performance | No layout shift during payment | Trust and conversion |
| Localization | Currency and address support | Global users |

### 2.4 Core Flow

**Browse product → inspect details → add to cart → review cart → enter shipping → pay → confirm order**

That flow tells you the app needs:

- durable form state
- cart persistence
- validation
- price refresh before payment
- error recovery

### 2.5 Architecture Hints

- Cart → dedicated state store or domain module
- Checkout → step-based workflow
- Pricing → server-validated final calculation
- Payment → secure third-party integration
- Localization → locale-aware formatting

### 2.6 Trade-Offs

| Trade-Off | Simple Decision |
|:----------|:----------------|
| Speed vs accuracy | Re-check final price before payment |
| Fancy UI vs accessibility | Prefer simple, safe form controls |
| Local state vs persistence | Persist cart and form draft data |

### 2.7 Edge Cases

- What if an item goes out of stock in checkout?
- What if the user refreshes mid-order?
- What if a coupon expires while the cart is open?
- What if payment fails after all steps are complete?

---

## 3. Streaming / Media App

### 3.1 The Vague Prompt

**Interviewer/Manager:** “Design a streaming app like YouTube, Netflix, or a music player.”

### 3.2 Clarifying Questions

**You:**

- Is this video, audio, or both?
- Is the main goal browsing, playback, or recommendations?
- Do we need offline downloads?
- Is live streaming part of the scope?
- Do users upload content, or only consume it?
- How important is adaptive quality on slow networks?

**Example answers:**

- Video playback is the main flow
- Browsing and recommendations matter too
- Offline downloads are a should-have
- No live streaming for MVP

### 3.3 Extracted Spec Sheet

**Functional Requirements**

| Priority | Requirement |
|:---------|:------------|
| Must Have | Browse content catalog |
| Must Have | Play media with controls |
| Must Have | Resume playback from last position |
| Should Have | Recommendations and related content |
| Should Have | Watch history |
| Could Have | Offline downloads |
| Won’t Have | Live broadcasting, creator studio, comments |

**Non-Functional Requirements**

| Constraint | Target | Why it matters |
|:-----------|:-------|:---------------|
| Performance | Fast start of playback | Users quit if video buffers too long |
| Network | Adaptive quality support | Users may be on weak connections |
| Reliability | Playback should survive interruptions | Smooth experience matters |
| Storage | Large media caching support | Offline or resume use cases |

### 3.4 Core Flow

**Open app → browse title → start playback → pause/resume → continue later**

This flow pushes you toward:

- persistent playback state
- prefetching metadata
- adaptive loading
- cache management
- strong error handling

### 3.5 Architecture Hints

- Playback state → local plus server sync
- Media assets → CDN and adaptive bitrate logic
- History → persistent storage
- Recommendations → separate data fetching layer
- Downloads → offline storage with queueing

### 3.6 Trade-Offs

| Trade-Off | Simple Decision |
|:----------|:----------------|
| Quality vs speed | Adapt quality based on network |
| Rich UI vs reliability | Keep playback controls stable and simple |
| Offline vs storage | Download only when the user asks |

### 3.7 Edge Cases

- What if the network drops during playback?
- What if the user switches devices?
- What if one media item has missing metadata?
- What if the user scrubs while the player is buffering?

---

## 4. Productivity / Collaboration App

### 4.1 The Vague Prompt

**Interviewer/Manager:** “Design a productivity app like Notion, Trello, or Google Docs.”

### 4.2 Clarifying Questions

**You:**

- Is this document editing, task management, or both?
- Do we need real-time collaboration?
- Do we need offline support?
- Are there multiple user roles or permissions?
- How deep is the data structure?
- Do we need comments, mentions, or notifications?

**Example answers:**

- Real-time collaboration is required
- Offline support is important
- Permissions vary by workspace

### 4.3 Extracted Spec Sheet

**Functional Requirements**

| Priority | Requirement |
|:---------|:------------|
| Must Have | Create, edit, and organize content |
| Must Have | Permissions and sharing |
| Must Have | Real-time collaboration |
| Should Have | Comments and mentions |
| Should Have | Activity history |
| Could Have | Offline editing |
| Won’t Have | Advanced publishing workflows |

**Non-Functional Requirements**

| Constraint | Target | Why it matters |
|:-----------|:-------|:---------------|
| Consistency | Edits should not conflict badly | Many users may edit at once |
| Reliability | Work should not be lost | Collaboration trust depends on it |
| Performance | Editing should feel instant | Input lag breaks flow |
| Scalability | Large docs or boards should still work | Real apps grow big |

### 4.4 Core Flow

**Open workspace → edit content → share with others → see live updates → resolve conflicts**

This flow tells you the app is about:

- sync
- conflict handling
- document state
- permission checks
- offline persistence

### 4.5 Architecture Hints

- Real-time updates → sync layer or websocket layer
- Offline support → local storage + queue
- Permissions → shared policy module
- Complex content → domain-oriented structure
- Collaboration → separation between editor UI and sync logic

### 4.6 Trade-Offs

| Trade-Off | Simple Decision |
|:----------|:----------------|
| Consistency vs responsiveness | Apply local edits quickly, sync in background |
| Simplicity vs collaboration | Keep sync logic out of components |
| Offline vs conflict risk | Queue changes and reconcile later |

### 4.7 Edge Cases

- What if two users edit the same block at once?
- What if the user goes offline mid-edit?
- What if permissions change while the page is open?
- What if an update arrives out of order?

---

## 5. Marketplace / Admin Platform

### 5.1 The Vague Prompt

**Interviewer/Manager:** “Design a marketplace admin or operations app.”

### 5.2 Clarifying Questions

**You:**

- Is this read-heavy or write-heavy?
- Are there risky actions like refunds, approvals, or bans?
- Do different teams use the same app?
- Do we need audit logs?
- Are tables, filters, and workflows the main UI?

**Example answers:**

- Mostly read-heavy
- Some high-risk actions exist
- Support, ops, and finance all use it
- Audit logging is important

### 5.3 Extracted Spec Sheet

**Functional Requirements**

| Priority | Requirement |
|:---------|:------------|
| Must Have | Search, filter, and table views |
| Must Have | Detail pages for users/orders/items |
| Must Have | High-risk admin actions with confirmation |
| Should Have | Audit logs |
| Should Have | Role-based access |
| Could Have | Bulk actions |
| Won’t Have | Consumer-style social features |

**Non-Functional Requirements**

| Constraint | Target | Why it matters |
|:-----------|:-------|:---------------|
| Safety | Avoid wrong admin actions | Mistakes are expensive |
| Traceability | Track who did what | Audit and compliance |
| Usability | Fast navigation in tables | Operators need speed |
| Permissioning | Strong access rules | Different teams need different access |

### 5.4 Core Flow

**Open dashboard → search record → inspect details → take action → confirm → log result**

### 5.5 Architecture Hints

- Tables and filters → reusable query state pattern
- High-risk actions → isolated workflows with confirmation
- Audit logs → central tracking layer
- Permissions → shared auth and policy model
- Multiple teams → strong feature boundaries

### 5.6 Trade-Offs

| Trade-Off | Simple Decision |
|:----------|:----------------|
| Speed vs safety | Add confirmations for destructive actions |
| Reuse vs clarity | Keep workflows explicit, not over-generic |
| Flexibility vs control | Tight permission rules win |

### 5.7 Edge Cases

- What if an admin action partially fails?
- What if a user loses permission mid-session?
- What if the table has 100k rows?
- What if the action must be undone?

---

## Quick Learning Patterns

Use these patterns across all categories:

- **If the app is feed-heavy:** think scroll, cache, virtualization
- **If the app is checkout-heavy:** think forms, persistence, validation, safety
- **If the app is media-heavy:** think playback, buffering, offline, performance
- **If the app is collaboration-heavy:** think sync, conflict handling, permissions
- **If the app is admin-heavy:** think tables, filters, audit logs, safe actions

> **Quick memory trick:** app category first, core flow second, architecture third.

    *   *Them:* "Out of scope for MVP."
*   **You:** "Search through message history?"
    *   *Them:* "Should Have. Not blocking for launch."

### 3.3 Extracted Spec Sheet

**✅ Functional Requirements:**

| Priority | Requirement |
|:---------|:------------|
| **Must Have** | 1-on-1 and group messaging (text + images) |
| **Must Have** | Read receipts (sent → delivered → read) |
| **Must Have** | Offline message queuing with auto-send on reconnect |
| **Must Have** | Conversation list with unread counts |
| **Should Have** | Message search across history |
| **Should Have** | File sharing (PDF, documents) |
| **Could Have** | Typing indicators, online/offline presence |
| **Won't Have** | End-to-end encryption, voice/video calls, Stories |

**🧱 Non-Functional Requirements:**

| Constraint | Target | Reason |
|:-----------|:-------|:-------|
| Latency | Message delivery < 300ms (online) | Chat must feel instant |
| Offline | Full read + queued write capability | Flaky mobile networks |
| Scale | 256-member group chats without lag | Fan-out performance |
| Sync | Consistent message ordering | Distributed system constraint |

### 3.4 Concepts in Action

- **Real-time messaging** → WebSockets with a reconnection strategy. Connection drops are *expected*, not exceptional. Implement exponential backoff with jitter (1s → 2s → 4s → 8s + random jitter) to prevent thundering herd when the server restarts.
- **Offline queuing** → Service Worker + IndexedDB message store + Background Sync API. Messages typed offline get stored in IndexedDB with a `status: "queued"` field. When the network returns, Background Sync fires and flushes the queue in order.
- **Read receipts** → Per-message state machine: `sending → sent → delivered → read`. Each state transition is a separate WebSocket event. The UI renders different check-mark icons per state. State is stored locally in IndexedDB and synced.
- **Group chats** → Fan-out awareness. When user sends a message to a 256-member group, the *server* handles fan-out. The client only sends one message. But the client must handle receiving messages from 256 people in rapid succession — batch UI updates with `requestAnimationFrame` to avoid layout thrashing.

### 3.5 Trade-Offs That Surface

| Trade-Off | The Tension | Decision for Chat |
|:----------|:------------|:------------------|
| **Consistency vs Availability** (Trade-Off #2) | Message ordering must be consistent across all clients. But waiting for server confirmation before showing a sent message feels sluggish. | Optimistic local ordering with server reconciliation. Show the message instantly with a "sending" indicator. If the server re-orders it (due to timestamp conflicts), silently adjust. Users rarely notice a message moving from position 5 to position 4. |
| **Offline Capabilities vs Data Accuracy** (Trade-Off #7) | Offline queuing means the user might send 10 messages while offline. When they reconnect, all 10 flush at once. But what if someone else replied in between? | Accept eventual consistency. Flush queued messages in order, let the server interleave them with messages from others based on server timestamps. The UI adjusts after sync. |
| **Memory vs Speed** (Trade-Off #4) | Caching entire chat history in IndexedDB enables instant offline access. But a user with 500 conversations and 100k+ messages will bloat storage. | Cache the last 100 messages per conversation. Older messages load on-demand (scroll-up pagination). Implement an LRU eviction policy for conversations not accessed in 30+ days. |

### 3.6 Edge Cases & What Most Candidates Miss

- **Message ordering across timezones and network delays** — Client A sends at 10:00:00.000 (their clock), Client B sends at 10:00:00.001 (their clock). But Client A's message arrives at the server 500ms later due to network latency. Use server-assigned timestamps for canonical ordering, not client timestamps. Display client time locally but sort by server time.
- **Reconnection after long offline period** — User was offline for 3 days and has 2,000 unread messages across 50 chats. Do NOT fetch all 2,000 at once. Sync unread counts first (lightweight), then lazy-load message content per conversation as the user opens each chat.
- **Typing indicators and presence** — These are high-frequency WebSocket events with low information value. A 256-member group with 10 people typing = 10 typing events per second. Throttle to 1 event per 3 seconds per user. Aggregate display: "Alice, Bob, and 3 others are typing..."
- **Large group message fan-out** — 256 members, each sending 1 message = 256 WebSocket events in quick succession. Batch incoming messages with a 100ms debounce window before triggering a React re-render. Without batching, you get 256 re-renders in 1 second.
- **Image upload on flaky network** — Chunked upload with resume capability. If the connection drops at 60% uploaded, resume from chunk 60% on reconnect. Show a progress bar per image. Store incomplete uploads in IndexedDB so they survive app restarts.
- **Message deletion and edit propagation** — User A deletes a message. User B is offline. When B comes online, they must receive the deletion event and remove the message from their local IndexedDB store. Edits work similarly — every message needs a `version` field. Sync resolves by applying the highest version.

### 3.7 Final Architecture Summary

| Requirement | Decision | Architecture | Implementation |
|:------------|:---------|:-------------|:---------------|
| Real-time messaging | Server push | WebSockets | Persistent connection with exponential backoff + jitter reconnect |
| Offline queuing | Client-side queue | Service Worker + IndexedDB | Messages stored with `status: "queued"`, flushed via Background Sync |
| Read receipts | Per-message state machine | WebSocket events | `sending → sent → delivered → read` with check-mark icons |
| Message ordering | Server-canonical timestamps | Server-assigned ordering | Client displays local time, sorts by server time |
| Group chats (256) | Batched UI updates | Debounced rendering | 100ms debounce window + `requestAnimationFrame` batching |
| Chat history | Partial cache | LRU cache in IndexedDB | Last 100 messages per conversation, older on-demand |

---

## 📊 Example 4: "Design a Dashboard/Analytics Tool" — Full Journey

> Covers high-interactivity, complex state, large dataset rendering, and data visualization — an entirely different problem space from feed/checkout/chat.

### 4.1 The Vague Prompt

**Interviewer/Manager:** "Design an analytics dashboard like Google Analytics."

### 4.2 The Clarifying Phase

*   **You:** "Is the data real-time, or batch-updated?"
    *   *Them:* "Near-real-time. Data refreshes every 30 seconds."
*   **You:** "Do we need a custom report builder, or is it predefined widgets?"
    *   *Them:* "Predefined widgets for MVP. Custom report builder is a Should Have."
*   **You:** "Export capabilities? CSV, PDF?"
    *   *Them:* "Must Have. Users need to export for stakeholder reports."
*   **You:** "How many concurrent data widgets on screen at once?"
    *   *Them:* "Up to 12. Some are charts, some are tables, some are KPI cards."
*   **You:** "Is this mobile responsive or desktop-only?"
    *   *Them:* "Desktop-first. Basic mobile view for checking KPIs on the go, but full functionality is desktop."
*   **You:** "Is this an internal tool or public-facing?"
    *   *Them:* "Internal — authenticated users only."

### 4.3 Extracted Spec Sheet

**✅ Functional Requirements:**

| Priority | Requirement |
|:---------|:------------|
| **Must Have** | Dashboard with up to 12 configurable widgets (charts, tables, KPI cards) |
| **Must Have** | Date range filters with preset ranges (Today, 7d, 30d, Custom) |
| **Must Have** | CSV and PDF export |
| **Must Have** | User authentication (internal tool) |
| **Should Have** | Custom report builder (drag-and-drop widget selection) |
| **Should Have** | Dashboard sharing via URL |
| **Could Have** | Drag-and-drop widget layout reordering |
| **Won't Have** | Public-facing / SEO, Mobile-first design, Real-time collaboration |

**🧱 Non-Functional Requirements:**

| Constraint | Target | Reason |
|:-----------|:-------|:-------|
| Rendering | 12 widgets rendering simultaneously without jank | Complex viewport with independent data sources |
| Data refresh | 30-second auto-refresh without full page reload | Near-real-time data accuracy |
| Export | Large CSV export without freezing the UI | Datasets can be 100k+ rows |
| Interactivity | Filter changes reflect in < 500ms | Dashboard must feel responsive |

### 4.4 Concepts in Action

- **12 independent widgets** → Component isolation. Each widget fetches its own data, manages its own loading/error state, and renders independently. One widget failing must NOT crash the entire dashboard. Use `ErrorBoundary` per widget.
- **Large datasets in tables** → DOM Virtualization for table rows. A table with 50,000 rows cannot render all DOM nodes. Use `react-virtuoso` or `TanStack Virtual` for row windowing.
- **Near-real-time (30s)** → Polling vs SSE trade-off. For 12 widgets refreshing every 30s, polling is simpler and sufficient (SSE is overkill for 30s intervals). Use `setInterval` with `AbortController` per request. Stagger widget refresh to avoid 12 simultaneous API calls.
- **Complex filters** → URL-driven state for shareability and deep linking. All active filters (date range, dimensions, segments) are serialized into URL search params. Sharing a URL shares the exact dashboard view. Use `URLSearchParams` for serialization.
- **Charts** → Canvas-based rendering for performance. SVG charts with 10,000 data points create 10,000 DOM nodes. Canvas-based libraries (Chart.js, ECharts) render to a single `<canvas>` element regardless of data volume.

### 4.5 Trade-Offs That Surface

| Trade-Off | The Tension | Decision for Dashboard |
|:----------|:------------|:----------------------|
| **SEO vs Interactivity** (Trade-Off #1) | Internal tool — no Google indexing needed. | CSR only. No SSR overhead. This eliminates hydration cost and simplifies the architecture significantly. |
| **Memory vs Speed** (Trade-Off #4) | Caching chart data for 12 widgets means storing potentially megabytes of time-series data in memory. | Cache the current filter state's data only. When filters change, discard old data and fetch fresh. Use `WeakRef` or manual cache invalidation to prevent memory buildup during long sessions. |
| **Performance vs Accessibility** (Trade-Off #3) | Canvas-based charts are inherently inaccessible — screen readers cannot parse canvas pixels. | Provide a hidden ARIA data table alongside each canvas chart. Visually hidden via `sr-only` class, but screen readers get a full tabular representation of the chart data. |

### 4.6 Edge Cases & What Most Candidates Miss

- **Widget layout persistence** — User rearranges the 12-widget grid via drag-and-drop. Where is this layout saved? `localStorage` for personal preference + server-side for cross-device consistency. Handle conflicts: what if the server has layout v3 but `localStorage` has v5?
- **Large CSV export blocking the main thread** — Generating a CSV from 100,000 rows in the main thread freezes the UI for seconds. Offload to a Web Worker. Stream the CSV generation, and use `Blob` + `URL.createObjectURL()` for download. Show a progress indicator.
- **Date range filter edge cases** — Timezone handling: "Last 7 days" in UTC vs user's local timezone gives different results. DST transitions: a "24-hour" day is 23 or 25 hours during DST changes. Always send timezone info to the API and let the server compute boundaries.
- **Dashboard sharing and permissions** — URL contains all filter state (good for sharing). But what if the shared URL contains a filter for data the recipient doesn't have permission to see? The API must enforce permissions. The UI should gracefully handle "403 Forbidden" per-widget, not crash the whole dashboard.
- **Chart rendering with missing data points** — Time-series chart for 30 days, but day 15-17 has no data. Options: show a gap (honest), interpolate (misleading), or show zero (also misleading). The right answer depends on context — expose this as a configurable "null handling" option.
- **Concurrent filter changes** — User rapidly changes 3 filters within 1 second. Each filter change triggers 12 API calls (one per widget). Without debouncing + request cancellation (`AbortController`), you have 36 in-flight requests with 24 of them wasted. Debounce filter changes by 300ms and cancel previous in-flight requests.

### 4.7 Final Architecture Summary

| Requirement | Decision | Architecture | Implementation |
|:------------|:---------|:-------------|:---------------|
| 12 widgets | Independent isolation | ErrorBoundary per widget | Each widget: own fetch, own loading state, own error boundary |
| Large tables | Virtualize rows | DOM Virtualization | TanStack Virtual for row windowing |
| 30s refresh | Staggered polling | setInterval + AbortController | Stagger widget refresh by 2-3s to avoid request storms |
| Complex filters | URL-driven state | URLSearchParams | All filters serialized to URL, enabling deep-link sharing |
| Charts | Canvas rendering | Chart.js / ECharts | Single `<canvas>` per chart + hidden ARIA table for accessibility |
| CSV export | Offload to worker | Web Worker | Streamed CSV generation, Blob download, progress indicator |

---

## ⚡ Quick-Fire Scenarios

> Rapid 3-minute spec sheets to practice breadth. For each: identify the core flow, key NFRs, unique frontend challenge, and critical trade-off.

---

### 🎵 "Design Spotify"

**Core Flow:** Audio playback + playlist management + music discovery.

**Key NFRs:**
- Gapless playback (no silence between tracks)
- Offline downloads (store tracks in IndexedDB / Cache API)
- Background audio (must continue playing when tab is not focused)
- Instant track switching (< 200ms perceived latency)

**Unique Frontend Challenge:**
The Web Audio API and `<audio>` element. Gapless playback requires pre-buffering the next track while the current one plays. You need two `<audio>` elements — one playing, one pre-loading — and crossfade at the boundary. Queue state management (shuffle, repeat, queue modifications) is a complex state machine.

**Critical Trade-Off:** *Offline storage size vs library completeness.* Users want their entire library offline. But 1,000 songs at 5MB each = 5GB. Browser storage quotas vary (Chrome gives ~60% of free disk space). You must implement a smart caching policy: cache recently played + explicitly downloaded playlists, evict LRU tracks when approaching quota.

**Architecture Highlights:**
- Dual `<audio>` element crossfade for gapless playback
- Service Worker for offline track caching with quota management
- Persistent audio player component (lives outside route changes)
- MediaSession API for lock-screen controls and system notifications

---

### 📝 "Design Google Docs"

**Core Flow:** Real-time collaborative text editing with formatting.

**Key NFRs:**
- Multi-cursor awareness (see where other users are editing)
- Conflict resolution (two users edit the same paragraph simultaneously)
- Offline editing with sync on reconnect
- Undo/redo that respects collaborative context

**Unique Frontend Challenge:**
CRDTs (Conflict-free Replicated Data Types) or Operational Transforms for conflict-free collaboration. The core problem: User A inserts "Hello" at position 5, User B deletes character at position 3 — simultaneously. Without a conflict resolution algorithm, the document diverges. Libraries like Yjs (CRDT-based) handle this, but integrating them with a rich-text editor (ProseMirror, TipTap) is architecturally complex.

**Critical Trade-Off:** *Consistency vs real-time responsiveness.* Applying local edits immediately (optimistic) makes typing feel instant but risks temporary divergence. Waiting for server acknowledgment guarantees consistency but adds 50-200ms latency per keystroke — unacceptable. Solution: apply locally, reconcile asynchronously, and resolve conflicts via CRDT merge rules.

**Architecture Highlights:**
- CRDT-based document model (Yjs) for conflict resolution
- WebSocket connection for real-time sync + cursor broadcasting
- ProseMirror / TipTap for the rich-text editor layer
- IndexedDB for offline document cache with merge-on-reconnect

---

### 🎨 "Design an Image Editor (like Canva)"

**Core Flow:** Canvas manipulation with layers, text overlay, shapes, and templates.

**Key NFRs:**
- Undo/redo stack (must support 50+ operations)
- Export in multiple formats (PNG, JPEG, PDF, SVG)
- Performance with large canvases (4000x4000px+)
- Real-time preview of filter/effect changes

**Unique Frontend Challenge:**
The Canvas API (2D context) or WebGL for hardware-accelerated rendering. A 4000x4000 canvas with 20 layers and live filter previews is memory-intensive. Each layer is a separate off-screen canvas composited onto the main canvas. Undo/redo requires either storing full canvas snapshots (memory-expensive) or a command pattern (storing operations as objects and replaying them — CPU-expensive but memory-efficient).

**Critical Trade-Off:** *Feature richness vs browser memory limits.* Each canvas layer at 4000x4000 with RGBA = 64MB of raw pixel data. 20 layers = 1.28GB. Browsers will crash. Solutions: downsample for preview (render at 50% resolution during editing, full resolution only on export), flatten unused layers, use `OffscreenCanvas` + Web Workers for rendering.

**Architecture Highlights:**
- Command pattern for undo/redo (operation log, not state snapshots)
- `OffscreenCanvas` + Web Worker for non-blocking rendering
- Layer compositing pipeline with off-screen canvas per layer
- Blob export pipeline: Canvas → `toBlob()` → download via `URL.createObjectURL()`

---

## 🎯 Key Takeaways

1. **Always use the first 5 minutes to generate a spec sheet.** That spec sheet is your shield. If you get stuck or the interviewer adds a crazy feature, point back and say, *"That sounds cool, but it falls outside the MVP scope we agreed on."*
2. **Requirements compose.** A single requirement rarely lives in isolation. The news feed's 3G constraint affects image loading, bundle size, AND rendering strategy simultaneously. Trace each requirement through the full stack.
3. **Edge cases separate "hire" from "no hire."** Identifying that pull-to-refresh has a race condition, or that Canvas charts need ARIA fallbacks, demonstrates the depth of thinking interviewers are looking for.
4. **Every trade-off is a conversation, not a unilateral decision.** State the trade-off, explain both sides, and justify your choice given the constraints. *"I chose pessimistic UI for payment because the cost of showing a false success is losing the customer's trust."*
