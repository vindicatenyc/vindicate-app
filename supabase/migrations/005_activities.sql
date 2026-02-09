-- 005: Activities table

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,

  type public.activity_type NOT NULL,
  direction public.activity_direction,

  date TIMESTAMPTZ NOT NULL,

  -- Content
  title TEXT NOT NULL,
  notes TEXT,
  template_used TEXT,

  -- Call-specific
  caller_phone TEXT,
  call_duration INTEGER, -- minutes

  -- Payment-specific
  amount NUMERIC(10,2),
  payment_method TEXT,
  confirmation_number TEXT,

  -- Harassment tracking (FDCPA)
  is_harassment BOOLEAN DEFAULT false,
  harassment_details JSONB,

  -- Documents
  document_ids TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.activities IS 'Activity log entries for debt accounts';
