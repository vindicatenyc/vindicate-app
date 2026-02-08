# Vindicate NYC — Task Breakdown

> **Version:** 1.0.0  
> **Last Updated:** 2026-02-08  
> **Status:** Draft — MVP Planning  
> **Reference:** [PRODUCT-SPEC.md](./PRODUCT-SPEC.md) · [AGENT-PERSONAS.md](./AGENT-PERSONAS.md)

---

## Overview

**35 tasks** across **7 phases**. Each task is scoped to < 4 hours of focused work.  
All tasks target `packages/web/` unless otherwise noted.

### Dependency Legend

- `→` means "depends on"
- Tasks within a phase can often be parallelized
- Phases are sequential (Phase 2 depends on Phase 1, etc.)

### Tech Stack Reference

- Next.js 14+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui
- Zustand (state) · Lucide React (icons) · Mock JSON data
- Vitest + React Testing Library (testing)

---

## Phase 1: Foundation & Design System

> **Goal:** Project scaffolding, theme system, layout, shared components, mock data, and routing.  
> **Total estimated time:** 16–20 hours

---

### Task 1.1: Configure shadcn/ui + Tailwind + Dark/Light Theme

**Scope:** Initialize shadcn/ui in the web package, configure Tailwind with the Vindicate color palette (sage greens, warm grays, gentle blues), and implement dark/light mode toggle with system preference detection.

**Deliverables:**
- `packages/web/components.json` — shadcn/ui config
- `packages/web/tailwind.config.ts` — updated with custom palette
- `packages/web/src/styles/globals.css` — CSS variables for light/dark themes
- `packages/web/src/components/ui/` — base shadcn components (button, card, input, badge, etc.)
- `packages/web/src/components/theme-provider.tsx` — next-themes provider
- `packages/web/src/components/theme-toggle.tsx` — dark/light mode toggle button

**Acceptance Criteria:**
- [ ] shadcn/ui initialized and working
- [ ] Vindicate color palette applied (per PRODUCT-SPEC.md Color Palette section)
- [ ] Dark mode toggle works with system preference detection
- [ ] Theme persists in localStorage
- [ ] Base shadcn components installed: Button, Card, Input, Badge, Select, Dialog, Sheet, Tabs, Tooltip, Dropdown Menu, Separator, ScrollArea
- [ ] Tailwind config uses CSS variables for theme colors

**Est. Time:** 3 hours  
**Dependencies:** None  
**Commit:** `feat(web): configure shadcn/ui, tailwind theme, and dark/light mode`

---

### Task 1.2: Design Tokens — Typography, Spacing, Shadows

**Scope:** Establish design tokens for typography (Inter font), spacing scale, shadows, border radii, and animation timing. Create a tokens reference file.

**Deliverables:**
- `packages/web/src/styles/fonts.ts` — Inter font setup via next/font
- `packages/web/tailwind.config.ts` — extended with custom spacing, shadows, border-radius, font sizes
- `packages/web/src/styles/tokens.ts` — exported design token constants
- `packages/web/src/app/layout.tsx` — updated with font provider

**Acceptance Criteria:**
- [ ] Inter font loaded via next/font (variable weight)
- [ ] Typography scale matches spec (H1: 28px, H2: 22px, H3: 18px, Body: 16px, Small: 14px, Caption: 12px)
- [ ] Custom spacing tokens defined
- [ ] Shadow tokens for card elevation, modals, dropdowns
- [ ] Border radius tokens (sm, md, lg, full)
- [ ] Transition/animation duration tokens

**Est. Time:** 2 hours  
**Dependencies:** 1.1  
**Commit:** `feat(web): add design tokens for typography, spacing, and shadows`

---

### Task 1.3: Core Layout — AppShell, Sidebar, Header, MobileNav

**Scope:** Build the main application shell with responsive navigation: sidebar on desktop (≥1024px), bottom navigation bar on mobile (<1024px), top header with search and notifications.

**Deliverables:**
- `packages/web/src/components/layout/app-shell.tsx` — root layout wrapper
- `packages/web/src/components/layout/sidebar.tsx` — desktop sidebar with nav items, logo, collapse toggle
- `packages/web/src/components/layout/header.tsx` — top bar with search, notifications bell, theme toggle, Vinny button
- `packages/web/src/components/layout/mobile-nav.tsx` — bottom tab bar for mobile
- `packages/web/src/components/layout/nav-items.ts` — shared navigation config (icon, label, href)
- `packages/web/src/app/layout.tsx` — updated to use AppShell

**Acceptance Criteria:**
- [ ] Sidebar visible on desktop (≥1024px) with nav items: Dashboard, Accounts, Activity, Cases, Budget, Alerts, Resources
- [ ] Sidebar is collapsible to icons-only mode
- [ ] Bottom nav on mobile (<1024px) with 5 primary nav items
- [ ] Header shows on all screen sizes with: app logo, search (placeholder), notification bell, theme toggle
- [ ] Active route highlighted in nav
- [ ] Smooth transition between breakpoints
- [ ] Minimum 44x44px touch targets on mobile
- [ ] Semantic HTML and ARIA landmarks (nav, main, aside)

**Est. Time:** 4 hours  
**Dependencies:** 1.1, 1.2  
**Commit:** `feat(web): add responsive app shell with sidebar, header, and mobile nav`

---

### Task 1.4: Shared UI Components

**Scope:** Build reusable UI components used across multiple features.

**Deliverables:**
- `packages/web/src/components/ui/status-badge.tsx` — colored badges for account/case statuses
- `packages/web/src/components/ui/stat-card.tsx` — dashboard stat card (icon, label, value, trend)
- `packages/web/src/components/ui/progress-bar.tsx` — animated progress bar with label
- `packages/web/src/components/ui/progress-ring.tsx` — circular progress indicator
- `packages/web/src/components/ui/timeline.tsx` — vertical timeline component
- `packages/web/src/components/ui/empty-state.tsx` — illustrated empty state with CTA
- `packages/web/src/components/ui/page-header.tsx` — consistent page title + description + actions
- `packages/web/src/components/ui/countdown-badge.tsx` — deadline countdown display

