-- 006: Cases table

CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,

  type public.case_type NOT NULL,
  status public.case_status_type NOT NULL DEFAULT 'draft',
  status_history JSONB DEFAULT '[]'::jsonb,

  -- Details
  title TEXT NOT NULL,
  description TEXT,
  case_number TEXT,

  -- Credit bureau disputes
  credit_bureau public.credit_bureau,
  dispute_reason TEXT,

  -- Lawsuits
  court_name TEXT,
  court_address TEXT,
  judge_name TEXT,
  opposing_counsel TEXT,

  -- Key Dates
  date_filed DATE,
  response_deadline DATE,
  hearing_date DATE,
  resolution_date DATE,

  -- Outcome
  outcome public.case_outcome,
  outcome_details TEXT,
  settlement_amount NUMERIC(10,2),

  -- Relations
  document_ids TEXT[] DEFAULT '{}',
  activity_ids TEXT[] DEFAULT '{}',

  -- Reminders (embedded JSONB)
  reminders JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.cases IS 'Legal and dispute cases';
