# Contributing to Vindicate NYC

Thank you for your interest in contributing! This project helps individuals navigate complex financial and legal challenges.

## Code of Conduct

Be kind, be helpful, be constructive. We're all here to help people in difficult situations.

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- pnpm 8+
- Git

### Setup

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/vindicate-app.git
cd vindicate-app

# Install dependencies
pnpm install
pip install -e "packages/core[dev,test]"

# Run tests
pnpm test
pytest packages/core/tests/
```

## Branch Workflow

We use GitHub Flow with feature branches:

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Work on your changes
# ...

# Push and create PR
git push origin feature/your-feature-name
gh pr create
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add credit report parsing for Equifax format
fix: correct RCP calculation for family size > 4
docs: update API documentation for /calculate endpoint
test: add edge case tests for negative income
refactor: extract audit logging to shared module
```

## Areas for Contribution

### Good First Issues
Look for issues labeled `good-first-issue` - these are scoped for newcomers.

### Technical Areas
- **Financial Calculations**: IRS form logic, tax calculations
- **Document Parsing**: Credit reports, IRS notices, court documents
- **Frontend**: React components, accessibility
- **API**: New endpoints, validation
- **Testing**: Unit tests, integration tests, E2E
- **Documentation**: User guides, API docs

### Legal/Domain Expertise Needed
If you have expertise in:
- NY debt collection law
- FCRA/FDCPA regulations
- IRS OIC procedures
- Arbitration (JAMS/AAA)

...we'd love your review of our document templates and calculations!

## Pull Request Process

1. Create a feature branch
2. Write tests for your changes
3. Ensure all tests pass (`pnpm test`)
4. Update documentation if needed
5. Create PR with clear description
6. Address review feedback
7. Squash and merge

## Questions?

- Open a [Discussion](https://github.com/vindicatenyc/vindicate-app/discussions)
- Email: contribute@vindicate.nyc
