-- 017: Add document processing columns for AI extraction pipeline

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'needs_review', 'skipped')),
  ADD COLUMN IF NOT EXISTS extracted_data JSONB,
  ADD COLUMN IF NOT EXISTS extraction_confidence REAL,
  ADD COLUMN IF NOT EXISTS extraction_model TEXT,
  ADD COLUMN IF NOT EXISTS extraction_tokens_used INTEGER,
  ADD COLUMN IF NOT EXISTS extraction_cost REAL,
  ADD COLUMN IF NOT EXISTS auto_classified_type TEXT;
