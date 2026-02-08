# Vindicate NYC — Product Specification

> **Version:** 1.0.0  
> **Last Updated:** 2026-02-08  
> **Status:** Draft — MVP Planning  
> **Domain:** [vindicate.nyc](https://vindicate.nyc)  
> **Repository:** [github.com/vindicatenyc/vindicate-app](https://github.com/vindicatenyc/vindicate-app)

---

## Table of Contents

1. [Vision & Mission](#1-vision--mission)
2. [Target User](#2-target-user)
3. [UX Research & Design Principles](#3-ux-research--design-principles)
4. [Core Features (MVP)](#4-core-features-mvp)
5. [Tech Stack](#5-tech-stack)
6. [Architecture](#6-architecture)
7. [Data Model](#7-data-model)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Future Roadmap](#9-future-roadmap)

---

## 1. Vision & Mission

### Vision

An accessible, calming web application that helps individuals in financial hardship track, manage, and recover from debt — empowering them with knowledge, tools, and a supportive AI companion.

### Mission

Vindicate NYC exists to **level the playing field** for people facing debt collection, credit damage, and financial stress. We give users:

- A **single dashboard** to see their complete financial picture
- **Account tracking** that follows each debt through its full lifecycle — disputes, payment plans, harassment logs, lawsuits
- **Budgeting tools** that help them regain control of their finances
- **Credit recovery guidance** with actionable steps
- An **AI companion ("Vinny")** that answers questions, suggests next steps, and provides emotional reassurance — without ever crossing into legal advice

### The Pivot

Vindicate NYC is pivoting from an IRS Offer in Compromise (OIC) calculator to a **full financial recovery and case management platform**. The existing monorepo structure, shared types, and API layer are being repurposed for this broader mission. Existing types (CaseSchema, FinancialSnapshotSchema) will be extended to support the new domain model.

### Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| User can import accounts and see dashboard | ✅ Functional |
| All 8 core features navigable | ✅ Functional |
| Mobile-responsive on iOS Safari & Chrome | ✅ Functional |
| Lighthouse Accessibility score | ≥ 90 |
| Time to interactive (3G throttled) | < 3s |
| User can complete full workflow (import → track → budget) without confusion | Qualitative testing |

---

## 2. Target User

### Primary Persona: "Maria"

- **Age:** 32
- **Tech Comfort:** Uses iPhone daily (social media, banking apps), but not "techy"
- **Situation:** Has 6 accounts in collections totaling $23,000. Receives frequent calls from collectors. Unsure of her rights. Wants to rebuild credit but feels overwhelmed.
- **Emotional State:** Anxious, ashamed, overwhelmed. Avoids opening mail. Needs reassurance that recovery is possible.
- **Goals:**
  - Understand what she owes and to whom
  - Know her rights when collectors call
  - Have a plan to pay down debt
  - See her credit score improve over time
  - Feel like she's making progress, not drowning

### Secondary Persona: "James"

- **Age:** 45
- **Tech Comfort:** Moderate — uses desktop at work, smartphone for personal
- **Situation:** Going through a debt-related lawsuit. Needs to track court dates, deadlines, documents. Has some knowledge of FDCPA but needs help with strategy.
- **Goals:**
  - Track case timeline and deadlines
  - Organize documents
  - Understand legal process stages
  - Budget around legal costs

### Design Implications

| User Need | Design Response |
|-----------|----------------|
| Low tech comfort | Minimal UI, large touch targets, guided flows |
| Emotional distress | Calming colors, encouraging copy, progress celebration |
| Information overwhelm | Progressive disclosure, one thing at a time |
| Shame/stigma | Private, non-judgmental language, normalization |
| Need for guidance | AI companion, contextual help, resource center |
| Mobile-first | Touch-friendly, responsive, works on older devices |

---

## 3. UX Research & Design Principles

### Competitive Analysis

We studied 7 well-loved fintech apps to extract patterns that resonate with users:

#### Credit Karma
- **What works:** Clean credit score dashboard with trend line, account overview cards, actionable "steps to improve" recommendations
- **Adopt:** Score visualization, account summary cards, recommendation pattern
- **Avoid:** Ad-heavy monetization that erodes trust

#### YNAB (You Need A Budget)
- **What works:** Category-based budgeting that feels empowering rather than restrictive, strong educational content, "give every dollar a job" philosophy
- **Adopt:** Educational approach, empowering language ("you're in control"), category-based budget view
- **Avoid:** Steep learning curve, complex rule system

#### Cleo
- **What works:** AI-powered financial assistant with friendly, Gen-Z-friendly personality; conversational interface that makes finance feel approachable
- **Adopt:** Conversational AI companion, personality-driven interactions, proactive suggestions
- **Avoid:** Overly casual tone that might feel unserious for legal/debt matters

#### Brigit
- **What works:** Clean, minimal UI with clear status indicators; "you're covered" reassurance; simple dashboard
- **Adopt:** Minimal UI, status indicators, reassurance patterns
- **Avoid:** Subscription-gated features in MVP

#### Debt Payoff Planner
- **What works:** Visual progress tracking with satisfying progress bars, milestone celebrations, snowball/avalanche comparison
- **Adopt:** Progress bars, milestones, payoff strategy visualization
- **Avoid:** Dated UI patterns

#### Rocket Money
- **What works:** Bill tracking with automated detection, spending insights with clear categorization, net worth tracking
- **Adopt:** Bill/account tracking patterns, spending categorization, clean data visualization
- **Avoid:** Feature bloat

#### Credit Sesame
- **What works:** Credit monitoring with specific improvement recommendations, score simulator ("if you pay this off, your score could increase by X")
- **Adopt:** Improvement recommendations, score impact simulation (future)
- **Avoid:** Overwhelming notifications

### Design Principles

#### 1. Calming, Not Alarming
- **Color palette:** Warm, muted tones — soft sage greens, warm grays, gentle blues. Red only for truly urgent items (court deadlines), never for debt amounts.
- **Typography:** Rounded, friendly sans-serif (Inter or similar). Large, readable body text (16px minimum).
- **Language:** "You're making progress" not "You owe $23,000". "Next step" not "Overdue". "Let's work on this together" not "Action required".
- **Progress indicators everywhere:** Every screen should show movement forward.

#### 2. Progressive Disclosure
- **Dashboard first:** Big picture summary — total debt, number of accounts, upcoming deadlines, credit score trend
- **Drill down on demand:** Click an account to see details. Click a stat to see the breakdown.
- **No walls of text:** Use expandable sections, tabs, and step-by-step flows
- **Context-sensitive help:** "What's this?" tooltips, not documentation links

#### 3. Guided Experience
- **Vinny (AI Companion)** is present on every screen with contextual tips
- **First-time setup** is a friendly wizard, not a blank dashboard
- **Empty states** include clear CTAs: "Add your first account" with illustration
- **Contextual onboarding:** Tooltips and highlights for new features

#### 4. Celebration of Progress
- **Visual milestones:** Confetti/animation when an account is settled, when credit score improves, when a budget goal is met
- **Progress bars** on accounts (% paid), budget (% remaining), disputes (stage progression)
- **Streaks:** "You've logged activity for 5 days in a row"
- **Summary emails** (future): "This month you reduced your debt by $450"

#### 5. Mobile-First Responsive
- **Breakpoints:** 320px (small phone) → 768px (tablet) → 1024px (desktop) → 1280px (wide)
- **Touch targets:** Minimum 44x44px
- **Bottom navigation** on mobile, sidebar on desktop
- **Swipe gestures** for common actions (swipe to log activity, swipe to dismiss)
- **No hover-dependent interactions**

#### 6. Dark/Light Mode
- **System preference detection** with manual toggle
- **Dark mode:** Not pure black — use dark slate/charcoal backgrounds with slightly muted accent colors
- **Light mode:** Warm whites and light grays, not stark white
- **Persistent preference** in localStorage

#### 7. Accessibility (WCAG 2.1 AA)
- **Color contrast:** 4.5:1 minimum for text, 3:1 for large text and UI components
- **Keyboard navigation:** Full tab order, visible focus indicators, skip-to-content link
- **Screen reader support:** Semantic HTML, ARIA labels, live regions for dynamic content
- **Motion sensitivity:** `prefers-reduced-motion` support, no auto-playing animations
- **Text scaling:** Supports up to 200% zoom without layout breakage

### Color Palette

```
Light Mode:
  Background:     #FAFAF8  (warm white)
  Surface:        #FFFFFF
  Border:         #E8E5E0  (warm gray)
  
  Primary:        #4A7C6F  (sage green — calm, growth)
  Primary Hover:  #3D6A5E
  Secondary:      #6B8FA3  (slate blue — trust, stability)
  
  Text Primary:   #2D2D2D  (soft black)
  Text Secondary: #6B6B6B  (warm gray)
  Text Muted:     #9B9B9B
  
  Success:        #5B9A6F  (muted green)
  Warning:        #C4943D  (warm amber)
  Danger:         #C45B5B  (muted red — used sparingly)
  Info:           #5B84C4  (calm blue)

  Accent:         #8B6FB0  (soft purple — Vinny's color)

Dark Mode:
  Background:     #1A1D21  (dark charcoal)
  Surface:        #242830
  Border:         #353A42
  
  Primary:        #6BA894  (brighter sage)
  Secondary:      #7DA3B8  (lighter slate)
  
  Text Primary:   #E8E5E0
  Text Secondary: #A0A0A0
  Text Muted:     #6B6B6B
```

### Typography

```
Font Family:    Inter (variable), system-ui fallback
Heading 1:      28px / 1.2 / 600 weight
Heading 2:      22px / 1.3 / 600 weight
Heading 3:      18px / 1.4 / 600 weight
Body:           16px / 1.6 / 400 weight
Body Small:     14px / 1.5 / 400 weight
Caption:        12px / 1.4 / 400 weight
```

---

## 4. Core Features (MVP)

### 4.1 Dashboard

The landing page after setup. A calming, at-a-glance view of the user's financial world.

**Components:**

| Component | Description |
|-----------|-------------|
| **Greeting Banner** | Time-of-day greeting + Vinny's contextual tip ("Good morning! You have a payment due Thursday.") |
| **Financial Health Cards** | 4 stat cards: Total Debt, Active Accounts, Open Disputes, Credit Score (mocked) |
| **Debt Progress Ring** | Circular progress showing % of original debt paid off |
| **Recent Activity Feed** | Last 5-10 activities across all accounts (calls logged, payments made, letters sent) |
| **Upcoming Deadlines** | Next 3 deadlines/reminders with countdown badges |
| **Quick Actions** | Floating action buttons: "Log Activity", "Add Account", "Ask Vinny" |

**Responsive Behavior:**
- **Mobile:** Single column, cards stack, horizontal scroll for stat cards
- **Tablet:** 2-column grid
- **Desktop:** Full dashboard layout with sidebar

### 4.2 Accounts

The core data view. Every debt the user is tracking.

**Account List View:**
- Card-based list (not a table) with: creditor name, original amount, current balance, status badge, last activity date
- **Status badges:** In Collections, Disputed, Payment Plan, Settled, In Litigation, Charged Off
- **Search** by creditor name
- **Filters:** By status, by amount range, by date
- **Sort:** By balance (high/low), by date added, by status, by last activity
- **Bulk actions:** Mark multiple as disputed, export list

**Account Detail View (Tabbed):**

| Tab | Contents |
|-----|----------|
| **Overview** | Creditor info (name, address, phone, account #), original balance, current balance, status with timeline, date opened, date of last activity, assigned collector, statute of limitations countdown |
| **Activity Log** | Chronological list of all interactions: calls, letters received/sent, payments, disputes filed. Each entry has timestamp, type, notes, attached documents |
| **Documents** | Uploaded files organized by type: validation letters, dispute letters, court documents, payment receipts, correspondence |
| **Payment Plan** | Current plan details (if active): monthly amount, total remaining, schedule, progress bar, next due date |
| **Notes** | Free-text notes area for personal tracking |

**Account Import (Mocked):**
- Step 1: "Upload your credit report" (file picker, accepts PDF — mocked processing)
- Step 2: "We found X accounts" — review list with checkboxes
- Step 3: "Confirm import" — accounts added to dashboard
- In MVP, this uses pre-built mock data regardless of upload

**Add/Edit Account (Manual):**
- Form with fields: creditor name, account number, original balance, current balance, status, date opened, collector name, notes
- Validation with helpful error messages
- Auto-save draft

### 4.3 Activity Logger

Quick logging of interactions with creditors and collectors.

**Quick-Log Form:**
- **Type selector:** Phone Call (Inbound/Outbound), Letter Received, Letter Sent, Payment Made, Payment Received, Dispute Filed, Court Filing, Other
- **Account linker:** Dropdown to associate with an account
- **Date/time:** Defaults to now, editable
- **Notes:** Free text with templates ("Collector called at [time], said [summary]. I responded by [action].")
- **Document attach:** Optional file upload (mock)
- **Harassment flag:** Toggle for FDCPA violation logging (time of call, threats made, etc.)

**Templates:**
- "Debt validation letter sent"
- "Received collection call" (with harassment checklist)
- "Payment made"
- "Filed dispute with credit bureau"
- "Received court summons"

**Activity Timeline View:**
- Filterable by account, type, date range
- Visual timeline with icons per type
- Expandable entries

### 4.4 Case Tracker

For users dealing with disputes or lawsuits.

**Case Types:**
- Credit Bureau Dispute (Equifax, Experian, TransUnion)
- Debt Validation Dispute (direct to collector)
- Lawsuit (user as defendant)
- Arbitration

**Case Detail:**

| Element | Description |
|---------|-------------|
| **Status Timeline** | Visual stage progression: Filed → Under Review → Response Received → Resolved/Escalated |
| **Key Dates** | Filing date, response deadline, hearing date, statute of limitations |
| **Reminders** | Auto-generated for deadlines, configurable |
| **Documents** | Case-specific document management |
| **Related Account** | Linked account with quick navigation |
| **Outcome** | Final result: Won, Lost, Settled, Dismissed, Withdrawn |

**Deadlines & Reminders:**
- Visual countdown ("12 days until response deadline")
- Color-coded urgency (green > 14 days, amber 7-14 days, red < 7 days)
- Mock notification system (in-app banner)

### 4.5 Budget & Financial Health

Simplified budgeting focused on debt recovery context.

**Monthly Budget:**
- Income entry (salary, side income, benefits)
- Expense categories: Housing, Utilities, Food, Transportation, Healthcare, Debt Payments, Insurance, Personal, Other
- Visual bar showing income vs. total expenses
- "Available for debt repayment" callout

**Debt Repayment Tracker:**
- **Snowball view:** Accounts ordered smallest to largest balance, progress bars
- **Avalanche view:** Accounts ordered highest to lowest interest rate
- **Comparison:** "Snowball pays off in X months, Avalanche saves $Y in interest"
- **Monthly allocation:** How much goes to each account
- **Progress visualization:** Stacked bar chart showing debt reduction over time

**Credit Score Widget (Mocked):**
- Current score with rating (Poor/Fair/Good/Excellent)
- Trend line (last 6 months, mocked)
- Factors affecting score (mocked recommendations)
- "If you settle Account X, your score could improve by ~Y points"

**Savings Goals:**
- Emergency fund target
- Settlement fund (saving for lump-sum offers)
- Progress bar and monthly contribution tracker

### 4.6 Alerts & Notifications

In-app notification system.

**Notification Types:**
- ⏰ **Deadline approaching** — case deadlines, statute of limitations
- 💰 **Payment due** — upcoming payment plan installments
- 📊 **Credit score change** — mocked periodic updates
- 📋 **Account activity** — status changes, new documents
- 💵 **Budget alert** — overspending in category, approaching limit
- 🎉 **Milestone reached** — account settled, credit improvement

**Notification Center:**
- Bell icon in header with unread count badge
- Dropdown/panel with notification list
- Mark as read, dismiss, snooze
- Click to navigate to relevant section

**Preferences:**
- Toggle each notification type on/off
- Quiet hours (future)

### 4.7 Resource Center

Educational content and tools.

**Sections:**

| Section | Contents |
|---------|----------|
| **Know Your Rights** | FDCPA summary (what collectors can/can't do), FCRA summary (your credit report rights), state-specific resources (NY focus) |
| **Template Letters** | Debt validation request, cease and desist, dispute to credit bureau, pay-for-delete negotiation, goodwill letter. Each with explanation and fill-in-the-blank template |
| **Educational Articles** | "What happens when a debt goes to collections", "Understanding your credit report", "Statute of limitations by state", "How to negotiate a settlement", "What to do if you're sued" |
| **Glossary** | Terms: charge-off, validation, dispute, SOL, FDCPA, FCRA, OIC, arbitration, etc. |
| **External Links** | CFPB complaint portal, Legal Aid Society, court self-help centers |

**Design:**
- Card-based browsable layout
- Searchable
- "Vinny recommends" — AI-suggested resources based on user's accounts

### 4.8 AI Companion — "Vinny"

An always-available, reassuring AI assistant.

**Personality:**
- **Name:** Vinny (short for Vindicate)
- **Tone:** Warm, patient, encouraging. Like a knowledgeable friend who's been through this before.
- **Catchphrases:** "You've got this.", "Let's take it one step at a time.", "That's a great question."
- **Never:** Gives legal advice, makes promises about outcomes, uses fear language, judges the user
- **Always:** Disclaims "I'm not a lawyer — this is general information", suggests consulting professionals for complex matters

**Interface:**
- Floating chat bubble (bottom-right on desktop, bottom-center on mobile)
- Expandable chat panel
- Message history (session-based in MVP)
- Quick-reply suggestion chips

**Capabilities (Mocked in MVP):**
- Answer questions about FDCPA/FCRA rights
- Explain what a status means ("What does 'charged off' mean?")
- Suggest next steps for an account
- Help draft template letters
- Provide encouragement and reassurance
- Proactive tips on dashboard ("I noticed you have a payment due Thursday. Want me to help you prepare?")

**Mock Implementation:**
- Pattern-matched responses from a JSON response bank
- Keyword detection for topic routing
- Fallback: "I'm still learning! For now, check our Resource Center for more info on [topic]."

---

## 5. Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | App Router, SSR/SSG, file-based routing |
| TypeScript | 5.3+ | Type safety across the stack |
| Tailwind CSS | 3.3+ | Utility-first styling |
| shadcn/ui | Latest | Component library (customizable, accessible) |
| Zustand | 4.4+ | Client-side state management |
| Lucide React | Latest | Icon library (consistent, accessible) |

### API

| Technology | Version | Purpose |
|------------|---------|---------|
| Hono | Latest | Lightweight API framework |
| Zod | Latest | Runtime validation (shared with frontend) |

### Data (MVP)

| Technology | Purpose |
|------------|---------|
| Mock JSON files | Static data for all features |
| localStorage | User preferences, theme, Vinny chat history |
| Zustand persist | Client-side state persistence |

### Data (Future)

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| Drizzle ORM | Type-safe database access |
| Redis | Caching, session management |

### AI (MVP)

| Technology | Purpose |
|------------|---------|
| Mock JSON responses | Pattern-matched Vinny responses |

### AI (Future)

| Technology | Purpose |
|------------|---------|
| OpenAI GPT-4 | Vinny's brain |
| Vercel AI SDK | Streaming, prompt management |

### Monorepo & Tooling

| Technology | Purpose |
|------------|---------|
| Turborepo | Monorepo task orchestration |
| pnpm | Package management |
| Vitest | Unit & integration testing |
| React Testing Library | Component testing |
| Playwright | E2E testing |
| ESLint + Prettier | Code quality |

### Package Structure

```
vindicate-app/
├── packages/
│   ├── web/              # Next.js frontend (App Router)
│   │   ├── app/          # Routes
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities, mock data
│   │   ├── stores/       # Zustand stores
│   │   └── styles/       # Global styles, theme
│   ├── api/              # Hono API server (stubbed)
│   ├── shared/           # TypeScript types, validation schemas, constants
│   ├── cli/              # CLI tools (development utilities)
│   └── agents/           # Agent configurations
├── docs/
│   └── specs/            # This directory
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 6. Architecture

### MVP Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│                                              │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Zustand     │  │  Next.js App Router  │  │
│  │  Stores      │←→│  Pages & Components  │  │
│  └──────┬───────┘  └──────────┬───────────┘  │
│         │                      │              │
│  ┌──────▼───────┐  ┌──────────▼───────────┐  │
│  │  localStorage │  │  Mock Data Layer     │  │
│  │  (preferences)│  │  (JSON + hooks)      │  │
│  └───────────────┘  └─────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Single-user, no auth for MVP.** The app runs entirely in the browser. No login, no server-side data storage. This massively simplifies the MVP while still delivering full functionality.

2. **Mock data layer as a clean abstraction.** All data access goes through custom hooks (`useAccounts()`, `useBudget()`, etc.) that return mock data. When we add a real API, we only change the hook internals — components don't change.

3. **Shared types in `@vindicate/shared`.** All TypeScript types live in the shared package. Both web and api import from here. This ensures type consistency across the stack.

4. **Zustand for client state.** Lightweight, TypeScript-friendly, no boilerplate. Used for: theme preference, sidebar state, notification state, Vinny chat state, filter/sort preferences.

5. **shadcn/ui as component foundation.** Not a dependency — components are copied into the project and customized. This gives us full control over styling and behavior while starting from accessible, well-built primitives.

6. **App Router (not Pages Router).** Layouts, nested routes, loading states, and error boundaries built into the routing layer.

### Routing Structure

```
/                           → Dashboard
/accounts                   → Account List
/accounts/[id]              → Account Detail (tabbed)
/accounts/import            → Credit Report Import Wizard
/accounts/new               → Add Account Form
/activity                   → Activity Timeline
/activity/log               → Quick-Log Form
/cases                      → Case List
/cases/[id]                 → Case Detail
/budget                     → Budget & Financial Health
/alerts                     → Notification Center
/alerts/settings            → Alert Preferences
/resources                  → Resource Center
/resources/[slug]           → Resource Article/Template
/settings                   → User Preferences
```

### Data Flow

```
Mock JSON ──→ Data Hook ──→ Component ──→ UI
                 │
                 ├── useMockAccounts()
                 ├── useMockActivities()
                 ├── useMockCases()
                 ├── useMockBudget()
                 ├── useMockNotifications()
                 └── useMockVinnyResponses()
```

Each hook follows the same pattern:
```typescript
function useMockAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  
  // CRUD operations that modify local state
  const addAccount = (account: NewAccount) => { ... };
  const updateAccount = (id: string, updates: Partial<Account>) => { ... };
  const deleteAccount = (id: string) => { ... };
  
  return { accounts, addAccount, updateAccount, deleteAccount };
}
```

### Future Architecture (Post-MVP)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Next.js  │────→│  Hono    │────→│ Postgres │
│  Frontend │←────│  API     │←────│ + Redis  │
└──────────┘     └────┬─────┘     └──────────┘
                      │
                 ┌────▼─────┐
                 │  OpenAI  │
                 │  (Vinny) │
                 └──────────┘
```

Addition of:
- Authentication (NextAuth.js or Clerk)
- Real database (PostgreSQL via Drizzle)
- Real AI (OpenAI via Vercel AI SDK)
- File storage (S3/R2 for documents)
- Email notifications (Resend)
- Background jobs (Inngest or BullMQ)

---

## 7. Data Model

All types live in `packages/shared/src/types.ts`. The existing types (CaseSchema, FinancialSnapshotSchema, UserSchema) will be extended with the following:

### Account

```typescript
export interface Account {
  id: string;                          // UUID
  
  // Creditor Information
  creditorName: string;                // Original creditor name
  collectorName?: string;              // Current collection agency (if different)
  accountNumber?: string;              // Account/reference number
  creditorPhone?: string;
  creditorAddress?: string;
  creditorEmail?: string;
  
  // Financial Details
  originalBalance: number;             // Original debt amount
  currentBalance: number;              // Current amount owed
  interestRate?: number;               // Annual interest rate (if known)
  minimumPayment?: number;             // Minimum monthly payment
  
  // Status & Tracking
  status: AccountStatus;
  statusHistory: StatusChange[];        // Full status history
  dateOpened: string;                   // ISO date — when debt originated
  dateOfLastActivity: string;           // ISO date — last creditor/collector activity
  dateAddedToApp: string;              // ISO date — when user added this
  
  // Legal
  statuteOfLimitationsDate?: string;   // ISO date — SOL expiry
  statuteOfLimitationsState?: string;  // Which state's SOL applies
  
  // Organization
  category?: AccountCategory;
  tags?: string[];
  notes?: string;
  
  // Relations
  activityIds: string[];               // Linked activity IDs
  caseIds: string[];                   // Linked case IDs
  documentIds: string[];               // Linked document IDs
  paymentPlanId?: string;              // Active payment plan
  
  // Metadata
  importSource?: 'manual' | 'credit-report';
  creditBureaus?: CreditBureau[];      // Which bureaus report this
  
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
}

export type AccountStatus =
  | 'current'
  | 'late'
  | 'in-collections'
  | 'charged-off'
  | 'disputed'
  | 'payment-plan'
  | 'settled'
  | 'paid-in-full'
  | 'in-litigation'
  | 'bankrupt'
  | 'unknown';

export type AccountCategory =
  | 'credit-card'
  | 'medical'
  | 'student-loan'
  | 'auto-loan'
  | 'personal-loan'
  | 'utility'
  | 'rent'
  | 'tax'
  | 'other';

export type CreditBureau = 'equifax' | 'experian' | 'transunion';

export interface StatusChange {
  from: AccountStatus;
  to: AccountStatus;
  date: string;                        // ISO timestamp
  reason?: string;
}
```

### Activity

```typescript
export interface Activity {
  id: string;                          // UUID
  accountId: string;                   // Linked account
  
  type: ActivityType;
  direction?: 'inbound' | 'outbound';  // For calls/letters
  
  date: string;                        // ISO timestamp
  
  // Content
  title: string;                       // Short description
  notes?: string;                      // Detailed notes
  templateUsed?: string;              // If created from a template
  
  // Call-specific
  callerPhone?: string;
  callDuration?: number;               // Minutes
  
  // Payment-specific
  amount?: number;
  paymentMethod?: string;
  confirmationNumber?: string;
  
  // Harassment tracking (FDCPA)
  isHarassment?: boolean;
  harassmentDetails?: {
    timeOfCall?: string;               // "Before 8am" or "After 9pm"
    threatsOfViolence?: boolean;
    obsceneLanguage?: boolean;
    repeatedCalls?: boolean;
    calledWorkplace?: boolean;
    disclosedToThirdParty?: boolean;
    falseRepresentation?: boolean;
    otherViolation?: string;
  };
  
  // Documents
  documentIds: string[];
  
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'phone-call'
  | 'letter-received'
  | 'letter-sent'
  | 'email-received'
  | 'email-sent'
  | 'payment-made'
  | 'payment-received'
  | 'dispute-filed'
  | 'court-filing'
  | 'settlement-offer'
  | 'credit-report-update'
  | 'note'
  | 'other';
```

### Case

```typescript
export interface VindicateCase {
  id: string;                          // UUID
  accountId: string;                   // Linked account
  
  type: CaseType;
  status: VindicateCaseStatus;
  statusHistory: CaseStatusChange[];
  
  // Details
  title: string;
  description?: string;
  caseNumber?: string;                 // Court/bureau case number
  
  // For credit bureau disputes
  creditBureau?: CreditBureau;
  disputeReason?: string;
  
  // For lawsuits
  courtName?: string;
  courtAddress?: string;
  judgeName?: string;
  opposingCounsel?: string;
  
  // Key Dates
  dateFiled: string;                   // ISO date
  responseDeadline?: string;           // ISO date
  hearingDate?: string;                // ISO date
  resolutionDate?: string;             // ISO date
  
  // Outcome
  outcome?: CaseOutcome;
  outcomeDetails?: string;
  settlementAmount?: number;
  
  // Relations
  documentIds: string[];
  activityIds: string[];
  
  // Reminders
  reminders: CaseReminder[];
  
  createdAt: string;
  updatedAt: string;
}

export type CaseType =
  | 'credit-bureau-dispute'
  | 'debt-validation'
  | 'fdcpa-complaint'
  | 'lawsuit-defendant'
  | 'lawsuit-plaintiff'
  | 'arbitration'
  | 'cfpb-complaint'
  | 'other';

export type VindicateCaseStatus =
  | 'draft'
  | 'filed'
  | 'under-review'
  | 'response-received'
  | 'hearing-scheduled'
  | 'in-progress'
  | 'resolved'
  | 'escalated'
  | 'closed';

export type CaseOutcome =
  | 'won'
  | 'lost'
  | 'settled'
  | 'dismissed'
  | 'withdrawn'
  | 'pending';

export interface CaseStatusChange {
  from: VindicateCaseStatus;
  to: VindicateCaseStatus;
  date: string;
  notes?: string;
}

export interface CaseReminder {
  id: string;
  caseId: string;
  title: string;
  date: string;                        // ISO date
  isCompleted: boolean;
  notes?: string;
}
```

### Budget

```typescript
export interface Budget {
  id: string;
  month: string;                       // "2026-02" format
  
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  
  // Computed (but stored for historical)
  totalIncome: number;
  totalExpenses: number;
  availableForDebt: number;
  
  // Debt allocation
  debtPayments: DebtPayment[];
  repaymentStrategy: 'snowball' | 'avalanche' | 'custom';
  
  createdAt: string;
  updatedAt: string;
}

export interface IncomeEntry {
  id: string;
  source: string;                      // "Salary", "Side gig", "Benefits"
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'one-time';
  isRecurring: boolean;
}

export interface ExpenseEntry {
  id: string;
  category: ExpenseCategory;
  name: string;
  amount: number;
  isFixed: boolean;                    // Rent vs groceries
  isRecurring: boolean;
}

export type ExpenseCategory =
  | 'housing'
  | 'utilities'
  | 'food'
  | 'transportation'
  | 'healthcare'
  | 'insurance'
  | 'debt-payments'
  | 'personal'
  | 'education'
  | 'savings'
  | 'other';

export interface DebtPayment {
  accountId: string;
  allocatedAmount: number;
  isPaid: boolean;
  paidDate?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;                        // "Emergency Fund", "Settlement Fund"
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: string;
  createdAt: string;
}
```

### Credit Score

```typescript
export interface CreditScore {
  score: number;                       // 300-850
  rating: 'poor' | 'fair' | 'good' | 'very-good' | 'excellent';
  date: string;                        // ISO date
  source: string;                      // "Mock" for MVP
  
  factors: CreditFactor[];
  history: CreditScoreEntry[];
}

export interface CreditFactor {
  name: string;                        // "Payment History", "Credit Utilization"
  impact: 'high' | 'medium' | 'low';
  status: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface CreditScoreEntry {
  score: number;
  date: string;
}
```

### Notification

```typescript
export interface Notification {
  id: string;
  
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  title: string;
  message: string;
  
  // Navigation
  actionUrl?: string;                  // Where clicking takes you
  actionLabel?: string;                // "View Account", "Review Case"
  
  // Relations
  accountId?: string;
  caseId?: string;
  
  // State
  isRead: boolean;
  isDismissed: boolean;
  
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export type NotificationType =
  | 'deadline-approaching'
  | 'payment-due'
  | 'credit-score-change'
  | 'account-status-change'
  | 'budget-alert'
  | 'milestone-reached'
  | 'vinny-tip'
  | 'system';
```

### User Profile

```typescript
export interface UserProfile {
  id: string;
  
  // Personal (optional in MVP)
  firstName?: string;
  lastName?: string;
  email?: string;
  state?: string;                      // For SOL calculations
  
  // Preferences
  theme: 'light' | 'dark' | 'system';
  notificationPreferences: NotificationPreferences;
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  onboardingStep?: number;
  
  // Stats (computed)
  memberSince: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  deadlines: boolean;
  payments: boolean;
  creditScore: boolean;
  accountActivity: boolean;
  budgetAlerts: boolean;
  milestones: boolean;
  vinnyTips: boolean;
}
```

### Document

```typescript
export interface Document {
  id: string;
  
  name: string;
  type: DocumentType;
  mimeType: string;
  size: number;                        // bytes
  
  // In MVP, this is a mock URL or data URI
  url: string;
  thumbnailUrl?: string;
  
  // Relations
  accountId?: string;
  caseId?: string;
  activityId?: string;
  
  // Metadata
  uploadedAt: string;
  description?: string;
  tags?: string[];
}

export type DocumentType =
  | 'validation-letter'
  | 'dispute-letter'
  | 'court-document'
  | 'payment-receipt'
  | 'credit-report'
  | 'correspondence'
  | 'settlement-agreement'
  | 'other';
```

### Vinny (AI Companion)

```typescript
export interface VinnyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  
  // Quick replies offered after this message
  suggestedReplies?: string[];
  
  // If Vinny references a resource
  resourceLink?: {
    title: string;
    url: string;
  };
}

export interface VinnySession {
  id: string;
  messages: VinnyMessage[];
  startedAt: string;
  lastMessageAt: string;
}

export interface VinnyMockResponse {
  keywords: string[];                  // Trigger keywords
  category: string;                    // "rights", "credit", "dispute", "encouragement"
  response: string;
  suggestedReplies?: string[];
  resourceLink?: {
    title: string;
    url: string;
  };
}
```

---

## 8. Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100ms |
| Bundle size (initial) | < 200KB gzipped |

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigable (all interactive elements)
- Screen reader tested (VoiceOver, NVDA)
- Color contrast ratios met (4.5:1 text, 3:1 UI)
- Focus indicators visible
- `prefers-reduced-motion` respected
- `prefers-color-scheme` detected
- Semantic HTML throughout
- ARIA labels on all interactive elements
- Skip-to-content link

### Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Safari | Last 2 versions (incl. iOS) |
| Firefox | Last 2 versions |
| Edge | Last 2 versions |
| Samsung Internet | Last 2 versions |

### Security (MVP)

- No PII transmitted to any server (all client-side)
- No analytics or tracking
- CSP headers configured
- No external resource loading (fonts self-hosted)

### Security (Future)

- End-to-end encryption for stored data
- SOC 2 Type II compliance path
- HIPAA awareness (medical debt)
- Data export/deletion (GDPR/CCPA)

---

## 9. Future Roadmap

### Post-MVP (v1.1)
- [ ] User authentication (multi-device sync)
- [ ] Real database (PostgreSQL)
- [ ] Real AI (OpenAI integration for Vinny)
- [ ] Document OCR (extract data from uploaded documents)
- [ ] Email notifications (Resend)

### v1.2
- [ ] Credit report API integration (real imports)
- [ ] Payment processing (pay debts through app)
- [ ] Multi-user support (family accounts)
- [ ] Mobile app (React Native or PWA)

### v2.0
- [ ] Attorney marketplace (connect with consumer rights attorneys)
- [ ] Community features (anonymous success stories, tips)
- [ ] Automated letter generation with AI
- [ ] Court document templates
- [ ] Integration with CFPB complaint system
- [ ] Credit score simulator ("what if I pay off this account?")

---

*This specification is a living document. It will be updated as we learn from user research and development progress.*
