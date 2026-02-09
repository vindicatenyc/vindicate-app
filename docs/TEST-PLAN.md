# Vindicate NYC — Manual Test Plan
**Date:** 2026-02-09  
**Version:** Post Phase 9B  
**Test URL:** https://vindicate.nyc:8443 (or http://localhost:3000)

---

## Prerequisites
- Supabase stack running (`cd supabase && docker compose ps` — all healthy)
- Dev server running (`sudo systemctl status vindicate-dev`)
- Browser: Chrome or Firefox (test both if possible)
- Have a sample PDF ready (bank statement, credit report, or any multi-page PDF)
- Have a sample image ready (JPG/PNG of a receipt or bill)

---

## Section 1: Authentication

### 1.1 Demo Login
- [ ] Navigate to `/auth/login`
- [ ] Click "Demo Account" quick-login button
- [ ] Verify credentials auto-fill (demo@vindicate.nyc)
- [ ] Verify redirect to dashboard after login
- [ ] Verify user menu in header shows demo user info

### 1.2 Register New Account
- [ ] Sign out (user menu → Sign Out)
- [ ] Navigate to `/auth/register`
- [ ] Try submitting with empty fields → should show validation errors
- [ ] Try password less than 8 chars → should show error
- [ ] Try mismatched passwords → should show "Passwords do not match"
- [ ] Enter a valid email (your email) + strong password
- [ ] Verify password strength meter updates as you type
- [ ] Submit → should register and redirect to onboarding
- [ ] Complete onboarding wizard (3 steps)
- [ ] Verify redirect to dashboard after onboarding

### 1.3 Login with New Account
- [ ] Sign out
- [ ] Log in with the account you just created
- [ ] Verify dashboard loads (it will be empty — no data yet)

### 1.4 Forgot Password
- [ ] Sign out → go to login → click "Forgot password?"
- [ ] Enter your email → submit
- [ ] ⚠️ **Note:** SMTP is not configured, so no email will actually send. Verify no crash/error — should show a "Check your email" message.

### 1.5 Route Protection
- [ ] Sign out
- [ ] Try navigating directly to `/` (dashboard) → should redirect to `/auth/login`
- [ ] Try navigating to `/accounts` → should redirect to `/auth/login`
- [ ] Try navigating to `/budget` → should redirect to `/auth/login`

---

## Section 2: Dashboard (Log in as demo user)

### 2.1 Overview
- [ ] Verify Vinny greeting shows correct time-of-day message
- [ ] Verify financial health cards display (total debt, accounts, etc.)
- [ ] Verify debt progress ring renders
- [ ] Verify activity feed shows recent entries
- [ ] Verify quick action buttons are present

### 2.2 Dark/Light Mode
- [ ] Find the theme toggle (header)
- [ ] Switch to dark mode → verify all cards, text, backgrounds update
- [ ] Switch to light mode → verify clean appearance
- [ ] Verify no contrast issues in either mode

### 2.3 Responsive
- [ ] Open DevTools → toggle device toolbar
- [ ] Test at 375px width (iPhone SE) → verify mobile layout
- [ ] Test at 768px (iPad) → verify tablet layout
- [ ] Verify mobile navigation works (hamburger menu)

---

## Section 3: Accounts

### 3.1 Account List
- [ ] Navigate to `/accounts`
- [ ] Verify demo accounts load (Maria Santos data)
- [ ] Test search: type a creditor name → verify filtering
- [ ] Test filter dropdown: filter by status (e.g., "In Collections")
- [ ] Test sorting: sort by balance, sort by name
- [ ] Verify account cards show: creditor name, balance, status, type

### 3.2 Account Detail
- [ ] Click on an account → verify detail page loads
- [ ] Check all 5 tabs:
  - [ ] **Overview** — balance, status, key dates
  - [ ] **Timeline** — activity history
  - [ ] **Documents** — document list (this is where uploads go)
  - [ ] **Notes** — any notes
  - [ ] **Settings** — account settings
- [ ] Verify SOL countdown displays (if applicable)

### 3.3 Add Account
- [ ] Click "Add Account" button
- [ ] Fill in creditor name, balance, account type
- [ ] Submit → verify new account appears in list
- [ ] Open the new account → verify data matches what you entered

