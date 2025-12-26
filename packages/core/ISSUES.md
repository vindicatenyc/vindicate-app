# Known Issues and Resolution History

This document tracks all issues encountered during development, approaches tried to fix them, and their current status.

**Last Updated:** December 25, 2025

---

## Issue #1: Payroll Deposits Classified as Expenses (CRITICAL)

**Status:** RESOLVED

### Problem
HHAX and Housing & Family payroll deposits were being marked as **debits (expenses)** instead of **credits (income)**, causing the monthly budget to show completely wrong numbers.

### Impact
- 25 HHAX transactions totaling **$90,008** marked as expenses instead of income
- Budget showed **$1,291.64** average monthly income instead of **$13,378.93**
- Net cashflow showed **-$23,887.92** instead of **+$286.66**
- Form 433-A disposable income calculations were significantly wrong

### Root Cause
In `transaction_extractor.py` lines 481-489, the credit detection keyword list was missing common payroll identifiers:

```python
# BEFORE (broken):
is_credit = any(kw in line.lower() for kw in [
    'deposit', 'credit', 'zelle payment from', 'transfer from'
])
is_debit = has_parens or not is_credit  # <-- HHAX "Payroll PPD" failed this check
```

The keyword "payroll" and "ppd" (ACH Prearranged Payment and Deposit) were not in the list, so payroll deposits defaulted to `is_debit = True`.

### Fix Applied
Added payroll-related keywords to the credit detection list:

```python
# AFTER (fixed):
credit_keywords = [
    'deposit', 'credit', 'zelle payment from', 'transfer from',
    'payroll', 'direct dep', 'ppd', 'ach credit',  # <-- ADDED
    'refund', 'cashback', 'interest', 'dividend',
]
is_credit = any(kw in line.lower() for kw in credit_keywords)
```

### Verification
After fix, October 2025 Chase statement shows:
- Homecare Softwar Payroll: **$3,672.99** and **$3,760.05** (correctly as credits)
- Housing& Family Payroll: **$910.88** and **$910.89** (correctly as credits)
- Total October income: **$10,747.73** (was incorrectly $1,156)

---

## Issue #2: LLM Extraction JSON Parsing Failure

**Status:** OPEN

### Problem
When using `--use-llm-transactions` flag with Claude API, the LLM extraction fails with "Failed to parse JSON from LLM response" for bank statements with many transactions.

### Root Cause
Claude's response for a full bank statement (200+ transactions) is too long and sometimes malformed:
- Response exceeds expected JSON structure
- Claude may include markdown code blocks or explanatory text
- Large context = slower response and potential truncation

### Approaches Tried
1. **Claude Sonnet 4** (`claude-sonnet-4-20250514`) - Failed on large statements
2. **JSON parsing with fallback patterns** - Implemented but still fails on edge cases
3. **Truncating document to 50,000 chars** - Helps but loses transaction data

### Current Behavior
- LLM extraction attempts first
- On failure, falls back to regex extraction (which now works correctly)
- Warning logged: `llm_extraction_failed error='Failed to parse JSON from LLM response'`

### Recommended Fix
Replace Claude API with **Ollama** (local LLM):
- Free, unlimited usage
- Faster (no network latency)
- Private (financial data never leaves machine)
- See plan in `~/.claude/plans/abundant-painting-sphinx.md`

---

## Issue #3: Claude API Credits/Cost

**Status:** OPEN

### Problem
Claude API requires paid credits and is expensive for production use:
- ~$0.03-0.13 per bank statement
- 40+ statements = $1.20-5.20 per analysis run
- Rate limits apply

### Error Encountered
```
Error code: 400 - 'Your credit balance is too low to access the Anthropic API.
Please go to Plans & Billing to upgrade or purchase credits.'
```

### Current Workaround
- Use regex extraction (default, no `--use-llm-transactions` flag)
- Regex now works correctly after Issue #1 fix

### Recommended Fix
Implement **Ollama** integration for local, free LLM:
```bash
brew install ollama
ollama pull llama3.2
ollama serve
```
Then use `--validate-with-llm` for optional local validation.

---

## Issue #4: Parentheses Override Credit Detection

**Status:** OPEN (Low Priority)

### Problem
If an amount has parentheses (e.g., `(1,234.56)`), the code forces it to be a debit regardless of credit keywords.

### Location
`transaction_extractor.py` line 490:
```python
has_parens = amount_match.group(1) and amount_match.group(3)
is_debit = has_parens or not is_credit  # <-- Parentheses override keywords!
```

