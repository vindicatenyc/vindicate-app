-- 014: Row Level Security policies
-- Users can only access their own data

-- ─── Profiles ───────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_profiles ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert_own_profiles ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update_own_profiles ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY users_delete_own_profiles ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ─── Accounts ───────────────────────────────────────────────────────────
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_accounts ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_accounts ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_accounts ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_accounts ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Activities ─────────────────────────────────────────────────────────
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_activities ON public.activities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_activities ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_activities ON public.activities
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_activities ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Cases ──────────────────────────────────────────────────────────────
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_cases ON public.cases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_cases ON public.cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_cases ON public.cases
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_cases ON public.cases
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Documents ──────────────────────────────────────────────────────────
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_documents ON public.documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_documents ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_documents ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_documents ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Budgets ────────────────────────────────────────────────────────────
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_budgets ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_budgets ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_budgets ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_budgets ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Budget Income ──────────────────────────────────────────────────────
ALTER TABLE public.budget_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_budget_income ON public.budget_income
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_budget_income ON public.budget_income
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_budget_income ON public.budget_income
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_budget_income ON public.budget_income
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Budget Expenses ────────────────────────────────────────────────────
ALTER TABLE public.budget_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_budget_expenses ON public.budget_expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_budget_expenses ON public.budget_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_budget_expenses ON public.budget_expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_budget_expenses ON public.budget_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Savings Goals ──────────────────────────────────────────────────────
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_savings_goals ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_savings_goals ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_savings_goals ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_savings_goals ON public.savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Credit Scores ──────────────────────────────────────────────────────
ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_credit_scores ON public.credit_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_credit_scores ON public.credit_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_credit_scores ON public.credit_scores
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_credit_scores ON public.credit_scores
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Notifications ──────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_notifications ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_notifications ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_update_own_notifications ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY users_delete_own_notifications ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Vinny Messages ────────────────────────────────────────────────────
ALTER TABLE public.vinny_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own_vinny_messages ON public.vinny_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY users_insert_own_vinny_messages ON public.vinny_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY users_delete_own_vinny_messages ON public.vinny_messages
  FOR DELETE USING (auth.uid() = user_id);
