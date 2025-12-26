# Architecture Snapshot

**Vindicate Core - Financial Document Processing System**

**Snapshot Date:** December 25, 2025
**Version:** 0.1.0

---

## Overview

Vindicate Core is a Python package for processing financial documents to generate IRS Form 433-A (Collection Information Statement) analysis for Offer in Compromise (OIC) evaluations.

---

## Module Structure

```
packages/core/
├── src/vindicate_core/
│   ├── __init__.py                    # Package exports (78+ public APIs)
│   ├── models.py                      # Pydantic data models (~1100 LOC)
│   ├── calculator.py                  # OIC calculations (~800 LOC)
│   ├── irs_standards.py               # IRS National/Local Standards
│   ├── pdf_parser.py                  # PDF text/table extraction
│   ├── data_mapper.py                 # Document aggregation & mapping
│   ├── transaction_extractor.py       # Bank transaction extraction (~700 LOC)
│   ├── report_generator.py            # Multi-format report generation
│   ├── llm_extractor.py               # Claude API extraction (optional)
│   └── llm_transaction_extractor.py   # Claude transaction extraction (optional)
├── examples/
│   └── process_documents.py           # Main CLI entry point
├── tests/
│   └── test_form_433a_calculator.py
├── .env                               # API keys (ANTHROPIC_API_KEY)
└── pyproject.toml                     # Dependencies
```

---

## Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INPUT: PDF Documents                          │
│   (Bank Statements, Pay Stubs, W-2s, 1099s, Utility Bills, etc.)       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: PDF Discovery                                                  │
│  ├─ Recursive folder scan                                               │
│  └─ Find all .pdf files                                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: PDF Parsing (pdf_parser.py)                                    │
│  ├─ PDFParser: Text extraction (PyPDF2 + pdfplumber)                    │
│  ├─ DocumentAnalyzer: Auto-detect document type                         │
│  ├─ BankStatementParser: Extract balances, transactions                 │
│  └─ PayStubParser: Extract income, deductions, YTD                      │
│                                                                         │
│  Output: DocumentExtractionResult with amounts, dates, text             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Data Aggregation (data_mapper.py)                              │
│  ├─ DocumentDataMapper: Combine all extracted data                      │
│  ├─ Taxpayer/Spouse separation by name matching                         │
│  ├─ Non-household member exclusion                                      │
│  ├─ Duplicate detection and deduplication                               │
│  └─ Extraction audit trail with confidence scores                       │
│                                                                         │
│  Optional: LLM fallback (--use-llm-fallback) for difficult extractions  │
│                                                                         │
│  Output: AggregatedData with PersonData, BankAccountData, audit trail   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Form 433-A Construction                                        │
│  ├─ Populate Form433A Pydantic model                                    │
│  ├─ Map income sources to Employment records                            │
│  ├─ Map bank accounts, assets, debts                                    │
│  └─ Determine filing status and family size                             │
│                                                                         │
│  Output: Form433A model (complete financial snapshot)                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: OIC Calculations (calculator.py + irs_standards.py)            │
│  ├─ Form433ACalculator: Main calculation engine                         │
│  ├─ Calculate monthly gross income from all sources                     │
│  ├─ Apply IRS National Standards by state/family size                   │
│  ├─ Compare actual expenses vs allowed expenses                         │
│  ├─ Calculate monthly disposable income                                 │
│  ├─ Calculate net realizable equity (80% Quick Sale Value)              │
│  ├─ Calculate RCP (Lump Sum = 12 months, Periodic = 24 months)          │
│  └─ Determine CNC eligibility                                           │
│                                                                         │
│  Output: Form433AResult with RCP, CNC, recommendations                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Report Generation (report_generator.py)                        │
│  ├─ Form433AReportGenerator: Main analysis report                       │
│  ├─ Formats: text, markdown, HTML, PDF                                  │
│  └─ Includes extraction sources and audit trail                         │
│                                                                         │
│  Output: form_433a_report.{txt,md,html,pdf}                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 7: Worksheet Generation (optional, --generate-worksheet)          │
│  ├─ Form433AWorksheetGenerator: Detailed line-by-line breakdown         │
│  └─ Maps to IRS Form 433-A line numbers                                 │
│                                                                         │
│  Output: form_433a_worksheet.{txt,md,html}                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 8: Budget Analysis (optional, --generate-budget)                  │
│  ├─ TransactionExtractor: Extract transactions from bank statements     │
│  │   ├─ Method 1: Regex/table extraction (default, fast)                │
│  │   └─ Method 2: LLM extraction (--use-llm-transactions, accurate)     │
│  ├─ Categorize transactions (30+ categories)                            │
│  ├─ Aggregate by month                                                  │
│  └─ MonthlyBudgetReportGenerator: Generate budget reports               │
│                                                                         │
│  Output: monthly_budget.{txt,md,html,pdf}                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Classes