### Impact
Some banks use parentheses for formatting, not to indicate debits. This could cause false negatives.

### Workaround
None currently. LLM extraction handles this correctly but has its own issues (see Issue #2).

### Recommended Fix
Change logic to:
```python
is_debit = has_parens and not is_credit  # Only if BOTH conditions true
```
Or remove parentheses check entirely and rely solely on keywords.

---

## Issue #5: Fragile Keyword Matching

**Status:** PARTIALLY RESOLVED

### Problem
Credit/debit detection requires exact substring matches. Abbreviations, typos, or slight variations fail.

### Examples
| Transaction Description | Detected As | Should Be |
|------------------------|-------------|-----------|
| "DIRECT DEPOSIT PAYROLL" | Credit | Credit |
| "DIRECT DEP." | Debit (WRONG) | Credit |
| "PPD #12345" | Credit | Credit |
| "P.P.D. DEPOSIT" | Debit (WRONG) | Credit |

### Fix Applied
Added more keyword variations:
```python
credit_keywords = [
    'deposit', 'credit', 'zelle payment from', 'transfer from',
    'payroll', 'direct dep', 'ppd', 'ach credit',
    'refund', 'cashback', 'interest', 'dividend',
]
```

### Remaining Gaps
- Period-separated abbreviations (e.g., "D.D.", "P.P.D.")
- Typos or OCR errors
- Non-standard bank terminology

### Recommended Future Fix
- Use fuzzy matching (e.g., `fuzzywuzzy` library)
- Or use local LLM for ambiguous cases

---

## Issue #6: Table vs Text Parsing Logic

**Status:** OPEN (Low Priority)

### Problem
Text parsing only runs if NO tables are found on a page. If tables exist but are malformed, text parsing is skipped.

### Location
`transaction_extractor.py` lines 382-392:
```python
tables = page.extract_tables()
for table in tables:
    txns = self._parse_table(table, file_name, statement_date)
    transactions.extend(txns)

# If no tables found, try text parsing
if not tables:  # <-- Only if NO tables at all
    text = page.extract_text() or ""
    txns = self._parse_text(text, file_name, statement_date)
```

### Impact
- Some bank statements have partial/broken tables
- Valid transactions in text get skipped
- Results in missing transactions

### Recommended Fix
Always try both methods and deduplicate:
```python
# Try table extraction
for table in tables:
    txns = self._parse_table(...)
    transactions.extend(txns)

# Also try text parsing
text = page.extract_text() or ""
text_txns = self._parse_text(...)
# Deduplicate by date + amount + description
```

---

## Issue #7: Verizon Cell vs Internet Categorization

**Status:** RESOLVED

### Problem
Verizon bills were incorrectly categorized based on text content rather than filename context.

### Fix Applied
Updated utility categorization in `data_mapper.py` to check filename FIRST before text body, and reordered pattern matching.

---

## Issue #8: Transaction Amounts Too Small

**Status:** RESOLVED

### Problem
Transaction amounts were showing small values ($10-20) instead of actual amounts ($1,000+).

### Root Cause
Generic amount pattern was matching partial numbers or formatting artifacts.

### Fix Applied
Changed amount pattern to look for amounts at END of line with exactly 2 decimal places:
```python
end_amount_pattern = re.compile(r'(\d{1,3}(?:,\d{3})*\.\d{2})\s*$')
```

---

## Summary Table

| Issue | Status | Priority | Impact |
|-------|--------|----------|--------|
| #1 Payroll as Expenses | RESOLVED | Critical | Budget completely wrong |
| #2 LLM JSON Parsing | OPEN | Medium | LLM fallback broken |
| #3 API Credits/Cost | OPEN | Medium | Production cost concern |
| #4 Parentheses Override | OPEN | Low | Edge case false negatives |
| #5 Fragile Keywords | PARTIAL | Medium | Some transactions missed |
| #6 Table vs Text | OPEN | Low | Some transactions missed |
| #7 Verizon Categorization | RESOLVED | Low | Wrong utility category |
| #8 Small Amounts | RESOLVED | High | Wrong transaction amounts |

---

## Recommended Next Steps

1. **Implement Ollama integration** for free, local LLM validation
2. **Add fuzzy keyword matching** to handle abbreviations and typos
3. **Improve table/text parsing** to try both methods and deduplicate
4. **Add unit tests** for payroll credit detection scenarios
