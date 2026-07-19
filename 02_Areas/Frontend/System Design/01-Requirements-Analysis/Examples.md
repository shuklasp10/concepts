# Requirement Analysis — Deep Examples

> 💡 **Core Idea:** Examples showing the FULL JOURNEY from a vague prompt to concrete architecture. Each example walks through clarification → spec extraction → architecture mapping → trade-off surfacing → edge case discovery — exactly how a senior engineer thinks in an interview or a design review.

## Table of Contents

- [Example 1: "Design a News Feed" — Full Journey](#-example-1-design-a-news-feed--full-journey)
- [Example 2: "Design an E-Commerce Checkout" — Full Journey](#-example-2-design-an-e-commerce-checkout--full-journey)
- [Example 3: "Design a Real-Time Chat App" — Full Journey](#-example-3-design-a-real-time-chat-app--full-journey)
- [Example 4: "Design a Dashboard/Analytics Tool" — Full Journey](#-example-4-design-a-dashboardanalytics-tool--full-journey)
- [Quick-Fire Scenarios](#-quick-fire-scenarios)

---

## 📱 Example 1: "Design a News Feed" — Full Journey

### 1.1 The Vague Prompt

**Interviewer/Manager:** "I want you to design a News Feed like Twitter."

*If you start drawing components now, you fail.*

### 1.2 The Clarifying Phase

**You:** "Awesome. Before we talk about React or State, let's establish some boundaries."

*   **You:** "Is this primarily for mobile web, native apps, or desktop?"
    *   *Them:* "Let's focus on mobile web."
*   **You:** "Are we showing images and videos, or just text?"
    *   *Them:* "Text and images. No video for now."
*   **You:** "Do we need real-time updates (like new tweets popping in automatically) or is pull-to-refresh okay?"
    *   *Them:* "Pull-to-refresh is fine. No real-time."
*   **You:** "Who is the audience? Are we optimizing for low-end devices?"
    *   *Them:* "Yes, global launch. 3G network performance is critical."
*   **You:** "Does this feed need to be accessible — screen reader support, keyboard navigation for browsing posts?"
    *   *Them:* "Basic accessibility — semantic HTML and alt text for images. Full ARIA isn't an MVP priority."
*   **You:** "Are there any content moderation requirements? Flagging posts, reporting, NSFW filtering?"
    *   *Them:* "Server handles moderation. On the frontend we just need to respect a `hidden` flag from the API."
*   **You:** "Any analytics requirements? Impression tracking, scroll depth, engagement metrics?"
    *   *Them:* "Yes, we need impression tracking — knowing which posts were actually viewed."

### 1.3 Extracted Spec Sheet

In 90 seconds, you solved 80% of the architecture.

**✅ Functional Requirements (What to build):**

| Priority | Requirement |
|:---------|:------------|
| **Must Have** | Feed of text + image posts with infinite scroll |
| **Must Have** | Pull-to-refresh pagination |
| **Must Have** | Impression tracking (viewport-based) |
| **Should Have** | Post interactions (Like, Share) |
| **Should Have** | Basic accessibility (semantic HTML, alt text) |
| **Could Have** | Post bookmarking |
| **Won't Have** | Video playback, real-time WebSockets, Direct Messages |

**🧱 Non-Functional Requirements (How to build it):**

| Constraint | Target | Reason |
|:-----------|:-------|:-------|
| Network | Fast on 3G (<200kb initial bundle) | Global audience on slow networks |
| Scale | 10,000+ items without crashes | Mobile browser memory limits |
| Performance | LCP < 2.5s, INP < 200ms | Core Web Vitals compliance |
| Accessibility | Semantic HTML, image alt text | Basic screen reader support |

### 1.4 Concepts in Action: Requirement → Architecture

This is where the spec sheet transforms into engineering decisions. Each requirement *forces* an architectural pattern:

- **Mobile web + 3G** → Aggressive code splitting (route-based chunking), WebP image compression, skeleton loaders for perceived performance
- **Text + images feed** → Image lazy loading via `loading="lazy"` + Intersection Observer, blur-hash placeholders (tiny base64 preview while real image loads)
- **Pull-to-refresh** → Cursor-based pagination (not offset-based — offset breaks when new items are inserted), Intersection Observer to trigger next page fetch
- **10,000+ items** → DOM Virtualization (only render ~15 visible items, recycle DOM nodes on scroll)
- **Impression tracking** → Intersection Observer API (same observer pattern, dual purpose — triggering loads and tracking views)

> **Key Insight:** Notice how Intersection Observer appears three times — for lazy loading images, triggering pagination, and tracking impressions. Recognizing this shared primitive is what separates senior from junior thinking.

### 1.5 Trade-Offs That Surface

Three of the 7 Senior Trade-Offs from Concepts apply directly here:

| Trade-Off | The Tension | Decision for This Feed |
|:----------|:------------|:-----------------------|
| **Memory vs Speed** (Trade-Off #4) | Caching 10k DOM nodes = fast back-scroll but crashes mobile. Virtualizing = saves memory but costs CPU on mount/unmount. | Virtualize. Mobile memory is the harder constraint on 3G devices. Accept the CPU cost. |
| **Caching vs Freshness** (Trade-Off #6) | Cache feed data for instant revisits vs always show latest posts. | Stale-while-revalidate. Show cached feed instantly, then silently refresh in background. Show a "New posts available" banner instead of force-refreshing and losing scroll position. |
| **Bundle Size vs DX** (Trade-Off #5) | Using a virtualization library (react-window: ~6kb) vs building custom. | Use the library. 6kb gzipped is within budget and saves weeks of edge case handling. |

### 1.6 Decision Tree Walk-Through

Following the Slow Network / Emerging Market decision tree:

```
Requirement: Must load fast on 3G
  → Decision: Minimize initial payload
    → Reason: Network bandwidth is the bottleneck, not device CPU
      → Architecture: Aggressive Code Splitting & Lazy Loading
        → Implementation:
          1. Route-based chunking (feed page loads only feed code)
          2. Image compression (WebP with AVIF fallback)
          3. Blur-hash placeholders (< 30 bytes per image preview)
          4. Skeleton loaders (CSS-only, zero JS cost)
          5. Prefetch next page of data before user hits bottom
```

**Why NOT SSR here?** The decision tree for SEO says SSR. But this feed has no SEO requirement — it's a logged-in user experience. CSR with aggressive splitting wins because it avoids the hydration cost that SSR adds on slow devices.

### 1.7 Edge Cases & What Most Candidates Miss

These are the details that separate a "good" answer from a "hire" answer:

- **Variable-height items in virtualization** — Some posts are text-only (80px), some have large images (400px). Standard virtualization libraries assume fixed heights. You need dynamic measurement (`react-virtuoso` handles this, or measure-before-render with `ResizeObserver`).
- **Network failure mid-scroll** — User scrolls to page 5 and loses connection. Show cached content with a subtle "You're offline" banner. Do NOT clear existing items. Queue any interactions (likes) for retry via Background Sync.
- **Pull-to-refresh race conditions** — User pulls to refresh while a previous fetch is still in flight. You must `AbortController.abort()` the pending request before firing a new one. Otherwise, the old response might arrive after the new one and overwrite fresher data.
- **Image loading failures** — Individual image failures should show a fallback placeholder (broken image icon + "Tap to retry"), not crash the entire feed item. Use `<img onerror>` with retry logic (max 2 retries with exponential backoff).
- **Infinite scroll memory leaks** — Even with virtualization, image `Blob` URLs created via `URL.createObjectURL()` must be explicitly revoked. Intersection Observer instances must be disconnected on unmount. Forgetting either leaks memory over long scroll sessions.
- **Content ordering consistency** — If 50 new posts arrive while the user is at position 300, do NOT inject them into the feed and shift everything. Buffer them and show "50 new posts" at the top. Clicking the banner scrolls to top and prepends. This prevents the jarring "content jump" (CLS problem).

### 1.8 Final Architecture Summary

| Requirement | Decision | Architecture | Implementation |
|:------------|:---------|:-------------|:---------------|
| Mobile web + 3G | Minimize payload | Code splitting + lazy loading | Route-based chunks, WebP images, skeleton loaders |
| Text + image feed | Lazy render images | Intersection Observer | `loading="lazy"`, blur-hash placeholders |
| Pull-to-refresh | Cursor-based data fetching | Pagination with prefetch | Intersection Observer trigger, AbortController for races |
| 10k+ items | Save memory | DOM Virtualization | `react-virtuoso` (dynamic heights), node recycling |
| Impression tracking | Track viewport entries | Intersection Observer | Batch impression events, send on `visibilitychange` |
| Offline resilience | Cache-first | Stale-while-revalidate | Service Worker cache, "New posts" banner on refresh |

---

## 🛒 Example 2: "Design an E-Commerce Checkout" — Full Journey

### 2.1 The Vague Prompt

**Interviewer/Manager:** "Design the checkout flow for our new store."

### 2.2 The Clarifying Phase

*   **You:** "Is this a single-page checkout or a multi-step wizard (Shipping → Billing → Review)?"
    *   *Them:* "Multi-step wizard."
*   **You:** "Are we supporting global customers with different currencies and address formats?"
    *   *Them:* "Yes, global support."
*   **You:** "Which payment methods? Just credit cards, or also PayPal, Apple Pay, BNPL?"
    *   *Them:* "Credit cards and PayPal for MVP."
*   **You:** "Do users need to be logged in, or do we support guest checkout?"
    *   *Them:* "Guest checkout is a Must Have — most of our drop-offs are at the login wall."
*   **You:** "Should cart data persist if the user closes the tab and comes back?"
    *   *Them:* "Yes, critical. We lose 30% of users who get distracted mid-checkout."
*   **You:** "Do we need real-time shipping estimation during the address step?"
    *   *Them:* "Should Have — not blocking for launch, but planned."
*   **You:** "Any specific security compliance requirements?"
    *   *Them:* "PCI DSS. We never touch raw card numbers — use Stripe Elements."

### 2.3 Extracted Spec Sheet

**✅ Functional Requirements:**

| Priority | Requirement |
|:---------|:------------|
| **Must Have** | Multi-step wizard (Shipping → Payment → Review → Confirmation) |
| **Must Have** | Guest checkout (no login required) |
| **Must Have** | Credit card (via Stripe Elements) + PayPal integration |
| **Must Have** | Cart persistence across tab close/reopen |
| **Should Have** | Real-time shipping cost estimation |
| **Should Have** | Order summary sidebar (always visible) |
| **Could Have** | Address autocomplete (Google Places API) |
| **Won't Have** | BNPL, Cryptocurrency, Subscription billing |

**🧱 Non-Functional Requirements:**

| Constraint | Target | Reason |
|:-----------|:-------|:-------|
| Security | PCI DSS compliant | Never handle raw card data on our frontend |
| i18n | Multi-currency, multi-address format | Global customer base |
| Resilience | Zero data loss on navigation/refresh | Cart abandonment reduction |
| Performance | CLS < 0.1 (no layout shift on step transitions) | E-commerce conversion sensitivity |

### 2.4 Concepts in Action

- **Multi-step wizard** → Complex form state management. Each step's data must survive forward/backward navigation. `useReducer` + Context for step state, or React Hook Form with `FormProvider` for field-level validation preservation.
- **Global customers** → i18n architecture: RTL CSS support for Arabic/Hebrew, `Intl.NumberFormat` for currency display (never manually format currencies), country-specific address schemas (US has ZIP + State, UK has Postcode, Japan has reversed order).
- **Security (PCI)** → Stripe Elements iframes for card input (card data never touches our DOM or JS). HttpOnly cookies for session tokens. Content Security Policy headers to prevent XSS injection that could exfiltrate payment data.
- **Cart persistence** → `localStorage` for cart items (serialized JSON) + server-side cart sync for logged-in users. On page load: merge local cart with server cart, handle conflicts (item price changed, item out of stock).

### 2.5 Trade-Offs That Surface

| Trade-Off | The Tension | Decision for Checkout |
|:----------|:------------|:----------------------|
| **Consistency vs Availability** (Trade-Off #2) | Optimistic UI is great for Likes — but NEVER for payments. You cannot show "Payment successful!" and then discover it failed. | Pessimistic UI for payment. Show a spinner. Wait for the server confirmation. The user's money is at stake. |
| **Performance vs Accessibility** (Trade-Off #3) | Custom styled dropdowns for country/state selection look beautiful. Native `<select>` is ugly but fully keyboard/screen-reader accessible. | Use native `<select>` with light CSS styling. Checkout is not the place for flashy UI — it's the place for zero friction. Every custom widget is a potential accessibility barrier that costs conversions. |
| **Bundle Size vs DX** (Trade-Off #5) | React Hook Form (~8kb) vs building custom form state management. | Use the library. The validation, dirty tracking, and error handling logic it provides would take weeks to build correctly. 8kb is a rounding error against Stripe's SDK. |

### 2.6 Decision Tree Walk-Through

```
Requirement: Global customers with different currencies
  → Decision: Content must render correctly in any locale
    → Reason: Showing "$100" to a Japanese user paying ¥15,000 breaks trust
      → Architecture: i18n-aware rendering pipeline
        → Implementation:
          1. Intl.NumberFormat for all currency display
          2. Country-driven address form schema
          3. RTL CSS via `dir="rtl"` attribute + logical properties
          4. Date formatting via Intl.DateTimeFormat (no Moment.js)
```

### 2.7 Edge Cases & What Most Candidates Miss

- **Multi-step wizard state persistence** — User fills shipping (Step 1), goes to payment (Step 2), then hits the browser Back button. Does the shipping data survive? What if they refresh the page entirely? Use `sessionStorage` to persist form state across refreshes, and `beforeunload` to warn about unsaved changes.
- **Payment failure recovery** — Stripe returns a `payment_failed` error. What state does the UI show? The user should NOT need to re-enter their shipping address. Keep all prior step data intact. Show the error inline on the payment step with a "Retry" button.
- **Cart expiry and inventory locking** — User adds the last item to cart, spends 20 minutes on checkout. Meanwhile, someone else buys it. On payment submission, the server returns "out of stock." Show a clear error, offer alternatives, and update the cart total in real-time.
- **Currency conversion timing** — User sees "€85.00" on the review page. By the time they click "Pay" (5 minutes later), the exchange rate has shifted. Always re-fetch the final price from the server on payment submission. Never charge based on a cached price.
- **Address validation** — Async validation against shipping APIs can take 2-3 seconds. Show inline validation states (spinner → checkmark/error). Handle network timeouts gracefully — allow the user to proceed with a warning rather than blocking them entirely.
- **Session timeout during checkout** — If the auth session expires mid-checkout, do NOT redirect to login and destroy form data. Silently refresh the token (if using refresh tokens) or prompt a lightweight re-auth modal that preserves the current page state.
- **Double-submit prevention** — User clicks "Pay" twice rapidly. Disable the button immediately on first click. Use an idempotency key in the API request so the server ignores duplicate submissions. Show a clear "Processing..." state.
- **Guest checkout → account creation upsell** — After successful payment, offer "Save your details for faster checkout next time?" This is a state transition: guest session data must be transferable to a new account without re-entering anything.

### 2.8 Final Architecture Summary

| Requirement | Decision | Architecture | Implementation |
|:------------|:---------|:-------------|:---------------|
| Multi-step wizard | Preserve state across steps | Form state manager + Context | React Hook Form with `FormProvider`, `sessionStorage` backup |
| Guest checkout | No auth wall | Session-based cart | `localStorage` cart + server sync on payment |
| PCI compliance | Never touch card data | Hosted payment fields | Stripe Elements (iframe isolation) |
| Global i18n | Locale-aware rendering | i18n pipeline | `Intl.NumberFormat`, country-driven address schemas, logical CSS properties |
| Cart persistence | Survive tab close | Client-side storage | `localStorage` + merge logic on reload |
| Double-submit | Prevent duplicate payments | Idempotency | Disable button + idempotency key in API request |

---

## 💬 Example 3: "Design a Real-Time Chat App" — Full Journey

> This example covers real-time data, offline support, sync, and WebSockets — concepts that Examples 1 & 2 don't touch.

### 3.1 The Vague Prompt

**Interviewer/Manager:** "Design a messaging app like WhatsApp Web."

### 3.2 The Clarifying Phase

*   **You:** "Are we building 1-on-1 messaging, group chats, or both?"
    *   *Them:* "Both. Groups up to 256 members."
*   **You:** "What media types? Text only, or images/files too?"
    *   *Them:* "Text + images for MVP. File sharing is a Should Have."
*   **You:** "Do we need read receipts — the double-checkmark pattern?"
    *   *Them:* "Yes, sent/delivered/read status per message."
*   **You:** "Offline message queuing? If the user types a message on the subway, should it send when they reconnect?"
    *   *Them:* "Yes, must work on flaky networks."
*   **You:** "End-to-end encryption?"
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
