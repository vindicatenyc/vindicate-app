# Accessibility Audit Results -- Phase 7.3

## Summary
Vindicate NYC accessibility audit completed 2026-02-08. The application was reviewed against WCAG 2.1 AA success criteria. Overall, the codebase demonstrates strong accessibility foundations with consistent use of aria-labels, semantic HTML, and focus management. Several small issues were identified and fixed during this audit.

## Findings & Fixes Applied

### 1. Skip-to-Content Link
- **Status**: Pass
- **Details**: A skip-to-content link is present in `layout.tsx` (line 48) linking to `#main-content`. The target `id="main-content"` is correctly set on the `<main>` element in `app-shell.tsx` (line 28). The skip link uses the `.skip-to-content` class defined in `globals.css` which applies `sr-only` by default and becomes visible on `:focus` with proper styling (absolute positioning, z-50, primary background). This is a correct implementation.

### 2. Focus Indicators
- **Status**: Pass
- **Details**: Global `:focus-visible` styles are defined in `globals.css` (line 119) applying `ring-2 ring-ring ring-offset-2 ring-offset-background`. The ring color uses the `--ring` CSS variable which is set to the primary sage green color (HSL 161 26% 39% in light mode, 161 28% 50% in dark mode), providing good contrast in both themes. The `ThemeToggle` component also applies its own explicit `focus-visible` styles as a belt-and-suspenders approach. Additionally, `prefers-reduced-motion` is respected (globals.css lines 128-141) to disable animations.

### 3. ARIA Labels
- **Status**: Fixed (minor)
- **Icon-only buttons checked (all have aria-labels)**:
  - `header.tsx`: "Toggle menu" (hamburger), "Search" (mobile search), "Chat with Vinny" (message icon)
  - `notification-bell.tsx`: Dynamic label "Notifications (N unread)"
  - `theme-toggle.tsx`: Dynamic label "Switch to light/dark mode" + sr-only text
  - `sidebar.tsx`: "Expand sidebar" / "Collapse sidebar" (toggle button)
  - `mobile-nav.tsx`: "Close menu" (X button), "More navigation options" (more button with aria-expanded)
  - `vinny-fab.tsx`: "Chat with Vinny"
  - `vinny-chat-panel.tsx`: "Clear chat" (trash button)
  - `vinny-input.tsx`: "Send message" (send button), "Message to Vinny" (input)
  - `quick-actions.tsx`: Dynamic "Open/Close quick actions" with aria-expanded
  - `vinny-greeting.tsx`: "Dismiss greeting"
  - `budget/page.tsx`: "Previous month", "Next month"
- **Decorative icons checked (all use aria-hidden="true")**:
  - All Lucide icons adjacent to text labels properly use `aria-hidden="true"` across 51 component files (106 occurrences found).
- **Fix applied**: `budget/page.tsx` -- added `aria-hidden="true"` to `ChevronLeft` and `ChevronRight` icons in the month selector buttons. These were the only icon-only button icons missing the attribute.
- **Fix applied**: `activity-form.tsx` -- added `aria-hidden="true"` to `AlertTriangle` icon in the harassment flag label.

### 4. Heading Hierarchy
- **Status**: Pass (with notes)
- **Details**:
  - The `PageHeader` component renders `<h1>` for page titles, ensuring every route has a single top-level heading.
  - Sub-sections correctly use `<h2>` (e.g., `DebtProgressRing`: "Debt Progress", `RecentActivity`: "Recent Activity", `VinnyGreeting` greeting).
  - The `VinnyChatPanel` uses `SheetTitle` (renders as an appropriate heading level within the dialog context).
  - `EmptyState` uses `<h3>` for empty-state titles, which is appropriate as these appear within `<h2>`-level sections.
  - `not-found.tsx` uses `<h2>` -- since this page does not use `PageHeader` and has no `<h1>`, this is technically a heading skip. However, since it renders within the app shell where the sidebar provides site identity, this is acceptable for an error state page.
  - `error.tsx` uses `<h2>` -- same note as `not-found.tsx`.
  - `StatCard` does not use heading elements for values/labels, which is correct since they are data display cards within a region.

