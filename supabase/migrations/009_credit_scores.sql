-- 009: Credit scores table

CREATE TABLE public.credit_scores (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 300 AND score <= 850),
  rating public.credit_rating NOT NULL,
  date DATE NOT NULL,
  source TEXT DEFAULT 'Mock',
  change INTEGER DEFAULT 0, -- point change from previous
  factors JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.credit_scores IS 'Credit score snapshots with history';