**Acceptance Criteria:**
- [ ] StatusBadge supports all AccountStatus and CaseStatus values with appropriate colors
- [ ] StatCard shows icon, label, value, optional trend indicator (up/down/neutral)
- [ ] ProgressBar supports value, max, label, color variants, and animation
- [ ] ProgressRing is SVG-based, supports percentage, customizable size/color
- [ ] Timeline renders chronological entries with icons, dates, and content slots
- [ ] EmptyState has illustration slot, title, description, and action button
- [ ] All components have TypeScript props interfaces and JSDoc
- [ ] All components support dark/light mode
- [ ] All components meet WCAG 2.1 AA contrast requirements

**Est. Time:** 4 hours  
**Dependencies:** 1.1, 1.2  
**Commit:** `feat(web): add shared UI components (StatusBadge, StatCard, Timeline, etc.)`

---

### Task 1.5: Mock Data Layer + Custom Hooks

**Scope:** Create realistic mock data for all features and custom hooks that abstract data access. The mock data should tell a coherent story (using "Maria" persona from the product spec).

**Deliverables:**
- `packages/shared/src/types.ts` — all TypeScript types from PRODUCT-SPEC.md data model section
- `packages/shared/src/constants.ts` — status labels, category labels, colors
- `packages/web/src/lib/mock-data/accounts.ts` — 6-8 realistic accounts
- `packages/web/src/lib/mock-data/activities.ts` — 15-20 activities across accounts
- `packages/web/src/lib/mock-data/cases.ts` — 2-3 active cases
- `packages/web/src/lib/mock-data/budget.ts` — 2-3 months of budget data
- `packages/web/src/lib/mock-data/notifications.ts` — 8-10 notifications
- `packages/web/src/lib/mock-data/credit-score.ts` — mocked score history
- `packages/web/src/lib/mock-data/vinny-responses.ts` — 30+ mock AI responses
- `packages/web/src/lib/mock-data/resources.ts` — resource center content
- `packages/web/src/lib/mock-data/index.ts` — barrel export
- `packages/web/src/hooks/use-accounts.ts` — CRUD hook for accounts
- `packages/web/src/hooks/use-activities.ts` — CRUD hook for activities
- `packages/web/src/hooks/use-cases.ts` — CRUD hook for cases
- `packages/web/src/hooks/use-budget.ts` — budget data hook
- `packages/web/src/hooks/use-notifications.ts` — notification state hook
- `packages/web/src/hooks/use-credit-score.ts` — credit score hook
- `packages/web/src/stores/app-store.ts` — Zustand store for global app state

**Acceptance Criteria:**
- [ ] All shared types match the PRODUCT-SPEC.md data model exactly
- [ ] Mock data is realistic — real NYC-area creditors, plausible amounts, coherent timeline
- [ ] Mock data tells Maria's story: 6 accounts totaling ~$23K, mixed statuses
- [ ] All hooks return typed data and provide CRUD operations
- [ ] Hooks use Zustand under the hood with persist middleware
- [ ] Adding/editing/deleting data updates state immediately
- [ ] Mock Vinny responses cover: rights, credit, disputes, encouragement, budgeting, general

**Est. Time:** 4 hours  
**Dependencies:** 1.1  
**Commit:** `feat: add shared types, mock data layer, and data hooks`

---

### Task 1.6: Routing Structure — All Pages as Shells

**Scope:** Create all route files with placeholder content so the entire app is navigable.

**Deliverables:**
- `packages/web/src/app/page.tsx` — Dashboard
- `packages/web/src/app/accounts/page.tsx` — Account List
- `packages/web/src/app/accounts/[id]/page.tsx` — Account Detail
- `packages/web/src/app/accounts/import/page.tsx` — Credit Report Import
- `packages/web/src/app/accounts/new/page.tsx` — Add Account
- `packages/web/src/app/activity/page.tsx` — Activity Timeline
- `packages/web/src/app/activity/log/page.tsx` — Quick-Log Form
- `packages/web/src/app/cases/page.tsx` — Case List
- `packages/web/src/app/cases/[id]/page.tsx` — Case Detail
- `packages/web/src/app/budget/page.tsx` — Budget & Financial Health
- `packages/web/src/app/alerts/page.tsx` — Notification Center
- `packages/web/src/app/alerts/settings/page.tsx` — Alert Preferences
- `packages/web/src/app/resources/page.tsx` — Resource Center
- `packages/web/src/app/resources/[slug]/page.tsx` — Resource Article
- `packages/web/src/app/settings/page.tsx` — User Preferences
- `packages/web/src/app/(routes)/layout.tsx` — shared route group layout (if needed)

**Acceptance Criteria:**
- [ ] All 15 routes accessible and rendering placeholder content
- [ ] Each page shows its title via PageHeader component
- [ ] Navigation highlights the active route
- [ ] Back navigation works correctly on detail pages
- [ ] Loading states defined (loading.tsx files)
- [ ] Error boundaries defined (error.tsx files)
- [ ] No 404s when navigating between routes

**Est. Time:** 2 hours  
**Dependencies:** 1.3, 1.4  
**Commit:** `feat(web): scaffold all routes with placeholder pages`

---

## Phase 2: Dashboard

> **Goal:** Build the main dashboard — the first thing users see.  
> **Total estimated time:** 10–12 hours

---

### Task 2.1: Financial Health Summary Cards

**Scope:** Build the 4 stat cards at the top of the dashboard: Total Debt, Active Accounts, Open Disputes, Credit Score.

**Deliverables:**
- `packages/web/src/components/dashboard/financial-health-cards.tsx` — grid of 4 StatCards
- Uses `useAccounts()` and `useCreditScore()` hooks for data