### 3.4 Edit Account
- [ ] Open an existing account
- [ ] Edit the balance or status
- [ ] Save → verify changes persist (refresh page to confirm)

---

## Section 4: Document Upload & Processing 🔑

**This is the new functionality — test thoroughly.**

### 4.1 Basic File Upload
- [ ] Go to an account detail → Documents tab
- [ ] Drag and drop a PDF file onto the upload zone
- [ ] Verify: file name appears in upload queue
- [ ] Verify: progress bar shows upload progress
- [ ] Verify: checkmark appears when upload completes
- [ ] Verify: document appears in the document list below

### 4.2 File Type Validation
- [ ] Try uploading an unsupported file (e.g., .exe, .zip, .mp4)
- [ ] Verify: red error message appears with friendly explanation
- [ ] Verify: the file is NOT uploaded

### 4.3 File Size Validation
- [ ] If you have a file >50MB, try uploading it
- [ ] Verify: error message about size limit

### 4.4 Multiple File Upload
- [ ] Click "browse" and select 2-3 files at once
- [ ] Verify: all files appear in upload queue
- [ ] Verify: each has its own progress bar
- [ ] Verify: all complete independently

### 4.5 Document Type Selection
- [ ] Before uploading, change the document type dropdown
- [ ] Verify all 13 types are listed:
  - Credit Report, Bank Statement, Tax Document, Income Verification,
    Medical Bill, Validation Letter, Dispute Letter, Court Document,
    Payment Receipt, Correspondence, Settlement Agreement,
    Identity Document, Other
- [ ] Upload a file with "Bank Statement" selected
- [ ] Verify the document card shows the correct type icon

### 4.6 Document Card Display
- [ ] Verify each document card shows:
  - [ ] File name
  - [ ] Document type with icon
  - [ ] File size (formatted: KB/MB)
  - [ ] Upload date
  - [ ] Processing status badge

### 4.7 AI Processing (requires OPENAI_API_KEY)
- [ ] Upload a real bank statement PDF (select type "Bank Statement")
- [ ] Watch the document card — should show:
  - [ ] "Processing..." with spinner animation
  - [ ] Then either "Extracted" (green) or "Failed" (red)
- [ ] If processing succeeds:
  - [ ] Click "View Data" button on the card
  - [ ] Verify extraction results panel opens (slide from right)
  - [ ] Verify bank name, account type, period are shown
  - [ ] Verify transaction table is populated with dates, descriptions, amounts
  - [ ] Verify amounts are color-coded (green=credit, red=debit)
  - [ ] Verify summary shows total debits/credits
- [ ] If processing fails:
  - [ ] Verify "Failed" badge appears
  - [ ] Click "Retry" button
  - [ ] Verify reprocessing starts

### 4.8 Extraction Review & Import
- [ ] With a successfully processed document, click "View Data"
- [ ] In the review panel:
  - [ ] Verify confidence score is displayed
  - [ ] Verify action summary shows what will be imported
  - [ ] Click "Confirm & Import"
  - [ ] Verify success message: "X transactions imported" or "X accounts added"
- [ ] Navigate to Budget page → verify imported data appears
- [ ] Try "Skip" on another document → verify it marks as skipped
- [ ] Try "Re-process" → verify it re-runs extraction

### 4.9 Credit Report Upload (if you have one)
- [ ] Upload a credit report PDF (type: "Credit Report")
- [ ] After processing, verify extracted data shows:
  - [ ] Bureau name, report date, credit score
  - [ ] List of accounts with creditor, balance, status
  - [ ] Collections (if any)
  - [ ] Inquiries (if any)
- [ ] Click "Confirm & Import"
- [ ] Navigate to Accounts → verify new accounts were created

### 4.10 Document Download
- [ ] On a document card, click the download button
- [ ] Verify the file downloads (or opens in new tab)
- [ ] For image documents, verify inline preview works

### 4.11 Document Delete
- [ ] Delete a document from the list
- [ ] Verify it disappears from the list
- [ ] Verify the file is removed from storage (re-download should fail)

---

## Section 5: Activity & Cases