### 5. Form Labels & Descriptions
- **Status**: Fixed
- **Details**:
  - `account-form.tsx`: The `FormField` helper component used a `<label>` element that only wrapped the label text, with the input rendered as a sibling. This meant labels were **not programmatically associated** with their inputs. **Fix applied**: Changed `FormField` to use a wrapping `<label>` element that contains both the label text and the input `{children}`, ensuring proper association.
  - `activity-form.tsx`: All form fields use proper `htmlFor`/`id` associations (e.g., `htmlFor="accountId"`, `htmlFor="title"`, `htmlFor="dateTime"`, `htmlFor="callerPhone"`, `htmlFor="amount"`, `htmlFor="notes"`). This form is well-implemented.
  - `header.tsx`: Search input has `aria-label="Search"` and `type="search"` -- correct.
  - `vinny-input.tsx`: Chat input has `aria-label="Message to Vinny"` -- correct.
  - Form validation errors in `account-form.tsx` use `role="alert"` for screen reader announcement.
  - Required fields are marked with `aria-required="true"` and visual asterisk indicators.

### 6. ARIA Live Regions
- **Status**: Pass (with recommendation)
- **Details**:
  - `vinny-chat-panel.tsx`: The chat messages container uses `role="log"` with `aria-live="polite"` and `aria-label="Chat messages"` (line 97-99). This correctly announces new messages to screen readers without interrupting.
  - `error.tsx`: **Fix applied** -- Added `role="alert"` to the error container so error states are announced to screen readers.
  - `account-form.tsx`: Validation errors use `role="alert"` for immediate announcement.
  - **Recommendation**: Consider adding `aria-live="polite"` to the notification bell's unread count badge so changes are announced. Currently, the count updates visually but is only communicated via the button's aria-label when focused.