**Acceptance Criteria:**
- [ ] 4 cards in a responsive grid (1 col mobile, 2 col tablet, 4 col desktop)
- [ ] Total Debt shows sum of all account balances, formatted as currency
- [ ] Active Accounts shows count of non-settled accounts
- [ ] Open Disputes shows count of accounts with status 'disputed'
- [ ] Credit Score shows current mocked score with rating badge
- [ ] Each card has an appropriate icon (Lucide)
- [ ] Cards support dark/light mode

**Est. Time:** 2 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add financial health summary cards to dashboard`

---

### Task 2.2: Recent Activity Feed

**Scope:** Build a feed showing the last 5-10 activities across all accounts with relative timestamps.

**Deliverables:**
- `packages/web/src/components/dashboard/recent-activity.tsx` — activity feed component
- `packages/web/src/lib/utils/format-date.ts` — relative date formatter ("2 hours ago", "yesterday")

**Acceptance Criteria:**
- [ ] Shows last 10 activities sorted by date, most recent first
- [ ] Each entry shows: icon (by type), title, account name, relative timestamp
- [ ] Clicking an entry navigates to the account detail page
- [ ] "View all" link navigates to /activity
- [ ] Empty state when no activities exist
- [ ] Responsive — full width on mobile, card on desktop

**Est. Time:** 2 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add recent activity feed to dashboard`

---

### Task 2.3: Quick Action Buttons

**Scope:** Floating action menu with shortcuts: Log Activity, Add Account, Ask Vinny.

**Deliverables:**
- `packages/web/src/components/dashboard/quick-actions.tsx` — action button group (or FAB with expandable menu)

**Acceptance Criteria:**
- [ ] Desktop: horizontal button group in the dashboard
- [ ] Mobile: Floating Action Button (FAB) in bottom-right, expands to show options
- [ ] 3 actions: "Log Activity" → /activity/log, "Add Account" → /accounts/new, "Ask Vinny" → opens chat
- [ ] Each action has icon + label
- [ ] FAB animation on expand/collapse
- [ ] Doesn't overlap with mobile bottom nav

**Est. Time:** 2 hours  
**Dependencies:** 1.3, 1.4  
**Commit:** `feat(web): add quick action buttons to dashboard`

---

### Task 2.4: AI Companion Greeting Widget

**Scope:** A greeting card from Vinny on the dashboard with a contextual tip based on the user's data.

**Deliverables:**
- `packages/web/src/components/dashboard/vinny-greeting.tsx` — greeting card component
- `packages/web/src/lib/vinny/greeting-generator.ts` — picks contextual tip based on account data

**Acceptance Criteria:**
- [ ] Shows time-of-day greeting ("Good morning!", "Good afternoon!", etc.)
- [ ] Displays Vinny's avatar/icon (soft purple accent color)
- [ ] Shows one contextual tip (e.g., "You have a payment due Thursday" or "Great job settling that account!")
- [ ] "Chat with Vinny" button opens the chat panel
- [ ] Dismissible for the session
- [ ] Warm, encouraging tone

