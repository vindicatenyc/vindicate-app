-- 013: Indexes for query performance

-- Profiles (PK is already indexed)

-- Accounts
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_status ON public.accounts(status);
CREATE INDEX idx_accounts_category ON public.accounts(category);

-- Activities
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_account_id ON public.activities(account_id);
CREATE INDEX idx_activities_date ON public.activities(date DESC);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);

-- Cases
CREATE INDEX idx_cases_user_id ON public.cases(user_id);
CREATE INDEX idx_cases_account_id ON public.cases(account_id);
CREATE INDEX idx_cases_status ON public.cases(status);

-- Documents
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_account_id ON public.documents(account_id);
CREATE INDEX idx_documents_case_id ON public.documents(case_id);

-- Budgets
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budget_income_user_id ON public.budget_income(user_id);
CREATE INDEX idx_budget_income_budget_id ON public.budget_income(budget_id);
CREATE INDEX idx_budget_expenses_user_id ON public.budget_expenses(user_id);
CREATE INDEX idx_budget_expenses_budget_id ON public.budget_expenses(budget_id);

-- Savings Goals
CREATE INDEX idx_savings_goals_user_id ON public.savings_goals(user_id);

-- Credit Scores
CREATE INDEX idx_credit_scores_user_id ON public.credit_scores(user_id);
CREATE INDEX idx_credit_scores_date ON public.credit_scores(date DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read) WHERE NOT is_read;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Vinny Messages
CREATE INDEX idx_vinny_messages_user_id ON public.vinny_messages(user_id);
CREATE INDEX idx_vinny_messages_session_id ON public.vinny_messages(session_id);
CREATE INDEX idx_vinny_messages_created_at ON public.vinny_messages(created_at DESC);
