# Requirement Analysis — Interview Strategy

> 💡 **Core Idea:** The requirement gathering phase is a **performance**. It tests whether you think like a Junior coder or a Senior architect. This guide covers not just *what* to ask, but *how* to present it, *how* to communicate it, and *how* to quickly recall under pressure.

---

## Table of Contents

- [1. The Mindset: It's a Performance, Not an Interrogation](#1-the-mindset-its-a-performance-not-an-interrogation)
- [2. Red Flags to Avoid](#2-red-flags-to-avoid)
- [3. The First 5 Minutes Playbook](#3-the-first-5-minutes-playbook)
- [4. Communication Techniques](#4-communication-techniques)
- [5. Presentation Framework](#5-presentation-framework)
- [6. Quick Recall Under Pressure](#6-quick-recall-under-pressure)
- [7. Common Interviewer Traps & How to Handle Them](#7-common-interviewer-traps--how-to-handle-them)
- [8. Practice Drills](#8-practice-drills)

---

## 1. The Mindset: It's a Performance, Not an Interrogation

The first 5 minutes of a system design interview determine if you get the job.

**What they are secretly evaluating:**
1. **Does this person dive straight into code?** (Junior behavior).
2. **Does this person know what constraints actually matter?** (Senior behavior).
3. **Can this person lead a technical meeting?** (Lead/Staff behavior).

### The Seniority Signal Matrix

Every level of engineer behaves differently during requirement gathering. The interviewer is pattern-matching you to one of these:

| Level | What They Do | How It Looks | Signal to Interviewer |
| :--- | :--- | :--- | :--- |
| **Junior** | Jumps straight to code | "I'll use React and Redux!" | Cannot lead technical conversations. Needs hand-holding. |
| **Mid** | Asks questions from a memorized checklist | "Is it mobile? Desktop? How many users?" | Good, but robotic. Doesn't understand *why* questions matter. |
| **Senior** | Asks questions + justifies each one | "Is it mobile? *Because if so, we need aggressive code-splitting for 3G...*" | Understands architectural impact. Can own a feature end-to-end. |
| **Staff/Lead** | Drives the conversation, proposes scope, identifies business goals | "Before we design, let me align on the business objective — are we optimizing for acquisition or retention?" | Can lead a team. Thinks in systems, not components. |

> 💡 **Your Goal:** Act like a Senior at minimum. If you can demonstrate Staff-level behavior (tying architecture to business goals), you will stand out from 95% of candidates.

---

## 2. Red Flags to Avoid

These are the behaviors that instantly signal to an interviewer that you are not ready for a senior role. Memorize them so you never do them.

### 🚩 1. The "Eager Coder"
*   **You:** "Design Netflix? Okay! I'll use React, Redux Toolkit, and Tailwind. Let's draw the component tree!"
*   **Why you fail:** You don't even know if you're building the TV app or the mobile web app. You just started hammering nails before drawing a blueprint.

### 🚩 2. The "Silent Assumer"
*   **You:** *(In your head: I'll build this for desktop.)* "Okay, I'll make a grid layout for the movies."
*   **Why you fail:** The interviewer specifically wanted to test your mobile-first responsive design skills. You failed their hidden test because you didn't ask.

### 🚩 3. The "Robot Interrogator"
*   **You:** "Is it mobile? Is it desktop? How many users? What is the payload size? Is it offline?"
*   **Why you fail:** You sound like you memorized a checklist. You aren't explaining *why* you care about the answers. No architectural reasoning is visible.

### 🚩 4. The "Over-Scoper"
*   **You:** "We'll need authentication, real-time notifications, offline support, video streaming, push notifications, analytics, A/B testing, internationalization..."
*   **Why you fail:** You tried to design everything and will finish nothing. You can't prioritize, which means you can't lead. A 45-minute interview requires ruthless focus.

### 🚩 5. The "Feature Lister"
*   **You:** "So the features are: login, feed, search, profile, settings, messages, stories, reels, live streaming, shopping..."
*   **Why you fail:** Listing 50 features without prioritizing them demonstrates breadth but zero depth. You treated it as a product brainstorm, not an engineering exercise. Where are the constraints? Trade-offs? Architecture implications?

---

## 3. The First 5 Minutes Playbook

This is your exact script. Practice it until it's muscle memory.

### Minute 0–1: Acknowledge and Frame

**What to say:**
> *"Great question. Before I jump into architecture, I want to spend 3-4 minutes understanding the scope and constraints. This will help me make much better technical decisions."*

**Why this works:**
- It signals you're structured and won't ramble.
- It sets expectations for the interviewer — they know a thoughtful conversation is coming.
- It buys you time to think without looking lost.

### Minute 1–3: The Core Questions (Ask + Justify)

This is the most critical technique. When asking questions, always attach a **"Why"**. This proves you aren't reciting a list — it proves you understand the architectural impact.

**The Pattern:**
> ❌ **Junior:** *"[Question]?"*
> ✅ **Senior:** *"[Question]? I ask because [architectural impact]."*

**Master Examples:**

| Question | Junior Version | Senior Version (Ask + Justify) |
| :--- | :--- | :--- |
| **Platform** | "Mobile or desktop?" | "Are we focusing on mobile or desktop? *I ask because if it's mobile web, we'll need to prioritize touch targets and aggressive code-splitting for slower networks.*" |
| **Data Scale** | "How many items?" | "What scale are we expecting in the feed? *If we expect thousands of items, we'll need DOM virtualization from the start so the browser doesn't crash.*" |
| **Accessibility** | "Do we need a11y?" | "How critical is accessibility? *If we're targeting enterprise or government, WCAG AA compliance means we'll need semantic HTML and ARIA labels, which affects our component library choices.*" |
| **Internationalization** | "Is it global?" | "Are we serving a global audience? *Because RTL language support fundamentally changes our CSS architecture, and currency/date formatting requires the Intl API or a library like i18next.*" |
| **Real-Time** | "Is it real-time?" | "Does data need to update in real-time? *If yes, we're looking at WebSockets which adds reconnection logic and a different state management strategy than simple REST fetching.*" |
| **SEO** | "Do we need SEO?" | "Is search engine discoverability important? *Because if SEO is critical, we'll need server-side rendering, which has hydration cost implications for interactivity.*" |
| **Offline** | "Does it work offline?" | "Do users need offline support? *Offline support means Service Workers, IndexedDB, and a sync engine — that's a significant architecture commitment I want to scope early.*" |

### Minute 3–4: Prioritize (MoSCoW)

After 3-4 questions, you should have enough context to bucket features.

**What to say:**
> *"Based on what you've shared, let me prioritize. For our 45-minute session, I'd classify these as Must Haves: [feature 1, feature 2, feature 3]. Dark mode and real-time notifications feel like Should Haves — important but not critical for the core architecture. And I'll explicitly put video upload and stories as Won't Haves for today. Does that feel right?"*

**Why this works:**
- Demonstrates prioritization skills (a key senior/lead signal).
- Shows you understand MVP thinking.
- Gives the interviewer a chance to redirect before you invest time.

### Minute 4–5: Lock the Scope

Never start drawing architecture until you do this one thing: **Summarize and lock it.**

> *"Alright, to summarize: We are building a mobile-first web app where users can view and like text posts. We are optimizing for slow networks, and we are explicitly ignoring Video and Comments for now. Does this scope look good to you before we move to architecture?"*

**Why this is strategically genius:**
- **It's a contract.** If you run out of time at minute 40 and haven't built the "Comments" section, they can't penalize you. You explicitly locked it out of scope in minute 5.
- **It's a shield.** When they inevitably say "What about feature X?" at minute 30, you can point back: *"Great idea, but that's outside the MVP we agreed on. Happy to discuss it if we have time."*
- **It shows ownership.** You set the rules of the game, and then you played within them. This is Lead behavior.

---

## 4. Communication Techniques

This section is about **HOW** to talk, not **WHAT** to talk about. Most candidates fail not because they don't know the answer, but because they can't communicate it effectively.

### 4.1 Structuring Your Verbal Response

Think in structured outputs, not stream-of-consciousness:

- **Use numbered lists verbally:** *"There are 3 things I want to clarify before we start..."*
- **Signal transitions:** *"Now that we've locked scope, let me move to the high-level architecture."*
- **Mirror the interviewer's words:** If they said "snappy", don't say "performant" — say *"To make this snappy, we need to ensure our LCP is under 2.5 seconds."*
- **Summarize before moving on:** *"So we've established that this is mobile-first, text-only, optimized for 3G. Let me now map this to architecture."*

### 4.2 Using Silence Effectively

> 💡 **Key Insight:** Silence is not awkwardness. Silence is confidence.

- It is **completely acceptable** to say: *"Let me think about this for 10 seconds."*
- Don't ramble to fill silence. Pause, organize your thoughts, then speak clearly.
- Interviewers **respect** structured pauses — it shows you're thinking deeply rather than regurgitating memorized content.
- **The worst thing you can do** is ramble incoherently for 30 seconds. A 10-second pause followed by a crisp answer is infinitely better.

### 4.3 Drawing the Interviewer Into Collaboration

Transform the interview from an interrogation into a partnership:

- **Frame choices as collaborative:** *"There's a trade-off here between SSR and CSR. Which direction would you lean, given the business goals?"*
- **Why this works:** If they engage with your question, they're now *invested* in your solution. You've turned them from a judge into a co-architect.
- **This is Staff/Lead behavior.** You're running a design meeting, not answering exam questions.

### 4.4 Handling Pushback Gracefully

When the interviewer challenges your assumption or approach:

- ❌ **Don't get defensive:** *"No, SSR is clearly the right choice here."*
- ✅ **Show adaptability:** *"That's a great point. If we deprioritize SEO, then CSR makes more sense because we avoid the SSR server costs and hydration complexity. The architecture shifts to a pure SPA with client-side routing."*
- **What this demonstrates:** You can reason about trade-offs in real-time. You're not married to one solution. This is the most valued senior trait.

### 4.5 Graceful Pivots

When the interviewer redirects scope mid-discussion:

- ❌ **Don't panic:** *"Oh... okay, let me start over."*
- ✅ **Show cause-and-effect thinking:** *"Got it, so we're now prioritizing the Creator Studio instead of the Player. That fundamentally changes our architecture — we shift from streaming and media delivery to complex form management, state persistence, and heavy CRUD operations. Let me adjust my component hierarchy."*
- **Why this works:** You showed that changing a requirement cascades through the entire system. That's systems thinking.

---

## 5. Presentation Framework

How to **visually** present your work during an interview. This applies to whiteboard, virtual whiteboard, or even verbal-only interviews.

### 5.1 Whiteboard Organization

Split your board (physical or virtual) into 3 zones:

```
┌─────────────────┬──────────────────────┬─────────────────┐
│  REQUIREMENTS   │    ARCHITECTURE      │   TRADE-OFFS    │
│                 │                      │                 │
│ ✅ Functional:  │  [Component tree]    │ SSR vs CSR      │
│  - Feature 1    │  [Data flow]         │ Memory vs Speed │
│  - Feature 2    │  [API layer]         │ DX vs Bundle    │
│                 │                      │                 │
│ 🧱 Non-Func:   │                      │                 │
│  - Constraint 1 │                      │                 │
│  - Constraint 2 │                      │                 │
│                 │                      │                 │
│ ❌ Out of Scope │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
```

**Why 3 zones:**
- The **Requirements zone** (left) is your contract. You and the interviewer agreed on this.
- The **Architecture zone** (center) is your solution. It directly maps from the requirements.
- The **Trade-offs zone** (right) shows you understand costs. It's your "I'm a senior" proof.

### 5.2 The Spec Sheet Format

After gathering requirements, write a quick visual spec on the board. This takes 30 seconds and pays dividends for the rest of the interview:

```
MVP Scope (45 min):
───────────────────────────
✅ FR: Text feed, Image display, Like/Unlike, Pull-to-refresh
🧱 NFR: Mobile-first, 3G-optimized, <2.5s LCP
❌ OUT: Video, Comments, DMs, Real-time updates
```

This becomes your **visual contract**. Every architecture decision you make should trace back to something on this sheet.

### 5.3 Narrating Your Thought Process

**Think out loud.** The interviewer is scoring your *reasoning process*, not just your final answer.

- ✅ *"I'm considering SSR here because SEO is a requirement, but I'm weighing it against the hydration cost... Since the interviewer said mobile-first and 3G, hydration delay could be significant. Let me propose a hybrid — SSR the shell, then progressive hydration for interactive elements."*
- ❌ *"I'll use SSR."* (No reasoning visible. Could be a lucky guess.)

> 💡 **The Golden Rule:** If you're thinking it, say it. Internal reasoning that stays internal earns you zero points.

---

## 6. Quick Recall Under Pressure

Your mind will go blank. It happens to everyone. These frameworks are your emergency parachutes — memorize them so they're available when your brain freezes.

### 6.1 The "3 Ws" Instant Recall

If you can only remember ONE thing, remember this:

| W | What to Ask | Why It Matters |
| :--- | :--- | :--- |
| **Who** | Users, devices, network conditions | Dictates rendering strategy and performance budget |
| **What** | Core flow, MVP features | Dictates component tree and state management |
| **Why** | Business goal, success metric | Dictates trade-off decisions and prioritization |

> 💡 If you answer these 3 Ws, you've covered **80% of requirements** even under maximum pressure.

### 6.2 The 4-Category Safety Net

If the 3 Ws aren't enough, expand to 4 categories. Run through these sequentially:

1. **The Core Goal:** "What is the absolute MVP for this 45-minute session?"
2. **The Environment:** "Mobile web or desktop? Fast internet or flaky 3G?"
3. **The Data Scale:** "Are we rendering 50 items or 50,000?"
4. **The Constraints:** "Are there strict rules for SEO, Accessibility, or i18n?"

If you ask one question from each category, you have enough to start architecture.

### 6.3 Trigger Word → Architecture Instant Mapping

This is the **most practically useful recall tool** in this entire guide. Memorize this table. When you HEAR a keyword during the interview, you should INSTANTLY know the architectural implication.

| Trigger Word | Instant Thought | Architecture | Key Implementation |
| :--- | :--- | :--- | :--- |
| **"Offline"** | Data must persist locally | Service Workers + IndexedDB | Background Sync API, Optimistic UI |
| **"Real-time"** | Server must push updates | WebSockets / SSE | Reconnection strategy, exponential backoff |
| **"SEO"** | Bots must read HTML instantly | SSR / SSG | Next.js/Nuxt, JSON-LD structured data |
| **"Slow network" / "3G"** | Minimize initial payload | Aggressive Code Splitting | Route-based chunking, WebP images, blur-hash |
| **"10,000 items"** | DOM will explode | Virtualization / Windowing | react-window, recycle DOM nodes |
| **"Instant feedback"** | Can't wait for server | Optimistic UI | Rollback on failure, queue actions |
| **"Global audience"** | Multiple languages/formats | i18n architecture | RTL CSS, Intl API, i18next |
| **"Accessible"** | Screen readers must work | Semantic HTML + ARIA | Focus trapping, keyboard navigation |
| **"Analytics / Tracking"** | Track user behavior | Event system + Tag Manager | Async loading, don't block main thread |
| **"Collaborative"** | Multiple users editing | CRDTs / OT + WebSockets | Cursor awareness, conflict resolution |
| **"Security"** | Protect user data | CSP, HttpOnly cookies | XSS prevention, CORS, auth guards |
| **"Fast loading"** | Optimize Core Web Vitals | Code splitting + CDN | LCP < 2.5s, FCP < 1.8s, CLS < 0.1 |

### 6.4 The FAANG Mental Flow as a Memorized Script

If everything else fails, walk through this sequence. It's the exact flow that senior FAANG engineers use:

```
Prompt → Clarify → Users → Business Goal → FRs (MoSCoW) → NFRs (Metrics) → Architecture → Trade-offs
```

**Expanded:**
1. **Receive the prompt** — "Design YouTube."
2. **Clarify ambiguity** — "Is this the Player or the Creator Studio?"
3. **Identify users** — "Global audience on mobile web."
4. **Map to business goal** — "Increase watch time → longer ad revenue."
5. **Extract Functional (MoSCoW)** — "Must: playback, recommendations. Won't: comments."
6. **Extract Non-Functional (Metrics)** — "LCP < 2.5s, video start < 1s."
7. **Propose architecture** — "SSR shell, CSR recommendations, streaming via HLS."
8. **State trade-offs** — "Prioritizing instant video playback means delaying comments load."

---

## 7. Common Interviewer Traps & How to Handle Them

Interviewers use specific patterns to test your depth. Recognizing these patterns is half the battle.

### 7.1 The Scope Creep Trap

- **They say:** *"What if we also need video upload?"*
- **What they're testing:** Can you resist scope creep and maintain focus?
- ❌ **Wrong response:** *"Sure, I'll add that!"* (You just doubled your scope and will finish nothing.)
- ✅ **Right response:** *"That's a great feature. For our MVP today, I'd classify that as a 'Should Have'. If we have time after the core architecture is solid, I'd love to dive into the streaming and transcoding challenges. Want me to note it for later?"*

### 7.2 The Platform Trap

- **They say:** *"How would this change for mobile?"*
- **What they're testing:** Do you understand platform-specific constraints?
- ✅ **Right response:** *"On mobile web, three things change: First, touch targets need to be at least 44px for usability. Second, we need to reduce our bundle size aggressively because 3G is common. Third, the mobile keyboard pushes the viewport up, which affects our sticky header and input positioning."*

### 7.3 The Scale Trap

- **They say:** *"What if we have 10 million users?"*
- **What they're testing:** Can you think beyond a single machine?
- ✅ **Right response:** *"At 10M users, our CDN caching strategy becomes the most critical piece. I'd move to edge-rendered pages with stale-while-revalidate headers. On the client, I'd ensure our state management doesn't assume a single user session — we'd need stateless architecture and potentially edge-computed personalization."*

### 7.4 The Conflicting Requirements Trap

- **They say:** *"We need both amazing SEO AND app-like interactivity."*
- **What they're testing:** Can you identify and articulate trade-offs without panicking?
- ✅ **Right response:** *"Those are somewhat in tension. SSR gives us great SEO, but hydration delays interactivity. My proposal is a hybrid: SSR the initial shell and critical content for SEO crawlers, then progressively hydrate only the interactive regions. This is the approach Next.js takes with React Server Components — you get the SEO benefit without the full hydration cost."*

### 7.5 The "What If You're Wrong?" Trap

- **They say:** *"I disagree with that approach."*
- **What they're testing:** How do you handle technical disagreement? Do you fold or dig in?
- ✅ **Right response:** *"Fair point. Can you help me understand which constraint I might be underweighting? I want to make sure my architecture serves the actual priorities. If the concern is about [X], then we could pivot to [alternative approach] which handles that better at the cost of [trade-off]."*
- **Why this works:** You didn't cave immediately (weak), and you didn't argue (aggressive). You asked for information and proposed an alternative. That's engineering maturity.

### 7.6 The "What Would You Cut?" Trap

- **They say:** *"We only have 3 weeks instead of 8. What changes?"*
- **What they're testing:** Can you ruthlessly prioritize under pressure?
- ✅ **Right response:** *"If we cut the timeline by 60%, I'd strip to the absolute core: the read-only feed with basic pagination. I'd drop image support and use a simple CSS framework instead of custom components. On the NFR side, I'd defer a11y and i18n to phase 2, but I'd keep performance optimization because slow loading kills retention from day 1."*

---

## 8. Practice Drills

Knowing the theory isn't enough. You need to practice until these patterns are muscle memory. Here are structured drills.

### Drill 1: 5-Minute Timed Requirement Gathering

1. Set a timer for 5 minutes.
2. Pick a random app on your phone (Spotify, Uber, Airbnb, Notion).
3. Pretend someone said "Design [App]."
4. Write down:
   - 3 Functional Requirements (with MoSCoW priority)
   - 3 Non-Functional Requirements (with specific metrics)
   - 2 Out-of-Scope items
   - 1 Key Trade-off
5. Self-evaluate against the rubric below.

### Drill 2: The Silent Interviewer

1. Practice with a friend who only gives **1-word answers** ("yes", "no", "maybe").
2. This forces you to:
   - Justify every question (because you can't rely on follow-up info).
   - Drive the conversation entirely yourself.
   - Practice the "Ask + Justify" technique repeatedly.

### Drill 3: The Adversarial Interviewer

1. Practice with a friend who constantly **adds new requirements** every 2 minutes.
2. This forces you to:
   - Practice MoSCoW prioritization in real-time.
   - Use the scope-locking technique as a defensive tool.
   - Stay calm under requirement bombardment.

### Drill 4: Record Yourself

1. Record yourself doing a mock requirement gathering session (even alone).
2. Watch the recording and evaluate:
   - Did you ramble or speak concisely?
   - Did you use silence or fill it with noise?
   - Did you narrate your thought process?
   - How was your whiteboard organization?

### Self-Evaluation Rubric

After every practice session, score yourself honestly:

| Criteria | Score (1-5) | Notes |
| :--- | :--- | :--- |
| Did I avoid jumping into code? | | |
| Did I use Ask+Justify for every question? | | |
| Did I cover all 4 categories (Goal, Environment, Scale, Constraints)? | | |
| Did I explicitly lock the scope before moving to architecture? | | |
| Did I identify at least 1 trade-off and state it out loud? | | |
| Did I narrate my thought process (thinking out loud)? | | |
| Did I present requirements visually (spec sheet format)? | | |
| Did I handle scope creep gracefully? | | |
| Was my communication structured (numbered points, transitions)? | | |

**Scoring Guide:**
- **35-45:** You're ready. Your requirement gathering will impress.
- **25-34:** Good foundation. Practice the weak areas.
- **Below 25:** Focus on drills 1 and 4 daily for a week.

---

## 🎯 Key Takeaways

1. **It's a performance, not an interrogation.** The interviewer is evaluating your *process*, not your knowledge.
2. **Always Ask + Justify.** Never ask a naked question. Attach the architectural *why*.
3. **Lock the scope.** Your 5-minute spec sheet is both a contract and a shield.
4. **Communicate like a lead.** Structure verbally, use silence, collaborate with the interviewer.
5. **Memorize the trigger table.** When you hear "offline", your brain should instantly fire "Service Workers + IndexedDB."
6. **Practice until it's muscle memory.** Theory without practice is useless in a 45-minute pressure-cooker.