**Est. Time:** 2 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add Vinny greeting widget to dashboard`

---

### Task 2.5: Dashboard Layout Composition

**Scope:** Wire all dashboard components together into a responsive layout.

**Deliverables:**
- `packages/web/src/app/page.tsx` — composed dashboard page
- `packages/web/src/components/dashboard/debt-progress-ring.tsx` — circular debt payoff progress

**Acceptance Criteria:**
- [ ] Layout: Greeting → Health Cards → Progress Ring + Activity Feed (side by side on desktop) → Quick Actions
- [ ] Responsive: single column on mobile, multi-column on desktop
- [ ] Debt Progress Ring shows % of original total debt paid off
- [ ] All components load from hooks (no hardcoded data)
- [ ] Page looks good empty (first-time user with no data)
- [ ] Smooth scrolling on mobile

**Est. Time:** 2 hours  
**Dependencies:** 2.1, 2.2, 2.3, 2.4  
**Commit:** `feat(web): compose dashboard layout with all components`

---

## Phase 3: Accounts

> **Goal:** Build the full account management experience — list, detail, import, CRUD.  
> **Total estimated time:** 18–22 hours

---

### Task 3.1: Account List View

**Scope:** Card-based account list with search, filters, and sorting.

**Deliverables:**
- `packages/web/src/components/accounts/account-list.tsx` — main list component
- `packages/web/src/components/accounts/account-card.tsx` — individual account card
- `packages/web/src/components/accounts/account-filters.tsx` — filter bar (status, category, amount range)
- `packages/web/src/components/accounts/account-sort.tsx` — sort dropdown
- `packages/web/src/app/accounts/page.tsx` — composed page

**Acceptance Criteria:**
- [ ] Card-based layout (not table) showing: creditor name, balance, original amount, status badge, last activity, category icon
- [ ] Search by creditor name (client-side filter)
- [ ] Filter by: status (multi-select), category (multi-select)
- [ ] Sort by: balance (high/low), date added, last activity, status
- [ ] Click card → navigate to /accounts/[id]
- [ ] Empty state with "Add your first account" CTA
- [ ] "Import from Credit Report" and "Add Account" buttons in header
- [ ] Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)

**Est. Time:** 4 hours  
**Dependencies:** 1.4, 1.5, 1.6  
**Commit:** `feat(web): add account list view with search, filters, and sorting`

---

### Task 3.2: Account Detail — Overview Tab

**Scope:** The main overview section of an account detail page.

**Deliverables:**
- `packages/web/src/app/accounts/[id]/page.tsx` — account detail page with tab navigation
- `packages/web/src/components/accounts/detail/account-overview.tsx` — overview content
- `packages/web/src/components/accounts/detail/account-header.tsx` — detail page header with back button, name, status
- `packages/web/src/components/accounts/detail/status-timeline.tsx` — visual status change history

**Acceptance Criteria:**
- [ ] Header with: back button, creditor name, current status badge, edit button
- [ ] Tab navigation: Overview, Activity, Documents, Payment Plan, Notes
- [ ] Overview shows: creditor info (name, phone, address, account #), financial details (original balance, current balance, interest rate), dates (opened, last activity), collector info, SOL countdown
- [ ] Status timeline showing all status changes chronologically
- [ ] SOL countdown with color-coded urgency (green/amber/red)
- [ ] All data from useAccounts() hook
- [ ] 404 handling for invalid account ID

**Est. Time:** 4 hours  
**Dependencies:** 1.4, 1.5, 1.6  
**Commit:** `feat(web): add account detail page with overview tab`

---

### Task 3.3: Account Detail — Activity Log Tab

**Scope:** Activity history for a specific account within the account detail view.

**Deliverables:**
- `packages/web/src/components/accounts/detail/account-activity-tab.tsx` — activity log tab content

**Acceptance Criteria:**
- [ ] Shows activities filtered to current account
- [ ] Uses Timeline component
- [ ] Each entry shows: type icon, title, date, notes preview
- [ ] Expandable entries for full notes
- [ ] "Log Activity" button links to /activity/log with account pre-selected
- [ ] Sorted newest first
- [ ] Empty state: "No activity logged yet"

**Est. Time:** 2 hours  
**Dependencies:** 3.2, 1.4  
**Commit:** `feat(web): add activity log tab to account detail`

---

### Task 3.4: Account Detail — Documents Tab

**Scope:** Document management for an account.

**Deliverables:**
- `packages/web/src/components/accounts/detail/account-documents-tab.tsx` — documents tab content
- `packages/web/src/components/ui/document-card.tsx` — document display card

**Acceptance Criteria:**
- [ ] Grid of document cards showing: name, type badge, upload date, file size
- [ ] Document type filter (validation letter, dispute, court doc, etc.)
- [ ] "Upload Document" button (mock — opens file picker, adds to mock state)
- [ ] Click to "preview" (mock — shows document info modal)
- [ ] Empty state: "No documents uploaded"
- [ ] Responsive grid

**Est. Time:** 2 hours  
**Dependencies:** 3.2  
**Commit:** `feat(web): add documents tab to account detail`

---

### Task 3.5: Account Detail — Payment Plan Tab

**Scope:** Payment plan details and schedule for accounts with active plans.

**Deliverables:**
- `packages/web/src/components/accounts/detail/account-payment-tab.tsx` — payment plan tab

**Acceptance Criteria:**
- [ ] Shows: monthly payment amount, total remaining, payments made, next due date
- [ ] Progress bar showing % of plan completed
- [ ] Payment schedule list with checkboxes (paid/unpaid)
- [ ] "No payment plan" state with "Set Up Plan" CTA (mock form)
- [ ] Countdown to next payment date

**Est. Time:** 2 hours  
**Dependencies:** 3.2  
**Commit:** `feat(web): add payment plan tab to account detail`

---

### Task 3.6: Credit Report Import Wizard (Mocked)

**Scope:** 3-step wizard for importing accounts from a credit report. Fully mocked — always produces the same mock accounts.

**Deliverables:**
- `packages/web/src/app/accounts/import/page.tsx` — import wizard page
- `packages/web/src/components/accounts/import/step-upload.tsx` — step 1: file upload
- `packages/web/src/components/accounts/import/step-review.tsx` — step 2: review found accounts
- `packages/web/src/components/accounts/import/step-confirm.tsx` — step 3: confirm import
- `packages/web/src/components/ui/wizard-stepper.tsx` — reusable step indicator

**Acceptance Criteria:**
- [ ] Step 1: File upload area (drag-and-drop + click), accepts PDF. Mocked "processing" animation.
- [ ] Step 2: "We found X accounts" — list with checkboxes to select which to import
- [ ] Step 3: Confirmation summary + "Import" button
- [ ] Stepper component shows current step with progress
- [ ] Back/Next navigation between steps
- [ ] On confirm, adds selected mock accounts to state and redirects to /accounts
- [ ] Success toast/notification

**Est. Time:** 3 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add mocked credit report import wizard`

---

### Task 3.7: Add/Edit Account Form

**Scope:** Form for manually adding or editing an account.

**Deliverables:**
- `packages/web/src/app/accounts/new/page.tsx` — add account page
- `packages/web/src/components/accounts/account-form.tsx` — reusable form (add + edit mode)

**Acceptance Criteria:**
- [ ] Fields: creditor name (required), account number, original balance (required), current balance (required), status dropdown, category dropdown, collector name, creditor phone, creditor address, notes
- [ ] Client-side validation with helpful error messages
- [ ] Works for both "add new" and "edit existing" (pre-populated)
- [ ] Submit adds/updates account in state
- [ ] Cancel navigates back
- [ ] Success toast on save
- [ ] Responsive form layout

**Est. Time:** 3 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add account create/edit form`

---

## Phase 4: Activity & Case Management

> **Goal:** Activity logging, timeline view, and case tracking with deadlines.  
> **Total estimated time:** 12–14 hours

---

### Task 4.1: Activity Logger — Quick-Log Form

**Scope:** Form for quickly logging interactions with creditors/collectors.

**Deliverables:**
- `packages/web/src/app/activity/log/page.tsx` — quick-log page
- `packages/web/src/components/activity/activity-form.tsx` — log form
- `packages/web/src/components/activity/harassment-checklist.tsx` — FDCPA violation checklist

**Acceptance Criteria:**
- [ ] Type selector with icons: Phone Call, Letter Received/Sent, Email, Payment, Dispute Filed, Court Filing, Other
- [ ] Direction toggle for calls/letters (inbound/outbound)
- [ ] Account dropdown (required) — pre-selected if coming from account detail
- [ ] Date/time picker, defaults to now
- [ ] Notes textarea with template suggestions
- [ ] "Flag as Harassment" toggle that expands FDCPA checklist (time of call, threats, etc.)
- [ ] Document attachment button (mock)
- [ ] Submit adds to activities and navigates back
- [ ] Templates: pre-fill notes for common activities

**Est. Time:** 3 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add activity quick-log form with harassment tracking`

