# Vindicate NYC - Agent Registry

## Agent Coordination Protocol

Each agent operates in its own worktree on a feature branch. Agents claim tasks via GitHub Issues.

### Task Claiming Protocol
1. Agent checks `gh issue list --label "ready" --label "<agent-type>"`
2. Agent assigns issue to itself: `gh issue edit <number> --add-assignee "@me"`
3. Agent adds label "in-progress": `gh issue edit <number> --add-label "in-progress" --remove-label "ready"`
4. Agent creates worktree: `git worktree add ../vindicate-app-<issue-number> -b feature/<issue-number>-<short-name>`
5. Agent works, commits frequently with conventional commits
6. Agent creates PR: `gh pr create --title "<type>: <description>" --body "Closes #<issue-number>"`
7. Agent requests review from appropriate reviewer agent

### Conflict Resolution
- Main orchestrator resolves merge conflicts
- If two agents need same file, coordinate via GitHub comments
- Lock files via issue comment: `LOCKED: packages/core/src/calculator.ts`

---

## Registered Agents

### ORCHESTRATOR (Primary)
**ID:** `orchestrator`
**Scope:** Project coordination, task breakdown, PR merges
**Claims:** Issues labeled `orchestrator`
**Reviews:** All PRs before merge to main

### TESTER
**ID:** `tester`
**Scope:** Unit tests, integration tests, E2E tests, UI tests
**Claims:** Issues labeled `testing`
**Tools:** pytest, vitest, playwright, cypress
**Reviews:** PRs touching test files

### DOCUMENTARIAN
**ID:** `docs`
**Scope:** README, API docs, feature docs, release notes
**Claims:** Issues labeled `documentation`
**Output:** docs/ folder, inline JSDoc/docstrings
**Reviews:** PRs adding new features (for doc updates)

### SECURITY
**ID:** `security`
**Scope:** Security audits, dependency scanning, SAST, secrets detection
**Claims:** Issues labeled `security`
**Tools:** bandit, npm audit, gitleaks, semgrep
**Reviews:** All PRs (security scan)

### PERFORMANCE
**ID:** `performance`
**Scope:** Benchmarks, profiling, optimization recommendations
**Claims:** Issues labeled `performance`
**Tools:** pytest-benchmark, lighthouse, k6
**Reviews:** PRs touching core calculations or API endpoints

### MARKETING
**ID:** `marketing`
**Scope:** Social content, video scripts, changelog announcements
**Claims:** Issues labeled `marketing`
**Output:** docs/marketing/, tweets.json, video-scripts/
**Triggers:** On feature completion, creates announcement content

### ARCHITECT
**ID:** `architect`
**Scope:** System design, API design, database schema, tech decisions
**Claims:** Issues labeled `architecture`
**Reviews:** PRs adding new packages or major features

### FRONTEND
**ID:** `frontend`
**Scope:** React components, UI/UX, accessibility
**Claims:** Issues labeled `frontend`
**Reviews:** PRs in packages/web/

### BACKEND
**ID:** `backend`
**Scope:** API endpoints, database, business logic
**Claims:** Issues labeled `backend`
**Reviews:** PRs in packages/api/, packages/core/

### COMPLIANCE
**ID:** `compliance`
**Scope:** Legal disclaimers, audit trails, regulatory checks
**Claims:** Issues labeled `compliance`
**Reviews:** PRs touching legal document generation