### 5.1 Activity Logger
- [ ] Navigate to `/activity`
- [ ] Click "Log Activity"
- [ ] Fill in activity details
- [ ] If logging a debt collector call, verify FDCPA harassment checklist appears
- [ ] Submit → verify activity appears in timeline

### 5.2 Activity Timeline
- [ ] Verify timeline shows activities in chronological order
- [ ] Test filters: filter by type, by date range, by account
- [ ] Verify activity cards show relevant details

### 5.3 Cases
- [ ] Navigate to `/cases`
- [ ] Verify demo cases display with status stepper
- [ ] Click a case → verify detail view with deadlines
- [ ] Check urgency indicators on upcoming deadlines

---

## Section 6: Budget & Financial Health

### 6.1 Budget Overview
- [ ] Navigate to `/budget`
- [ ] Verify budget overview cards display
- [ ] Verify spending charts render (may be empty for new account)
- [ ] If you imported bank statement data, verify transactions appear here

### 6.2 Debt Repayment
- [ ] Check debt repayment section
- [ ] Toggle between snowball and avalanche strategies
- [ ] Verify calculations update

### 6.3 Credit Score
- [ ] Verify credit score widget displays
- [ ] Verify gauge/chart renders

### 6.4 Savings Goals
- [ ] Check savings goals section
- [ ] Verify progress bars display

---

## Section 7: Vinny AI Companion

### 7.1 Chat Interface
- [ ] Find the Vinny FAB (floating action button) in bottom-right
- [ ] Click to open chat panel
- [ ] Type "help" → verify Vinny responds
- [ ] Type "what is debt validation?" → verify relevant response
- [ ] Try suggestion chips → verify they trigger responses
- [ ] Verify typing indicator appears before responses

### 7.2 Proactive Tips
- [ ] Check dashboard for Vinny tips/cards
- [ ] Check account detail for contextual Vinny advice

---

## Section 8: Alerts & Resources

### 8.1 Notifications
- [ ] Click notification bell in header
- [ ] Verify notification panel opens
- [ ] Check for any demo notifications

### 8.2 Alert Settings
- [ ] Navigate to alert settings
- [ ] Verify toggle switches work
- [ ] Change a setting → verify it persists

### 8.3 Resource Center
- [ ] Navigate to resources
- [ ] Verify template letters are available:
  - [ ] Debt validation letter
  - [ ] Cease and desist
  - [ ] Credit dispute letter
- [ ] Click a template → verify it opens/previews

---

## Section 9: Data Isolation (RLS)

### 9.1 Cross-User Isolation
- [ ] Log in as demo user → note the accounts visible
- [ ] Sign out → register a second test account
- [ ] Log in as the new account
- [ ] Navigate to accounts → should be EMPTY (not showing demo user's data)
- [ ] Navigate to documents → should be EMPTY
- [ ] Navigate to activity → should be EMPTY
- [ ] This confirms Row Level Security is working

---

## Section 10: Edge Cases & Error Handling

### 10.1 Network Issues
- [ ] Open DevTools → Network tab → set throttling to "Slow 3G"
- [ ] Try uploading a document → verify progress bar works (slowly)
- [ ] Try navigating between pages → verify loading states appear

### 10.2 Invalid States
- [ ] Try submitting forms with empty required fields
- [ ] Try entering negative numbers for balances
- [ ] Try very long text in description fields

### 10.3 Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test on actual mobile device (if available)

---

## Bug Report Template

When you find issues, note:

```
**Bug:** [Brief description]
**Page:** [URL/route]
**Steps:** 
1. ...
2. ...
3. ...
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Screenshot:** [If applicable]
**Severity:** Critical / High / Medium / Low
```

---

## Test Summary

| Section | Pass | Fail | Notes |
|---------|------|------|-------|
| 1. Auth | | | |
| 2. Dashboard | | | |
| 3. Accounts | | | |
| 4. Doc Upload & AI | | | |
| 5. Activity & Cases | | | |
| 6. Budget | | | |
| 7. Vinny | | | |
| 8. Alerts & Resources | | | |
| 9. Data Isolation | | | |
| 10. Edge Cases | | | |