---

### Task 4.2: Activity Timeline View

**Scope:** Full activity timeline across all accounts with filters.

**Deliverables:**
- `packages/web/src/app/activity/page.tsx` — activity timeline page
- `packages/web/src/components/activity/activity-timeline.tsx` — filtered timeline

**Acceptance Criteria:**
- [ ] Visual timeline using Timeline component
- [ ] Filter by: account (dropdown), activity type (multi-select), date range
- [ ] Each entry: type icon, title, account name badge, date, expandable notes
- [ ] "Log Activity" button in page header
- [ ] Sorted newest first
- [ ] Click account badge → navigate to account detail
- [ ] Empty state
- [ ] Responsive

**Est. Time:** 2 hours  
**Dependencies:** 1.4, 1.5, 4.1  
**Commit:** `feat(web): add activity timeline view with filters`

---

### Task 4.3: Case Tracker — Status Timeline

**Scope:** Case list and detail view with visual status progression.

**Deliverables:**
- `packages/web/src/app/cases/page.tsx` — case list
- `packages/web/src/app/cases/[id]/page.tsx` — case detail
- `packages/web/src/components/cases/case-card.tsx` — case list card
- `packages/web/src/components/cases/case-status-timeline.tsx` — horizontal status progression

**Acceptance Criteria:**
- [ ] Case list with cards showing: title, type, status badge, linked account, key dates
- [ ] Case detail with: header, horizontal status stepper (Draft → Filed → Under Review → Response → Resolved), case info, linked account
- [ ] Status stepper shows current stage highlighted, completed stages checked
- [ ] Filter cases by type, status
- [ ] "New Case" button
- [ ] Empty state
- [ ] Link to associated account

**Est. Time:** 3 hours  
**Dependencies:** 1.4, 1.5, 1.6  
**Commit:** `feat(web): add case tracker with status timeline`

---

### Task 4.4: Case Tracker — Deadlines & Reminders

**Scope:** Deadline management with color-coded urgency and reminder system.

**Deliverables:**
- `packages/web/src/components/cases/case-deadlines.tsx` — deadline list in case detail
- `packages/web/src/components/cases/case-reminder-form.tsx` — add/edit reminder
- `packages/web/src/components/ui/urgency-indicator.tsx` — color-coded countdown

**Acceptance Criteria:**
- [ ] Deadline list sorted by date (soonest first)
- [ ] Color-coded urgency: green (>14 days), amber (7-14 days), red (<7 days), pulsing red (overdue)
- [ ] Add reminder form: title, date, notes
- [ ] Mark reminder as completed (checkbox)
- [ ] Reminders appear in notification center
- [ ] Countdown display: "12 days", "3 days", "Overdue by 2 days"

**Est. Time:** 2 hours  
**Dependencies:** 4.3  
**Commit:** `feat(web): add deadline management with urgency indicators`

---

### Task 4.5: Document Upload Component (Mock)

**Scope:** Reusable document upload component used across accounts and cases.

**Deliverables:**
- `packages/web/src/components/documents/document-upload.tsx` — upload component (drag-and-drop zone)
- `packages/web/src/components/documents/document-list.tsx` — document list with type filters
- `packages/web/src/hooks/use-documents.ts` — document state hook

**Acceptance Criteria:**
- [ ] Drag-and-drop upload zone with click fallback
- [ ] File type icons based on mime type
- [ ] "Upload" adds mock document entry to state (no real upload)
- [ ] Document list with filter by type
- [ ] Delete document (with confirmation)
- [ ] Shows file name, type badge, size, date
- [ ] Accessible: keyboard-operable, screen reader labels

**Est. Time:** 2 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add document upload and management components`

---

## Phase 5: Budget & Financial Health

> **Goal:** Budgeting tools, debt repayment visualization, and credit score tracking.  
> **Total estimated time:** 12–14 hours

---

### Task 5.1: Monthly Budget Overview

**Scope:** Income and expense entry with visual summary.

**Deliverables:**
- `packages/web/src/app/budget/page.tsx` — budget page (composed)
- `packages/web/src/components/budget/budget-overview.tsx` — monthly summary
- `packages/web/src/components/budget/income-section.tsx` — income entries
- `packages/web/src/components/budget/expense-section.tsx` — expense entries by category
- `packages/web/src/components/budget/budget-bar.tsx` — income vs expenses bar

**Acceptance Criteria:**
- [ ] Month selector (current month default)
- [ ] Income section: list of sources with amounts, add/edit/delete
- [ ] Expense section: categorized list with amounts, add/edit/delete
- [ ] Visual bar: income vs total expenses, "Available for debt" callout
- [ ] Summary: total income, total expenses, net (surplus/deficit)
- [ ] Color indication: green if surplus, red if deficit
- [ ] Category icons for expenses (Lucide)

**Est. Time:** 3 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add monthly budget overview with income/expense tracking`

---

### Task 5.2: Income vs Expenses Charts

**Scope:** Simple visual charts for budget data. Use a lightweight chart approach (CSS-based or a small library).

**Deliverables:**
- `packages/web/src/components/budget/spending-chart.tsx` — donut or bar chart of expenses by category
- `packages/web/src/components/budget/trend-chart.tsx` — monthly income vs expenses line/bar comparison

**Acceptance Criteria:**
- [ ] Expense breakdown by category (donut or horizontal bar chart)
- [ ] Monthly trend comparison (last 3 months)
- [ ] Responsive sizing
- [ ] Color-coded categories matching design system
- [ ] Accessible: chart data available as text/table for screen readers
- [ ] No heavy chart library (use Recharts or CSS-based)