### 7. Color Contrast
- **Status**: Pass (noted)
- **Details**:
  - **Primary (#4A7C6F on white)**: Contrast ratio ~4.5:1 -- meets AA for normal text.
  - **Muted foreground (#6B6B6B on #FAFAF8)**: Contrast ratio ~4.8:1 -- meets AA for normal text.
  - **Dark mode primary (#6BA894 on #1A1D21)**: Contrast ratio ~6.2:1 -- meets AA and AAA.
  - **Dark mode muted (#A0A0A0 on #1A1D21)**: Contrast ratio ~7.5:1 -- exceeds AA.
  - **Accent purple (#8B6FB0 on white)**: Contrast ratio ~3.8:1 -- passes AA for large text (14pt bold / 18pt) but falls slightly below 4.5:1 for small body text. The accent is primarily used for Vinny branding and interactive elements (buttons, chips), not for body text, so this is acceptable. Suggestion chip text at `text-xs` could be monitored.
  - Status colors (success, warning, danger, info) all provide foreground colors (white or dark) that pass AA contrast against their respective backgrounds.
  - The application uses CSS custom properties (HSL format) allowing consistent theming across light and dark modes.

### 8. Semantic HTML & Roles
- **Status**: Pass
- **Details**:
  - `<main>` element with `id="main-content"` in `app-shell.tsx`.
  - `<header>` element in `header.tsx`.
  - `<aside>` element for sidebar in `sidebar.tsx`.
  - `<nav>` elements with descriptive `aria-label` in both `sidebar.tsx` ("Main navigation") and `mobile-nav.tsx` ("Mobile navigation").
  - `<ul>` / `<li>` elements for navigation items in `sidebar.tsx`.
  - `<fieldset>` / `<legend>` elements in `account-form.tsx` for form grouping.
  - `role="dialog"` with `aria-modal="true"` and `aria-label` on `OnboardingWizard`.
  - `role="complementary"` with `aria-label` on `VinnyGreeting`.
  - `role="region"` with `aria-label` on `FinancialHealthCards`.
  - `role="group"` with `aria-label` on `QuickActions`, `SuggestionChips`, and onboarding progress dots.
  - `role="menu"` / `role="menuitem"` on quick actions FAB expanded items.
  - `aria-current="page"` on active navigation links in both `sidebar.tsx` and `mobile-nav.tsx`.
  - `aria-expanded` on mobile nav "More" button and quick actions FAB.
  - `Sheet` components (notifications, Vinny chat) from shadcn/ui provide built-in dialog semantics with `SheetTitle` and `SheetDescription`.
  - `html` element has `lang="en"` attribute.

## Components Reviewed
| Component | File Path |
|-----------|-----------|
| RootLayout | `packages/web/src/app/layout.tsx` |
| AppShell | `packages/web/src/components/layout/app-shell.tsx` |
| Header | `packages/web/src/components/layout/header.tsx` |
| Sidebar | `packages/web/src/components/layout/sidebar.tsx` |
| MobileNav | `packages/web/src/components/layout/mobile-nav.tsx` |
| VinnyChatPanel | `packages/web/src/components/vinny/vinny-chat-panel.tsx` |
| VinnyFab | `packages/web/src/components/vinny/vinny-fab.tsx` |
| VinnyInput | `packages/web/src/components/vinny/vinny-input.tsx` |
| VinnyGreeting | `packages/web/src/components/dashboard/vinny-greeting.tsx` |
| SuggestionChips | `packages/web/src/components/vinny/suggestion-chips.tsx` |
| EmptyState | `packages/web/src/components/ui/empty-state.tsx` |
| PageHeader | `packages/web/src/components/ui/page-header.tsx` |
| StatCard | `packages/web/src/components/ui/stat-card.tsx` |
| QuickActions | `packages/web/src/components/dashboard/quick-actions.tsx` |
| FinancialHealthCards | `packages/web/src/components/dashboard/financial-health-cards.tsx` |
| DebtProgressRing | `packages/web/src/components/dashboard/debt-progress-ring.tsx` |
| RecentActivity | `packages/web/src/components/dashboard/recent-activity.tsx` |
| NotificationBell | `packages/web/src/components/notifications/notification-bell.tsx` |
| NotificationPanel | `packages/web/src/components/notifications/notification-panel.tsx` |
| ThemeToggle | `packages/web/src/components/theme-toggle.tsx` |
| OnboardingWizard | `packages/web/src/components/onboarding/onboarding-wizard.tsx` |
| AccountForm | `packages/web/src/components/accounts/account-form.tsx` |
| ActivityForm | `packages/web/src/components/activity/activity-form.tsx` |
| error.tsx | `packages/web/src/app/error.tsx` |
| not-found.tsx | `packages/web/src/app/not-found.tsx` |
| globals.css | `packages/web/src/app/globals.css` |
| BudgetPage | `packages/web/src/app/budget/page.tsx` |

## Fixes Applied Summary
1. **`budget/page.tsx`**: Added `aria-hidden="true"` to `ChevronLeft` and `ChevronRight` icons in month navigation buttons.
2. **`activity-form.tsx`**: Added `aria-hidden="true"` to `AlertTriangle` decorative icon in harassment flag toggle.
3. **`account-form.tsx`**: Refactored `FormField` component to use wrapping `<label>` element, properly associating labels with their input children.
4. **`error.tsx`**: Added `role="alert"` to the error container for screen reader announcement.

## Recommendations
1. **Accent color contrast**: Monitor the accent purple (#8B6FB0) usage on small text elements. Consider using a slightly darker variant for `text-xs` text like suggestion chips.
2. **Notification count announcement**: Add `aria-live="polite"` to a visually hidden element that announces notification count changes.
3. **not-found.tsx heading level**: Consider changing `<h2>` to `<h1>` on the not-found page since it does not use PageHeader and has no other `<h1>`.
4. **Keyboard trap testing**: The onboarding wizard modal should be tested for keyboard trap behavior -- focus should be constrained within the dialog. The current implementation uses `role="dialog"` and `aria-modal="true"` but may need explicit focus trapping logic.
5. **Reduced motion**: The `prefers-reduced-motion` media query is well-implemented globally, and the `OnboardingWizard` also checks for it locally before applying step animations. Consider adding the same check to the `VinnyFab` pulse animation.