### Data Models (`models.py`)

| Class | Purpose |
|-------|---------|
| `Form433A` | Complete Form 433-A data structure |
| `Form433AResult` | Calculation results (RCP, CNC, recommendations) |
| `Form433AWorksheet` | Line-item breakdown matching IRS form |
| `PersonalInfo` | Taxpayer/spouse details, filing status |
| `Employment` | Employment and income records |
| `LivingExpenses` | Expense breakdown by IRS category |
| `BankAccount` | Bank account details with balances |
| `RealProperty` | Real estate with Quick Sale Value |
| `Vehicle` | Vehicle assets with loan tracking |
| `BankTransaction` | Individual transaction with category |
| `MonthlyBudget` | Aggregated monthly spending |
| `TransactionCategory` | Enum with 30+ transaction types |

### Calculators (`calculator.py`)

| Class | Purpose |
|-------|---------|
| `Form433ACalculator` | Full Form 433-A analysis per IRS OIC methodology |
| `DisposableIncomeCalculator` | Legacy simple calculator |

### Extractors

| Class | File | Purpose |
|-------|------|---------|
| `PDFParser` | `pdf_parser.py` | General PDF text extraction |
| `BankStatementParser` | `pdf_parser.py` | Bank-specific extraction |
| `PayStubParser` | `pdf_parser.py` | Pay stub extraction |
| `DocumentDataMapper` | `data_mapper.py` | Document aggregation |
| `TransactionExtractor` | `transaction_extractor.py` | Transaction categorization |
| `LLMExtractor` | `llm_extractor.py` | Claude-based extraction (optional) |
| `LLMTransactionExtractor` | `llm_transaction_extractor.py` | Claude transaction extraction (optional) |

### Generators (`report_generator.py`)

| Class | Purpose |
|-------|---------|
| `Form433AReportGenerator` | Multi-format Form 433-A reports |
| `Form433AWorksheetGenerator` | Detailed worksheet with IRS line numbers |
| `MonthlyBudgetReportGenerator` | Budget analysis reports with PDF |

---

## CLI Interface

**Entry Point:** `examples/process_documents.py`

### Required Arguments

| Argument | Description |
|----------|-------------|
| `folder` | Path to folder containing PDF documents |
| `--taxpayer, -t` | Full name of primary taxpayer |

### Optional Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--spouse, -s` | None | Spouse name (married filing jointly) |
| `--output, -o` | "." | Output directory for reports |
| `--state` | "NY" | State for IRS standards lookup |
| `--no-recursive` | False | Don't scan subfolders |
| `--verbose, -v` | False | Show detailed output |
| `--json-only` | False | Only output JSON, skip reports |
| `--use-llm-fallback` | False | Use Claude for difficult extractions |
| `--generate-worksheet` | False | Generate Form 433-A worksheet |
| `--generate-budget` | False | Generate monthly budget from transactions |
| `--budget-months` | 3 | Number of months to analyze |
| `--use-llm-transactions` | False | Use Claude for transaction extraction |

### Example Usage