**Est. Time:** 3 hours  
**Dependencies:** 5.1  
**Commit:** `feat(web): add budget charts for spending breakdown and trends`

---

### Task 5.3: Debt Repayment Tracker

**Scope:** Snowball and avalanche debt payoff views with progress visualization.

**Deliverables:**
- `packages/web/src/components/budget/debt-tracker.tsx` — main debt tracker component
- `packages/web/src/components/budget/debt-strategy-toggle.tsx` — snowball/avalanche toggle
- `packages/web/src/components/budget/debt-account-row.tsx` — individual account in repayment view
- `packages/web/src/lib/utils/debt-calculator.ts` — snowball/avalanche ordering + payoff math

**Acceptance Criteria:**
- [ ] Toggle between snowball (smallest balance first) and avalanche (highest interest first)
- [ ] Sorted list of accounts with: name, balance, interest rate, minimum payment, progress bar
- [ ] Highlight "focus" account (the one to pay extra on)
- [ ] Summary: "Estimated payoff in X months" for each strategy
- [ ] Total interest comparison between strategies
- [ ] Allocated monthly debt payment amount (from budget)
- [ ] Visual progress: stacked bar or meter showing total debt reduction

**Est. Time:** 3 hours  
**Dependencies:** 1.5, 5.1  
**Commit:** `feat(web): add debt repayment tracker with snowball/avalanche strategies`

---

### Task 5.4: Credit Score Widget (Mocked)

**Scope:** Credit score display with trend and factors.

**Deliverables:**
- `packages/web/src/components/budget/credit-score-card.tsx` — score display with gauge
- `packages/web/src/components/budget/credit-factors.tsx` — factors affecting score
- `packages/web/src/components/budget/score-trend.tsx` — 6-month trend line

**Acceptance Criteria:**
- [ ] Score gauge/meter (580 example, "Fair" rating)
- [ ] Color-coded: red (300-579), orange (580-669), yellow (670-739), green (740-799), dark green (800-850)
- [ ] 6-month trend line showing gradual improvement (mocked)
- [ ] Factors list: Payment History (negative), Credit Utilization (negative), Credit Age (positive), etc.
- [ ] Each factor shows impact level (high/medium/low) and positive/negative indicator
- [ ] "This is a simulated score" disclaimer

**Est. Time:** 2 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add mocked credit score widget with trends and factors`

---

### Task 5.5: Savings Goals

**Scope:** Simple savings goal tracker (emergency fund, settlement fund).

**Deliverables:**
- `packages/web/src/components/budget/savings-goals.tsx` — savings goals section
- `packages/web/src/components/budget/savings-goal-card.tsx` — individual goal card
- `packages/web/src/components/budget/savings-goal-form.tsx` — add/edit goal

**Acceptance Criteria:**
- [ ] Card per goal: name, target amount, current amount, progress bar, monthly contribution
- [ ] 2 default goals in mock data: "Emergency Fund" ($1,000 target), "Settlement Fund" ($5,000 target)
- [ ] Add new goal form (name, target, monthly contribution)
- [ ] Edit/delete existing goals
- [ ] Celebrate when goal is reached (visual indicator)
- [ ] "Target date" calculation based on monthly contribution

**Est. Time:** 2 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add savings goal tracker`

---

## Phase 6: Alerts, Resources & AI

> **Goal:** Notification system, educational resources, and the Vinny AI companion.  
> **Total estimated time:** 14–16 hours

---

### Task 6.1: Notification Center

**Scope:** Bell icon in header with notification dropdown/panel.

**Deliverables:**
- `packages/web/src/components/notifications/notification-bell.tsx` — header bell with unread count
- `packages/web/src/components/notifications/notification-panel.tsx` — dropdown notification list
- `packages/web/src/components/notifications/notification-item.tsx` — individual notification
- Update `packages/web/src/components/layout/header.tsx` — integrate bell

**Acceptance Criteria:**
- [ ] Bell icon shows unread count badge (red dot or number)
- [ ] Click opens dropdown panel (desktop) or sheet (mobile)
- [ ] Notifications grouped: Today, This Week, Earlier
- [ ] Each notification: icon (by type), title, message, timestamp, action button
- [ ] Mark individual as read (click or button)
- [ ] "Mark all as read" button
- [ ] Dismiss/delete notification
- [ ] Click action → navigate to relevant page
- [ ] Priority indicators (urgent = red accent)

**Est. Time:** 3 hours  
**Dependencies:** 1.3, 1.5  
**Commit:** `feat(web): add notification center with bell icon and notification panel`

---

### Task 6.2: Alert Configuration

**Scope:** Settings page for notification preferences.

**Deliverables:**
- `packages/web/src/app/alerts/settings/page.tsx` — settings page
- `packages/web/src/components/notifications/notification-settings.tsx` — toggle list

**Acceptance Criteria:**
- [ ] Toggle switches for each notification type: Deadlines, Payments, Credit Score, Account Activity, Budget Alerts, Milestones, Vinny Tips
- [ ] Description for each toggle explaining what it controls
- [ ] Persists to Zustand store
- [ ] "Reset to Defaults" button
- [ ] Link from notification panel header

**Est. Time:** 1 hour  
**Dependencies:** 6.1  
**Commit:** `feat(web): add notification preference settings`

---

### Task 6.3: Resource Center

**Scope:** Educational content, template letters, and reference materials — all in-app.

**Deliverables:**
- `packages/web/src/app/resources/page.tsx` — resource center page
- `packages/web/src/app/resources/[slug]/page.tsx` — individual resource page
- `packages/web/src/components/resources/resource-card.tsx` — browsable resource card
- `packages/web/src/components/resources/template-letter.tsx` — template letter with fill-in-blanks
- `packages/web/src/lib/mock-data/resources.ts` — resource content (update if needed)

