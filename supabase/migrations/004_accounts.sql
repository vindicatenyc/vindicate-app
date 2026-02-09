-- 004: Accounts table

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Creditor Information
  creditor_name TEXT NOT NULL,
  collector_name TEXT,
  account_number TEXT,
  creditor_phone TEXT,
  creditor_address TEXT,
  creditor_email TEXT,

  -- Financial Details
  original_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(6,4),
  minimum_payment NUMERIC(10,2),

  -- Status & Tracking
  status public.account_status NOT NULL DEFAULT 'unknown',
  status_history JSONB DEFAULT '[]'::jsonb,
  date_opened DATE,
  date_of_last_activity DATE,
  date_added_to_app DATE DEFAULT CURRENT_DATE,

  -- Legal
  statute_of_limitations_date DATE,
  statute_of_limitations_state TEXT,

  -- Organization
  category public.account_category,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,

  -- Relations (stored as arrays for flexibility; FKs enforced at app layer)
  activity_ids TEXT[] DEFAULT '{}',
  case_ids TEXT[] DEFAULT '{}',
  document_ids TEXT[] DEFAULT '{}',
  payment_plan_id TEXT,

  -- Metadata
  import_source public.import_source,
  credit_bureaus public.credit_bureau[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.accounts IS 'Debt accounts tracked by users';
