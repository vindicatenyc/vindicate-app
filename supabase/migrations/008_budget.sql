-- 008: Budget tables

-- Budgets (monthly)
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- "2026-02" format
  total_income NUMERIC(10,2) DEFAULT 0,
  total_expenses NUMERIC(10,2) DEFAULT 0,
  available_for_debt NUMERIC(10,2) DEFAULT 0,
  repayment_strategy public.repayment_strategy DEFAULT 'snowball',
  debt_payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, month)
);

COMMENT ON TABLE public.budgets IS 'Monthly budget summaries';

-- Budget income entries
CREATE TABLE public.budget_income (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  frequency public.income_frequency DEFAULT 'monthly',
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.budget_income IS 'Income entries for budgets';

-- Budget expense entries
CREATE TABLE public.budget_expenses (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  category public.expense_category NOT NULL DEFAULT 'other',
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_fixed BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.budget_expenses IS 'Expense entries for budgets';

-- Savings goals
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_contribution NUMERIC(10,2) DEFAULT 0,
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.savings_goals IS 'User savings goals';