**Acceptance Criteria:**
- [ ] Sections: Know Your Rights, Template Letters, Educational Articles, Glossary
- [ ] Card-based browsing with category filter
- [ ] Search resources by keyword
- [ ] Template letters: pre-written with [PLACEHOLDER] fields, copy-to-clipboard button
- [ ] At least 3 template letters: debt validation request, cease & desist, credit bureau dispute
- [ ] At least 3 educational articles (content can be brief for MVP)
- [ ] Glossary with searchable terms
- [ ] "Vinny recommends" section based on user's account statuses
- [ ] All content renders in-app (no external links except CFPB)

**Est. Time:** 4 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add resource center with templates, articles, and glossary`

---

### Task 6.4: AI Companion — Vinny Chat Panel

**Scope:** Floating chat interface for Vinny with mocked keyword-based responses.

**Deliverables:**
- `packages/web/src/components/vinny/vinny-fab.tsx` — floating chat bubble
- `packages/web/src/components/vinny/vinny-chat-panel.tsx` — expandable chat panel (Sheet on mobile, panel on desktop)
- `packages/web/src/components/vinny/vinny-message.tsx` — individual message bubble
- `packages/web/src/components/vinny/vinny-input.tsx` — message input with send button
- `packages/web/src/components/vinny/suggestion-chips.tsx` — quick-reply chips
- `packages/web/src/lib/vinny/response-engine.ts` — keyword matching + response selection
- `packages/web/src/stores/vinny-store.ts` — Zustand store for chat state

**Acceptance Criteria:**
- [ ] Floating bubble (bottom-right desktop, above bottom nav on mobile) with Vinny avatar
- [ ] Click opens chat panel with message history
- [ ] User can type messages and get mocked responses
- [ ] Vinny's responses feel warm, friendly, encouraging
- [ ] Keyword matching covers: rights, credit, disputes, payments, budgeting, encouragement, greetings
- [ ] Fallback response for unmatched queries: "I'm still learning! Check the Resource Center for more info."
- [ ] Suggestion chips after each Vinny response (quick-reply options)
- [ ] Typing indicator animation while "thinking" (300-800ms delay)
- [ ] Legal disclaimer in chat footer: "I'm not a lawyer — this is general information only."
- [ ] Chat history persists in session (Zustand, not localStorage)
- [ ] Close button to collapse panel
- [ ] Accessible: focus management, keyboard navigation, ARIA live region for new messages

**Est. Time:** 4 hours  
**Dependencies:** 1.4, 1.5  
**Commit:** `feat(web): add Vinny AI companion chat panel with mock responses`

---

### Task 6.5: Vinny Proactive Tips Integration

**Scope:** Contextual Vinny tips on dashboard and account detail pages.

**Deliverables:**
- `packages/web/src/components/vinny/vinny-tip-card.tsx` — dismissible tip card
- `packages/web/src/lib/vinny/tip-generator.ts` — generates tips based on user data context
- Update dashboard and account detail pages to include tips

**Acceptance Criteria:**
- [ ] Tips appear contextually: dashboard (general tips), account detail (account-specific tips)
- [ ] Examples: "This account is past the statute of limitations — you may have options!", "A payment is due in 3 days — want me to help you prepare?"
- [ ] Dismissible per tip (don't show same tip again this session)
- [ ] Max 1 tip visible per page (not overwhelming)
- [ ] "Chat with Vinny about this" link opens chat with context
- [ ] Uses Vinny's brand color (soft purple)
- [ ] Respects notification preferences (vinnyTips toggle)

**Est. Time:** 2 hours  
**Dependencies:** 6.4, 2.4  
**Commit:** `feat(web): add Vinny proactive contextual tips`

---

## Phase 7: Polish

> **Goal:** Animations, onboarding, accessibility, mobile responsiveness, and performance.  
> **Total estimated time:** 12–14 hours

---

### Task 7.1: Animations & Micro-interactions

**Scope:** Add motion and delight to the UI with Framer Motion.

**Deliverables:**
- `packages/web/src/components/ui/animated-*.tsx` — animated variants of key components
- `packages/web/src/lib/animations.ts` — shared animation variants
- `packages/web/src/components/ui/confetti.tsx` — celebration effect

**Acceptance Criteria:**
- [ ] Page transitions (fade + slide)
- [ ] Card hover effects (subtle lift)
- [ ] Progress bar/ring animations on mount
- [ ] List item stagger animations
- [ ] Confetti/celebration effect for milestones (account settled, goal reached)
- [ ] Smooth sidebar collapse/expand
- [ ] FAB expand/collapse animation
- [ ] Typing indicator pulse animation for Vinny
- [ ] All animations respect `prefers-reduced-motion` (disable for users who prefer)
- [ ] No janky or distracting animations

**Est. Time:** 3 hours  
**Dependencies:** All Phase 1-6  
**Commit:** `feat(web): add animations and micro-interactions`

---

### Task 7.2: Empty States & Onboarding Flow

**Scope:** First-time user experience and empty states for all sections.

**Deliverables:**
- `packages/web/src/components/onboarding/onboarding-wizard.tsx` — first-time setup flow
- `packages/web/src/components/onboarding/welcome-step.tsx` — welcome screen
- `packages/web/src/components/onboarding/import-step.tsx` — suggest credit report import
- `packages/web/src/components/onboarding/profile-step.tsx` — basic info (name, state)
- Update all pages with contextual empty states

**Acceptance Criteria:**
- [ ] First visit shows onboarding wizard (3-4 steps)
- [ ] Step 1: Welcome from Vinny ("Welcome to Vindicate! I'm Vinny, and I'm here to help.")
- [ ] Step 2: Enter name and state (for SOL calculations)
- [ ] Step 3: Option to import credit report or add accounts manually
- [ ] Step 4: Quick tour highlights (optional, can skip)
- [ ] Onboarding completion stored in profile (don't show again)
- [ ] Every section has an illustrated empty state with clear CTA
- [ ] Empty states are encouraging, not bleak

**Est. Time:** 3 hours  
**Dependencies:** All Phase 1-6  
**Commit:** `feat(web): add onboarding wizard and empty states`

---

### Task 7.3: Accessibility Audit & Fixes

**Scope:** Comprehensive accessibility review and remediation.

**Deliverables:**
- Fixes applied across all components
- `docs/specs/a11y-audit-results.md` — audit report

**Acceptance Criteria:**
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators on all focusable elements
- [ ] Skip-to-content link on every page
- [ ] All images/icons have alt text or aria-label
- [ ] Form fields have associated labels
- [ ] Error messages associated with fields via aria-describedby
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI)
- [ ] Screen reader testing with at least one reader (VoiceOver or NVDA)
- [ ] ARIA live regions for dynamic content (notifications, chat messages)
- [ ] Correct heading hierarchy (no skipped levels)
- [ ] Semantic HTML (nav, main, aside, section, article)
- [ ] Lighthouse Accessibility score ≥ 90

**Est. Time:** 3 hours  
**Dependencies:** All Phase 1-6  
**Commit:** `fix(web): accessibility audit fixes`

---

### Task 7.4: Mobile Responsiveness Audit

**Scope:** Test and fix all pages at mobile, tablet, and desktop breakpoints.

**Deliverables:**
- Fixes applied across all pages
- `docs/specs/responsive-audit-results.md` — audit report

**Acceptance Criteria:**
- [ ] All pages tested at: 320px, 375px, 768px, 1024px, 1280px
- [ ] No horizontal scrolling on any page at any breakpoint
- [ ] All touch targets ≥ 44x44px
- [ ] Text remains readable at all sizes (no overflow or truncation that hides info)
- [ ] Charts/visualizations degrade gracefully on small screens
- [ ] Modals/sheets work on mobile (full-screen or bottom sheet)
- [ ] Bottom nav doesn't overlap content
- [ ] Forms are usable on mobile (no tiny inputs, proper keyboard types)
- [ ] Tested on iOS Safari and Chrome Android (or emulators)

**Est. Time:** 2 hours  
**Dependencies:** All Phase 1-6  
**Commit:** `fix(web): mobile responsiveness fixes`

---

### Task 7.5: Performance Optimization

**Scope:** Bundle analysis, lazy loading, and optimization.

**Deliverables:**
- Performance improvements applied
- `docs/specs/performance-report.md` — analysis report

**Acceptance Criteria:**
- [ ] Bundle analysis run (next/bundle-analyzer)
- [ ] Route-based code splitting verified (App Router does this by default)
- [ ] Heavy components lazy-loaded (charts, chat panel, document upload)
- [ ] Images optimized (next/image where applicable)
- [ ] Fonts preloaded
- [ ] No unnecessary re-renders (React DevTools profiling)
- [ ] Lighthouse Performance score ≥ 85 (desktop)
- [ ] Lighthouse Performance score ≥ 70 (mobile, 3G throttled)
- [ ] Initial bundle < 200KB gzipped

**Est. Time:** 2 hours  
**Dependencies:** All Phase 1-6  
**Commit:** `perf(web): optimize bundle size and loading performance`

---

## Summary

| Phase | Tasks | Est. Hours | Focus |
|-------|-------|------------|-------|
| 1. Foundation | 6 | 16–20 | Design system, layout, data, routing |
| 2. Dashboard | 5 | 10–12 | Home page experience |
| 3. Accounts | 7 | 18–22 | Core account management |
| 4. Activity & Cases | 5 | 12–14 | Logging and tracking |
| 5. Budget | 5 | 12–14 | Financial health tools |
| 6. Alerts/Resources/AI | 5 | 14–16 | Notifications, education, Vinny |
| 7. Polish | 5 | 12–14 | Quality, a11y, performance |
| **Total** | **38** | **94–112** | |

### Recommended Execution Order

1. **Phase 1** first (everything depends on it)
2. **Phase 2** (dashboard gives immediate visible progress)
3. **Phase 3** (core feature — accounts)
4. **Phase 5** before Phase 4 (budget is more standalone)
5. **Phase 4** (activity/cases build on accounts)
6. **Phase 6** (alerts/AI layer on top of everything)
7. **Phase 7** (polish after all features exist)

### Parallelization Opportunities

Within each phase, many tasks can run in parallel:
- Phase 1: 1.4 and 1.5 can run in parallel after 1.1
- Phase 2: 2.1, 2.2, 2.3, 2.4 can all run in parallel
- Phase 3: 3.3, 3.4, 3.5 can run in parallel after 3.2
- Phase 6: 6.1, 6.3, 6.4 can run in parallel

---

*This task breakdown is a living document. Adjust estimates and scope as development progresses.*

---

## Backlog: Performance & UX Issues

### PERF-1: Slow Initial Tab Load (Cold Compilation)

**Reported by:** Dave (2026-02-08)
**Description:** First click on each tab/route has a noticeable delay (~1-2 seconds) before anything renders. Subsequent navigations to the same route are fast. This is due to Next.js dev server compiling each route on first request (not pre-compiled).

**Root Cause:** Next.js dev mode uses on-demand compilation. Each route is compiled only when first visited. In production (`next build` + `next start`), all routes are pre-compiled and this delay disappears.

**Potential Fixes:**
- [ ] Switch to production build for demo (`next build && next start`)
- [ ] Add loading.tsx skeletons per route group for perceived performance
- [ ] Consider `next/dynamic` with loading states for heavy components
- [ ] Evaluate if any route components can be split into smaller chunks
- [ ] Add Suspense boundaries with skeleton fallbacks in key areas

**Priority:** P2 (UX polish, Phase 7)
**Est. Time:** 2 hours
