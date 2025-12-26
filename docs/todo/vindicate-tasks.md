# Vindicate NYC - Micro-Task Breakdown

## Philosophy

Each task is:
- **< 2 hours** of focused work
- **Single responsibility** - one thing done well
- **Testable** - clear pass/fail criteria
- **Committable** - working code at completion

---

## Phase 0: Foundation (Clean Slate)

**Goal:** Clean project structure, core models, agent interfaces—zero LLM code yet.

### Task 0.1: Clean up repository

**Scope:** Remove broken/unused code, establish clean structure

**Steps:**
1. Archive current `packages/core/src/vindicate_core/` to `_archive/` (don't delete yet)
2. Create new clean directory structure per SKILL.md
3. Create root `pyproject.toml` with workspace config
4. Create `packages/core/pyproject.toml`
5. Create `packages/agents/pyproject.toml`

**Acceptance Criteria:**
- [ ] `_archive/` contains old code for reference
- [ ] New structure matches SKILL.md exactly
- [ ] `pip install -e packages/core` works
- [ ] `pip install -e packages/agents` works

**Commit:** `chore: restructure project for agent architecture`

---

### Task 0.2: Define core financial models

**Scope:** Pydantic models for transactions, accounts—form-agnostic

**File:** `packages/core/src/vindicate_core/models/financial.py`

**Models to create:**
```python
class Transaction(BaseModel): ...      # Single transaction
class BankAccount(BaseModel): ...      # Account with transactions
class FinancialPeriod(BaseModel): ...  # Date range summary
class MonthlyBreakdown(BaseModel): ... # Categorized monthly totals
```

**Acceptance Criteria:**
- [ ] All models use `Decimal` for amounts
- [ ] All models have Field descriptions
- [ ] All models have `model_config` with examples
- [ ] `TransactionCategory` enum defined
- [ ] Unit tests in `packages/core/tests/test_models_financial.py`
- [ ] 100% test coverage on models

**Commit:** `feat(core): add financial transaction models`

---

### Task 0.3: Define audit trail models

**Scope:** Models for tracking extraction provenance

**File:** `packages/core/src/vindicate_core/models/audit.py`

**Models to create:**
```python
class AuditSource(BaseModel): ...       # Document/page/line reference
class AuditEntry(BaseModel): ...        # Single audit event
class AuditWarning(BaseModel): ...      # Flagged for human review
class AuditError(BaseModel): ...        # Processing error
class AuditTrail(BaseModel): ...        # Complete run audit
```

**Acceptance Criteria:**
- [ ] `AuditSource` captures document, page, line, bounding_box, raw_text
- [ ] `AuditTrail` has methods: `add_entry()`, `add_warning()`, `add_error()`
- [ ] All timestamps use UTC
- [ ] Serializes to JSON cleanly
- [ ] Unit tests with 100% coverage

**Commit:** `feat(core): add audit trail models`

---

### Task 0.4: Define agent interfaces

**Scope:** Abstract protocols that any framework must implement

**File:** `packages/agents/src/vindicate_agents/interfaces/base.py`

**Interfaces to create:**
```python
class AgentProtocol(Protocol[InputT, OutputT]): ...
class PipelineProtocol(Protocol): ...
class AgentResult(BaseModel): ...  # Standardized result wrapper
```

**Acceptance Criteria:**
- [ ] Uses `typing.Protocol` for duck typing
- [ ] Generic input/output types
- [ ] Includes `async process()` method signature
- [ ] Includes `validate_input()` method signature
- [ ] Does NOT import any LLM framework
- [ ] Docstrings explain the contract

**Commit:** `feat(agents): define framework-agnostic agent interfaces`

---

### Task 0.5: Define pipeline data types

**Scope:** Data types passed between agents in the pipeline

**File:** `packages/agents/src/vindicate_agents/interfaces/types.py`

**Types to create:**
```python
class RawDocument(BaseModel): ...         # Agent 1 output
class ExtractedTransactions(BaseModel): ... # Agent 2 output
class ClassifiedTransactions(BaseModel): ... # Agent 3 output
class ValidatedTransactions(BaseModel): ... # Agent 4 output
class FinancialModel(BaseModel): ...      # Agent 5 output (final)
```

**Acceptance Criteria:**
- [ ] Each type includes audit trail reference
- [ ] Each type includes confidence scores
- [ ] Each type includes warnings list
- [ ] Clear progression from raw → final
- [ ] Unit tests validate structure

**Commit:** `feat(agents): define pipeline data types`

---

### Task 0.6: Create custom exceptions

**Scope:** Error types for consistent error handling

**File:** `packages/core/src/vindicate_core/exceptions.py`

**Exceptions to create:**
```python
class VindicateError(Exception): ...
class ExtractionError(VindicateError): ...
class ValidationError(VindicateError): ...
class AgentError(VindicateError): ...
class ConfigurationError(VindicateError): ...
```

**Acceptance Criteria:**
- [ ] All inherit from `VindicateError`
- [ ] Include relevant context (source, agent_name, etc.)
- [ ] Include `recoverable: bool` where appropriate
- [ ] Docstrings with examples

**Commit:** `feat(core): add custom exception hierarchy`

---

### Task 0.7: Create configuration system

**Scope:** Pydantic Settings for pipeline configuration

**File:** `packages/agents/src/vindicate_agents/config.py`

**Config to create:**
```python
class LLMConfig(BaseSettings): ...       # Model, temperature, etc.
class PipelineConfig(BaseSettings): ...  # Which agents, debug mode
class VindicateConfig(BaseSettings): ... # Root config combining all
```

**Acceptance Criteria:**
- [ ] Uses `pydantic-settings` for env var support
- [ ] Sensible defaults (Gemini Flash, etc.)
- [ ] `DEBUG_MODE` flag for human-in-loop logging
- [ ] Validates on instantiation
- [ ] Can load from `.env` file

**Commit:** `feat(agents): add configuration system`

---

## Phase 0 Complete Checklist

Before moving to Phase 1:

- [ ] All Task 0.x commits merged to main
- [ ] `pip install -e packages/core` works
- [ ] `pip install -e packages/agents` works
- [ ] All tests pass: `pytest packages/`
- [ ] No import errors between packages
- [ ] Old code archived but not blocking

---

## Phase 1: Google ADK Integration (Preview)

> **Do not start until Phase 0 is complete**

| Task | Scope |
|------|-------|
| 1.1 | Set up Google ADK dependency, API key config |
| 1.2 | Implement `IngestionAgentADK` (PDF → raw text) |
| 1.3 | Implement `ExtractionAgentADK` (text → transactions) |
| 1.4 | Implement `ClassificationAgentADK` (credit/debit, category) |
| 1.5 | Implement `ValidationAgentADK` (cross-check, flag issues) |
| 1.6 | Implement `AggregationAgentADK` (combine → FinancialModel) |
| 1.7 | Wire up pipeline orchestration |
| 1.8 | Integration test with real bank statement |

---

## How to Execute Tasks

### Starting a Task

```
I'm starting Task 0.2: Define core financial models.

Please read /mnt/skills/user/vindicate/SKILL.md first, then implement 
packages/core/src/vindicate_core/models/financial.py following the 
standards. Include unit tests.
```

### Completing a Task

```
Task 0.2 complete. 

Summary:
- Created Transaction, BankAccount, FinancialPeriod, MonthlyBreakdown models
- Created TransactionCategory enum with 15 categories
- All use Decimal for amounts
- 12 unit tests, 100% coverage

Ready for review and commit.
```

---

## Notes for Claude Code

1. **One task per session** - Don't try to do multiple tasks
2. **Read SKILL.md first** - Every time, even if you think you remember
3. **Tests before commit** - Run `pytest` and show output
4. **Small commits** - Each task = one commit
5. **Ask if unclear** - Don't guess on requirements