```bash
# Basic single filer
python examples/process_documents.py /path/to/docs --taxpayer "John Smith"

# Married with full analysis
python examples/process_documents.py /path/to/docs \
  --taxpayer "David Rutgos" \
  --spouse "Alisa Oblow Rutgos" \
  --state NY \
  --generate-worksheet \
  --generate-budget

# With LLM transaction extraction
python examples/process_documents.py /path/to/docs \
  --taxpayer "John Smith" \
  --generate-budget \
  --use-llm-transactions
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For LLM features | Claude API key |

### .env File

Location: `packages/core/.env`

```bash
# Anthropic API Key for LLM-based extraction
ANTHROPIC_API_KEY=sk-ant-api03-...
```

The CLI automatically loads `.env` from the package root using `python-dotenv`.

---

## Output Files

### Default Output

```
output_directory/
├── extraction_summary.json      # Complete audit trail
├── form_433a_report.txt         # Text report
├── form_433a_report.md          # Markdown report
├── form_433a_report.html        # HTML report
└── form_433a_report.pdf         # PDF report (if reportlab available)
```

### With `--generate-worksheet`

```
├── form_433a_worksheet.txt
├── form_433a_worksheet.md
└── form_433a_worksheet.html
```

### With `--generate-budget`

```
├── monthly_budget.txt
├── monthly_budget.md
├── monthly_budget.html
└── monthly_budget.pdf
```

---

## Dependencies

### Core Dependencies

```toml
pydantic>=2.5.0          # Data validation
httpx>=0.25.0            # HTTP client
PyPDF2>=3.0.0            # PDF reading
pdfplumber>=0.11.0       # PDF table extraction
python-docx>=1.0.0       # Word document support
openpyxl>=3.1.0          # Excel support
cryptography>=41.0.0     # Encryption support
structlog>=23.2.0        # Structured logging
reportlab>=4.0.0         # PDF generation
python-dotenv            # Environment variables
```

### Optional Dependencies

```toml
anthropic>=0.39.0        # Claude API (for --use-llm-* flags)
```

### Dev Dependencies

```toml
pytest, pytest-cov, pytest-asyncio, pytest-benchmark
hypothesis, black, ruff, mypy
```

---

## Transaction Extraction Architecture

### Dual-Mode Extraction

```
Bank Statement PDF
        │
        ▼
┌─────────────────────────────────────┐
│     TransactionExtractor            │
│                                     │
│  if use_llm=True:                   │
│    ├─ Try LLM extraction first      │
│    │   (LLMTransactionExtractor)    │
│    │                                │
│    └─ On failure: fallback to regex │
│                                     │
│  else:                              │
│    └─ Use regex extraction          │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│     Credit/Debit Detection          │
│                                     │
│  Credit keywords:                   │
│  - deposit, credit, payroll         │
│  - direct dep, ppd, ach credit      │
│  - refund, cashback, interest       │
│  - zelle payment from, transfer from│
│                                     │
│  Default: If no credit keyword      │
│           found → mark as debit     │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│     Transaction Categorization      │
│                                     │
│  30+ categories including:          │
│  - paycheck, income, transfer_in    │
│  - rent, mortgage, utilities        │
│  - groceries, restaurants           │
│  - gas, rideshare, transit          │
│  - healthcare, pharmacy             │
│  - amazon, shopping, clothing       │
│  - atm, fees, other                 │
└─────────────────────────────────────┘
        │
        ▼
    BankTransaction objects
```

---

## IRS Standards (2025-Q1)

### National Standards (Food/Clothing/Misc)

| Family Size | Monthly Allowance |
|-------------|-------------------|
| 1 person | $841 |
| 2 people | $1,410 |
| 3 people | $1,640 |
| 4 people | $1,937 |
| 5+ people | +$358 per person |

### Healthcare Standards

| Age Group | Monthly Per Person |
|-----------|-------------------|
| Under 65 | $75 |
| 65 and over | $153 |

### Housing Standards (NY Example)

| Family Size | Monthly Allowance |
|-------------|-------------------|
| 1 person | $3,110 |
| 2 people | $3,649 |
| 3 people | $3,704 |
| 4 people | $3,879 |
| 5+ people | $4,265 |

---

## Current State Summary

### Working Features
- PDF parsing for 10+ document types
- Form 433-A model population
- IRS OIC calculations with National/Local Standards
- Multi-format report generation (text, markdown, HTML, PDF)
- Form 433-A worksheet generation
- Monthly budget extraction from bank statements
- Transaction categorization with 30+ categories
- Taxpayer/spouse document separation
- Extraction audit trail

### Recent Fixes
- Payroll deposits now correctly classified as credits
- Added 'payroll', 'ppd', 'direct dep' to credit keywords
- Budget now shows accurate income (~$13,378 instead of ~$1,291)

### Known Limitations
- LLM extraction unreliable for large statements (JSON parsing issues)
- Claude API requires paid credits
- Keyword matching is exact (no fuzzy matching)
- Text parsing only runs if no tables found

### Recommended Improvements
- Implement Ollama for free, local LLM validation
- Add fuzzy keyword matching
- Improve table/text parsing fallback logic
- Add more unit tests for payroll detection
