# Phase 9: Document Intelligence — Spec & Cost Analysis

## Overview

When a user uploads a document (credit report, bank statement, pay stub, medical bill, etc.), automatically extract structured data and populate the appropriate database tables — accounts, transactions, income, expenses.

## LLM Comparison for Document Extraction

### Requirements
- **Input**: PDF pages rendered as images (most reliable — avoids PDF text extraction issues)
- **Output**: Structured JSON matching our schema
- **Key traits**: Consistent JSON output, good with tables/numbers, handles poor scans

### Model Comparison

| Model | Vision | Structured Output | Cost (input/output per 1M tokens) | Best For |
|-------|--------|-------------------|-------------------------------------|----------|
| **GPT-4.1** | ✅ Excellent | ✅ JSON mode + function calling | $2.00 / $8.00 | Best balance of accuracy + cost |
| **GPT-4.1 mini** | ✅ Good | ✅ JSON mode + function calling | $0.40 / $1.60 | High volume, simpler docs |
| **GPT-4.1 nano** | ✅ Decent | ✅ JSON mode | $0.10 / $0.40 | Bulk processing, tight budgets |
| **GPT-5 mini** | ✅ Great | ✅ JSON mode | $0.25 / $2.00 | Complex reasoning on docs |
| **Claude Sonnet 4** | ✅ Excellent | ✅ Tool use | $3.00 / $15.00 | Complex layouts, nuance |
| **Claude Haiku 4** | ✅ Good | ✅ Tool use | $0.80 / $4.00 | Fast, cheaper Claude option |
| **Gemini 2.5 Flash** | ✅ Great | ✅ JSON mode | $0.15 / $0.60 | Cheapest quality option |
| **Gemini 2.5 Pro** | ✅ Excellent | ✅ JSON mode | $1.25 / $10.00 | Complex multi-page docs |

### Recommendation: **GPT-4.1 mini** (primary) + **GPT-4.1** (fallback)

**Why GPT-4.1 mini:**
1. **Structured Outputs** — OpenAI's JSON mode with schema enforcement is the most reliable for consistent extraction. No malformed JSON.
2. **Vision quality** — Handles tables, fine print, and messy scans well
3. **Cost-effective** — $0.40/$1.60 per 1M tokens is 4-7x cheaper than Claude Sonnet
4. **Speed** — Fast inference, important for user-facing uploads
5. **128K context** — Can handle multi-page documents in a single call

**Fallback to GPT-4.1** for:
- Documents where mini's extraction quality is insufficient
- Complex multi-page credit reports with dense tables
- When confidence score from mini is below threshold

**Why not others:**
- Claude: Better at nuance but 4x more expensive and no native JSON schema enforcement
- Gemini Flash: Cheapest but less consistent on structured extraction in practice
- GPT-5 mini: Overkill reasoning for extraction tasks, 5x output cost vs 4.1 mini

## Cost Estimates Per Document

### Token Budget (typical document)

| Document Type | Pages | Image Tokens (input) | JSON Output Tokens | Total Tokens |
|---------------|-------|---------------------|-------------------|-------------|
| Bank Statement | 3-5 | ~3,000-5,000 | ~800-1,500 | ~5,000-6,500 |
| Credit Report | 10-30 | ~10,000-30,000 | ~2,000-5,000 | ~12,000-35,000 |
| Pay Stub | 1 | ~1,000 | ~300-500 | ~1,500 |
| Medical Bill | 1-3 | ~1,000-3,000 | ~500-1,000 | ~2,000-4,000 |
| Tax Document (W-2) | 1 | ~1,000 | ~400-600 | ~1,500 |
| Tax Return (1040) | 2-4 | ~2,000-4,000 | ~1,000-2,000 | ~3,000-6,000 |

*Image tokens: ~765 tokens per page at low detail, ~1,100+ at high detail (OpenAI vision)*

### Cost Per Document (GPT-4.1 mini)

| Document Type | Est. Cost | Notes |
|---------------|-----------|-------|
| Bank Statement (3 pg) | $0.003-0.005 | ~$0.002 input + $0.002 output |
| Credit Report (20 pg) | $0.01-0.03 | May need chunking for long reports |
| Pay Stub (1 pg) | $0.001 | Trivial cost |
| Medical Bill (2 pg) | $0.002 | Simple extraction |
| W-2 / Tax Doc (1 pg) | $0.001 | Structured form, easy |
| Tax Return (3 pg) | $0.003-0.005 | Multiple schedules |

### Monthly Cost Scenarios

| Usage Level | Documents/Month | Est. Monthly Cost |
|-------------|-----------------|-------------------|
| Light (1 user testing) | 5-10 | $0.01-0.05 |
| Active single user | 20-30 | $0.05-0.15 |
| 10 active users | 200-300 | $0.50-1.50 |
| 100 active users | 2,000-3,000 | $5-15 |
| 1,000 active users | 20,000-30,000 | $50-150 |

**Bottom line: Document extraction is essentially free at MVP/small scale.** Even at 1,000 users, it's under $150/month.

## Architecture

