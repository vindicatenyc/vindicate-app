-- 002: Custom enum types matching TypeScript unions

-- Account status
CREATE TYPE public.account_status AS ENUM (
  'current',
  'late',
  'in-collections',
  'charged-off',
  'disputed',
  'payment-plan',
  'settled',
  'paid-in-full',
  'in-litigation',
  'bankrupt',
  'unknown'
);

-- Account category
CREATE TYPE public.account_category AS ENUM (
  'credit-card',
  'medical',
  'student-loan',
  'auto-loan',
  'personal-loan',
  'utility',
  'rent',
  'tax',
  'other'
);

-- Credit bureau
CREATE TYPE public.credit_bureau AS ENUM (
  'equifax',
  'experian',
  'transunion'
);

-- Activity type
CREATE TYPE public.activity_type AS ENUM (
  'phone-call',
  'letter-received',
  'letter-sent',
  'email-received',
  'email-sent',
  'payment-made',
  'payment-received',
  'dispute-filed',
  'court-filing',
  'settlement-offer',
  'credit-report-update',
  'note',
  'other'
);

-- Activity direction
CREATE TYPE public.activity_direction AS ENUM (
  'inbound',
  'outbound'
);

-- Case type
CREATE TYPE public.case_type AS ENUM (
  'credit-bureau-dispute',
  'debt-validation',
  'fdcpa-complaint',
  'lawsuit-defendant',
  'lawsuit-plaintiff',
  'arbitration',
  'cfpb-complaint',
  'other'
);

-- Case status
CREATE TYPE public.case_status_type AS ENUM (
  'draft',
  'filed',
  'under-review',
  'response-received',
  'hearing-scheduled',
  'in-progress',
  'resolved',
  'escalated',
  'closed'
);

-- Case outcome
CREATE TYPE public.case_outcome AS ENUM (
  'won',
  'lost',
  'settled',
  'dismissed',
  'withdrawn',
  'pending'
);

-- Document type
CREATE TYPE public.document_type AS ENUM (
  'validation-letter',
  'dispute-letter',
  'court-document',
  'payment-receipt',
  'credit-report',
  'correspondence',
  'settlement-agreement',
  'other'
);

-- Notification type
CREATE TYPE public.notification_type AS ENUM (
  'deadline-approaching',
  'payment-due',
  'credit-score-change',
  'account-status-change',
  'budget-alert',
  'milestone-reached',
  'vinny-tip',
  'system'
);

-- Notification priority
CREATE TYPE public.notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Expense category
CREATE TYPE public.expense_category AS ENUM (
  'housing',
  'utilities',
  'food',
  'transportation',
  'healthcare',
  'insurance',
  'debt-payments',
  'personal',
  'education',
  'savings',
  'other'
);

-- Credit rating
CREATE TYPE public.credit_rating AS ENUM (
  'poor',
  'fair',
  'good',
  'very-good',
  'excellent'
);

-- Income frequency
CREATE TYPE public.income_frequency AS ENUM (
  'monthly',
  'biweekly',
  'weekly',
  'one-time'
);

-- Repayment strategy
CREATE TYPE public.repayment_strategy AS ENUM (
  'snowball',
  'avalanche',
  'custom'
);

-- Import source
CREATE TYPE public.import_source AS ENUM (
  'manual',
  'credit-report'
);

-- Vinny message role
CREATE TYPE public.vinny_message_role AS ENUM (
  'user',
  'assistant'
);