```
Upload Flow:
                                                   ┌──────────────┐
User drops file → Supabase Storage → Trigger ──────┤ Processing   │
                                                    │ Queue        │
                                                    └──────┬───────┘
                                                           │
                                                    ┌──────▼───────┐
                                                    │ Document     │
                                                    │ Processor    │
                                                    │ (API Route)  │
                                                    └──────┬───────┘
                                                           │
                                              ┌────────────┼────────────┐
                                              ▼            ▼            ▼
                                         PDF → Images  Classify    Extract
                                         (pdf-to-img)  (LLM)      (LLM)
                                                           │
                                                    ┌──────▼───────┐
                                                    │ Normalize &  │
                                                    │ Insert to DB │
                                                    └──────────────┘
```

## Tasks

### 9.1: Document Processing Pipeline
- API route: `POST /api/documents/process`
- Accept document ID, fetch file from Supabase Storage
- Convert PDF pages to images (use `pdf-lib` or `pdfjs-dist` for page extraction)
- For image files, use directly
- Queue mechanism (simple: process inline; later: background job queue)
- Status tracking: `processing_status` column on documents table (pending, processing, completed, failed, needs_review)
- Processing result stored as JSONB on documents table

### 9.2: Document Classification
- Send first page to LLM: "What type of financial document is this?"
- Auto-set document type if user selected "other"
- Confidence score — if low, flag for user review
- Detect: bank statement, credit report, pay stub, W-2, 1099, medical bill, collection letter, court summons

### 9.3: Data Extraction Schemas
Define JSON schemas for each document type:

**Bank Statement:**
```json
{
  "bank_name": "string",
  "account_type": "checking|savings",
  "account_last_four": "string",
  "statement_period": { "start": "date", "end": "date" },
  "opening_balance": "number",
  "closing_balance": "number",
  "transactions": [
    { "date": "date", "description": "string", "amount": "number", "type": "debit|credit", "category": "string" }
  ]
}
```

**Credit Report:**
```json
{
  "bureau": "equifax|experian|transunion",
  "report_date": "date",
  "credit_score": "number|null",
  "accounts": [
    {
      "creditor_name": "string",
      "account_number_last_four": "string",
      "account_type": "string",
      "status": "string",
      "balance": "number",
      "credit_limit": "number|null",
      "date_opened": "date",
      "payment_status": "string",
      "past_due_amount": "number"
    }
  ],
  "inquiries": [...],
  "public_records": [...]
}
```

**Pay Stub:**
```json
{
  "employer_name": "string",
  "pay_period": { "start": "date", "end": "date" },
  "gross_pay": "number",
  "net_pay": "number",
  "deductions": [{ "name": "string", "amount": "number" }],
  "ytd_gross": "number",
  "ytd_net": "number"
}
```

(Similar schemas for W-2, medical bill, tax return)

### 9.4: Normalization & DB Insert
After extraction, map to existing tables:

- **Bank statement transactions** → `budget_expenses` + `budget_income` (categorized)
- **Credit report accounts** → `accounts` table (create/update, detect new accounts)
- **Pay stub** → `budget_income` (recurring income entry)
- **Medical bill** → `accounts` (medical debt) + `documents` link
- **W-2** → `budget_income` (annual income reference)

User review step: show extracted data before committing to DB
- "We found 3 new accounts on your credit report. Add them?"
- "47 transactions extracted from your bank statement. Review?"

### 9.5: Processing Status UI
- Upload progress → processing spinner → extraction results → review & confirm
- Document detail view shows extracted data
- Edit extracted data before saving
- Re-process button if extraction was poor
- Processing status badge on document cards

### 9.6: OpenAI API Integration
- Create `packages/web/src/lib/ai/document-processor.ts`
- API route handles the LLM call server-side (keeps API key secure)
- Structured output with JSON schema enforcement
- Retry logic with exponential backoff
- Rate limiting (respect OpenAI limits)
- Error handling with user-friendly messages
- Cost tracking per extraction (log tokens used)

## Environment Requirements
- `OPENAI_API_KEY` in server environment
- `pdf-lib` or `pdfjs-dist` for PDF handling
- Add `processing_status` and `extracted_data` columns to documents table

## Migration

```sql
-- 017_document_processing.sql
ALTER TABLE public.documents
  ADD COLUMN processing_status TEXT DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'needs_review')),
  ADD COLUMN extracted_data JSONB,
  ADD COLUMN extraction_confidence REAL,
  ADD COLUMN extraction_model TEXT,
  ADD COLUMN extraction_tokens_used INTEGER,
  ADD COLUMN extraction_cost REAL;
```

## Acceptance Criteria
- [ ] Upload a bank statement PDF → see extracted transactions
- [ ] Upload a credit report → see extracted accounts with option to add to dashboard
- [ ] Upload a pay stub → income entry created
- [ ] Processing status visible in UI (spinner, progress, done)
- [ ] User can review and edit extracted data before committing
- [ ] Extraction cost logged per document
- [ ] Graceful failure: if extraction fails, document still saved, user notified
- [ ] Works with GPT-4.1 mini, falls back to GPT-4.1 on low confidence

## Non-Goals (Phase 9)
- No OCR preprocessing (rely on LLM vision handling scans)
- No real-time streaming of extraction progress
- No batch processing UI
- No training/fine-tuning
