-- seed.sql: Demo user data for Vindicate NYC
-- Demo user: demo@vindicate.nyc / vindicate-demo-2026
-- Idempotent: uses ON CONFLICT DO NOTHING where possible

-- ============================================================================
-- Fixed UUIDs for stable cross-references
-- ============================================================================
-- Demo user
-- user:      00000000-0000-0000-0000-000000000001
-- Accounts:
-- acc-001:   a0000000-0000-0000-0000-000000000001  (NYU Medical)
-- acc-002:   a0000000-0000-0000-0000-000000000002  (Capital One)
-- acc-003:   a0000000-0000-0000-0000-000000000003  (Synchrony)
-- acc-004:   a0000000-0000-0000-0000-000000000004  (Con Edison)
-- acc-005:   a0000000-0000-0000-0000-000000000005  (Discover Personal)
-- acc-006:   a0000000-0000-0000-0000-000000000006  (Mt Sinai)
-- acc-007:   a0000000-0000-0000-0000-000000000007  (Chase)
-- acc-008:   a0000000-0000-0000-0000-000000000008  (Macy's)
-- Cases:
-- case-001:  c0000000-0000-0000-0000-000000000001
-- case-002:  c0000000-0000-0000-0000-000000000002
-- case-003:  c0000000-0000-0000-0000-000000000003
-- Activities: act-001 through act-019
-- b0000000-0000-0000-0000-000000000001 through b0000000-0000-0000-0000-000000000019
-- Budgets:
-- d0000000-0000-0000-0000-000000000001 (Feb 2026)
-- d0000000-0000-0000-0000-000000000002 (Jan 2026)
-- d0000000-0000-0000-0000-000000000003 (Dec 2025)

BEGIN;

-- ============================================================================
-- 1. Create demo user in auth.users
-- ============================================================================
-- GoTrue manages auth.users, but we insert directly for the seed.
-- The password is hashed with bcrypt: vindicate-demo-2026
-- We use gen_salt from pgcrypto via the extensions schema.

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  is_super_admin,
  raw_app_meta_data,
  raw_user_meta_data,
  email_change,
  email_change_token_new,
  email_change_token_current,
  email_change_confirm_status,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@vindicate.nyc',
  extensions.crypt('vindicate-demo-2026', extensions.gen_salt('bf')),
  now(),
  '2026-01-15T10:00:00Z',
  now(),
  '',
  '',
  false,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Maria Santos"}'::jsonb,
  '',
  '',
  '',
  0,
  '',
  '',
  '',
  '',
  false,
  false
) ON CONFLICT (id) DO NOTHING;

-- Also need identity record for GoTrue email login
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'demo@vindicate.nyc',
  'email',
  '{"sub": "00000000-0000-0000-0000-000000000001", "email": "demo@vindicate.nyc"}'::jsonb,
  now(),
  '2026-01-15T10:00:00Z',
  now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- ============================================================================
-- 2. Create demo profile
-- ============================================================================
-- Note: The trigger on auth.users will attempt to create this automatically,
-- but we upsert to ensure our full data.

INSERT INTO public.profiles (
  id, name, state, onboarding_complete, theme,
  notification_preferences, is_demo_user, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Maria Santos',
  'NY',
  true,
  'system',
  '{
    "deadlines": true,
    "payments": true,
    "creditScore": true,
    "accountActivity": true,
    "budgetAlerts": true,
    "milestones": true,
    "vinnyTips": true
  }'::jsonb,
  true,
  '2026-01-15T10:00:00Z',
  '2026-02-01T14:22:00Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  state = EXCLUDED.state,
  onboarding_complete = EXCLUDED.onboarding_complete,
  is_demo_user = EXCLUDED.is_demo_user;

-- ============================================================================
-- 3. Accounts
-- ============================================================================

-- Account 1: NYU Langone Medical - In Collections
INSERT INTO public.accounts (
  id, user_id, creditor_name, collector_name, account_number,
  creditor_phone, creditor_address, original_balance, current_balance,
  status, status_history, date_opened, date_of_last_activity, date_added_to_app,
  statute_of_limitations_date, statute_of_limitations_state,
  category, tags, notes,
  activity_ids, case_ids, document_ids,
  import_source, credit_bureaus,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'NYU Langone Health', 'IC System Inc.', 'NYU-2024-78543',
  '888-524-0010', '550 1st Avenue, New York, NY 10016',
  8750.00, 8750.00,
  'in-collections',
  '[
    {"from": "current", "to": "late", "date": "2025-03-15", "reason": "Missed payment after insurance denial"},
    {"from": "late", "to": "in-collections", "date": "2025-06-01", "reason": "Account sold to IC System"}
  ]'::jsonb,
  '2024-11-20', '2026-01-28', '2026-01-15',
  '2031-06-01', 'NY',
  'medical', ARRAY['emergency-room', 'insurance-denied'],
  'ER visit for appendicitis. Insurance denied coverage claiming pre-existing condition.',
  ARRAY['act-001', 'act-002', 'act-009'], ARRAY['case-001'], '{}',
  'manual', ARRAY['equifax', 'experian', 'transunion']::public.credit_bureau[],
  '2026-01-15T10:30:00Z', '2026-02-01T14:22:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Account 2: Capital One - Payment Plan
INSERT INTO public.accounts (
  id, user_id, creditor_name, account_number,
  creditor_phone, creditor_address,
  original_balance, current_balance, interest_rate, minimum_payment,
  status, status_history, date_opened, date_of_last_activity, date_added_to_app,
  statute_of_limitations_date, statute_of_limitations_state,
  category, tags, notes,
  activity_ids, case_ids, document_ids, payment_plan_id,
  import_source, credit_bureaus,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Capital One', '****4521',
  '800-955-7070', 'P.O. Box 30285, Salt Lake City, UT 84130',
  4200.00, 3150.00, 0, 175.00,
  'payment-plan',
  '[
    {"from": "current", "to": "late", "date": "2025-02-01", "reason": "Reduced work hours during illness"},
    {"from": "late", "to": "charged-off", "date": "2025-08-01", "reason": "Account charged off after 180 days"},
    {"from": "charged-off", "to": "payment-plan", "date": "2025-10-15", "reason": "Negotiated hardship payment plan"}
  ]'::jsonb,
  '2021-06-15', '2026-02-01', '2026-01-15',
  '2031-08-01', 'NY',
  'credit-card', ARRAY['hardship-plan', 'making-progress'],
  'Negotiated 0% interest hardship plan. $175/month for 18 months.',
  ARRAY['act-003', 'act-004', 'act-010'], '{}', '{}', 'pp-001',
  'credit-report', ARRAY['equifax', 'experian', 'transunion']::public.credit_bureau[],
  '2026-01-15T10:35:00Z', '2026-02-01T09:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Account 3: Synchrony Bank - Disputed
INSERT INTO public.accounts (
  id, user_id, creditor_name, collector_name, account_number,
  creditor_phone, original_balance, current_balance,
  status, status_history, date_opened, date_of_last_activity, date_added_to_app,
  statute_of_limitations_date, statute_of_limitations_state,
  category, tags, notes,
  activity_ids, case_ids, document_ids,
  import_source, credit_bureaus,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Synchrony Bank', 'Portfolio Recovery Associates', 'SY-7890-XXXX',
  '866-419-4096', 2340.00, 2890.00,
  'disputed',
  '[
    {"from": "current", "to": "in-collections", "date": "2025-04-10"},
    {"from": "in-collections", "to": "disputed", "date": "2026-01-20", "reason": "Filed dispute - incorrect balance and fees"}
  ]'::jsonb,
  '2022-11-25', '2026-01-25', '2026-01-15',
  '2031-04-10', 'NY',
  'credit-card', ARRAY['store-card', 'dispute-pending'],
  'Disputed due to incorrect fees and balance. Original card was Amazon store card.',
  ARRAY['act-005', 'act-011'], ARRAY['case-002'], '{}',
  'credit-report', ARRAY['equifax', 'transunion']::public.credit_bureau[],
  '2026-01-15T10:40:00Z', '2026-01-25T16:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Account 4: Con Edison - Settled
INSERT INTO public.accounts (
  id, user_id, creditor_name, account_number,
  creditor_phone, creditor_address,
  original_balance, current_balance,
  status, status_history, date_opened, date_of_last_activity, date_added_to_app,
  category, tags, notes,
  activity_ids, case_ids, document_ids,
  import_source, credit_bureaus,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Consolidated Edison', 'CE-NYC-445566',
  '800-752-6633', '4 Irving Place, New York, NY 10003',
  890.00, 0,
  'settled',
  '[
    {"from": "current", "to": "late", "date": "2025-01-15"},
    {"from": "late", "to": "in-collections", "date": "2025-04-01"},
    {"from": "in-collections", "to": "settled", "date": "2025-12-20", "reason": "Settled for 60% of balance"}
  ]'::jsonb,
  '2023-03-01', '2025-12-20', '2026-01-15',
  'utility', ARRAY['settled', 'success'],
  'Settled for $534 (60%). First account resolved!',
  ARRAY['act-006'], '{}', '{}',
  'manual', ARRAY['equifax']::public.credit_bureau[],
  '2026-01-15T10:45:00Z', '2025-12-20T11:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Account 5: Discover Personal Loan - In Collections w/ harassment
INSERT INTO public.accounts (
  id, user_id, creditor_name, collector_name, account_number,
  creditor_phone, original_balance, current_balance, interest_rate,
  status, status_history, date_opened, date_of_last_activity, date_added_to_app,
  statute_of_limitations_date, statute_of_limitations_state,
  category, tags, notes,
  activity_ids, case_ids, document_ids,
  import_source, credit_bureaus,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Discover Personal Loans', 'Midland Credit Management', 'DPL-89012',
  '800-347-0434', 5000.00, 5650.00, 18.99,
  'in-collections',
  '[
    {"from": "current", "to": "late", "date": "2025-05-01"},
    {"from": "late", "to": "charged-off", "date": "2025-11-01"},
    {"from": "charged-off", "to": "in-collections", "date": "2025-12-15", "reason": "Sold to Midland Credit"}
  ]'::jsonb,
  '2023-08-10', '2026-02-05', '2026-01-15',
  '2031-11-01', 'NY',
  'personal-loan', ARRAY['harassment', 'fdcpa-violation'],
  'Midland has called multiple times outside allowed hours. Documenting for FDCPA complaint.',
  ARRAY['act-007', 'act-008', 'act-012', 'act-013'], '{}', '{}',
  'credit-report', ARRAY['equifax', 'experian', 'transunion']::public.credit_bureau[],
  '2026-01-15T10:50:00Z', '2026-02-05T08:15:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Account 6: Mt. Sinai Medical - Late
INSERT INTO public.accounts (
  id, user_id, creditor_name, account_number,
  creditor_phone, creditor_address,
  original_balance, current_balance,
  status, status_history, date_opened, date_of_last_activity, date_added_to_app,
  category, tags, notes,
  activity_ids, case_ids, document_ids,
  import_source, credit_bureaus,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'Mount Sinai Health System', 'MS-2025-11234',
  '212-659-8500', '1 Gustave L. Levy Place, New York, NY 10029',
  1250.00, 1250.00,
  'late',
  '[{"from": "current", "to": "late", "date": "2026-01-15", "reason": "Waiting for insurance to process"}]'::jsonb,
  '2025-10-05', '2026-01-28', '2026-01-20',
  'medical', ARRAY['insurance-pending', 'recent'],
  'Follow-up visit. Insurance claim still processing. May be partially covered.',
  ARRAY['act-014'], '{}', '{}',
  'manual', '{}'::public.credit_bureau[],
  '2026-01-20T09:00:00Z', '2026-01-28T14:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Account 7: Chase Sapphire - Current
INSERT INTO public.accounts (
  id, user_id, creditor_name, account_number,
  creditor_phone,
  original_balance, current_balance, minimum_payment,
  status, status_history, date_opened, date_of_last_activity, date_added_to_app,
  category, tags, notes,
  activity_ids, case_ids, document_ids,
  import_source, credit_bureaus,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'Chase Bank', '****7890',
  '800-432-3117',
  0, 450.00, 25.00,
  'current', '[]'::jsonb,
  '2020-03-15', '2026-02-01', '2026-01-15',
  'credit-card', ARRAY['good-standing', 'active'],
  'Only card in good standing. Using for small purchases to maintain credit history.',
  '{}', '{}', '{}',
  'manual', ARRAY['equifax', 'experian', 'transunion']::public.credit_bureau[],
  '2026-01-15T11:00:00Z', '2026-02-01T10:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Account 8: Macy's - Charged Off
INSERT INTO public.accounts (
  id, user_id, creditor_name, collector_name, account_number,
  original_balance, current_balance,
  status, status_history, date_opened, date_of_last_activity, date_added_to_app,
  statute_of_limitations_date, statute_of_limitations_state,
  category, tags, notes,
  activity_ids, case_ids, document_ids,
  import_source, credit_bureaus,
  created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'Macy''s', 'Citibank Retail Services', 'MACYS-XXXX-8901',
  1100.00, 1320.00,
  'charged-off',
  '[
    {"from": "current", "to": "late", "date": "2025-02-28"},
    {"from": "late", "to": "charged-off", "date": "2025-09-01"}
  ]'::jsonb,
  '2022-08-20', '2025-11-10', '2026-01-15',
  '2031-09-01', 'NY',
  'credit-card', ARRAY['store-card', 'charged-off'],
  'Low priority. Considering debt validation letter.',
  ARRAY['act-015'], '{}', '{}',
  'credit-report', ARRAY['experian', 'transunion']::public.credit_bureau[],
  '2026-01-15T11:05:00Z', '2025-11-10T09:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. Activities
-- ============================================================================

-- act-001: NYU Medical collection call
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, caller_phone, call_duration,
  is_harassment, document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'phone-call', 'inbound', '2026-01-28T14:30:00Z',
  'Collection call from IC System',
  'Collector called asking for full payment. Explained financial situation. They offered to set up a payment plan but the minimum was too high.',
  '888-524-0010', 12,
  false, '{}',
  '2026-01-28T14:45:00Z', '2026-01-28T14:45:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-002: NYU Medical debt validation letter
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, template_used,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'letter-sent', 'outbound', '2026-01-20T10:00:00Z',
  'Debt validation letter sent',
  'Sent certified mail requesting debt validation per FDCPA. Used template from resource center.',
  'debt-validation-request',
  '{}',
  '2026-01-20T10:15:00Z', '2026-01-20T10:15:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-003: Capital One payment Feb
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, amount, payment_method, confirmation_number,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'payment-made', 'outbound', '2026-02-01T09:00:00Z',
  'Monthly payment - February',
  'Payment plan installment #4 of 18',
  175.00, 'Bank transfer', 'CAP-2026-FEB-7821',
  '{}',
  '2026-02-01T09:05:00Z', '2026-02-01T09:05:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-004: Capital One negotiation call
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, call_duration,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'phone-call', 'outbound', '2025-10-15T11:00:00Z',
  'Negotiated hardship payment plan',
  'Called to explain financial hardship. Representative was understanding. Agreed to 0% interest, $175/month for 18 months.',
  35,
  '{}',
  '2025-10-15T12:00:00Z', '2025-10-15T12:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-005: Synchrony dispute filed
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, template_used,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'dispute-filed', 'outbound', '2026-01-20T15:00:00Z',
  'Dispute filed with Equifax',
  'Filed dispute citing incorrect balance. Original balance was $2,340 but they added $550 in fees that were not disclosed.',
  'credit-bureau-dispute',
  '{}',
  '2026-01-20T15:30:00Z', '2026-01-20T15:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-006: Con Edison settlement payment
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, amount, payment_method, confirmation_number,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000004',
  'payment-made', 'outbound', '2025-12-20T11:00:00Z',
  'Settlement payment - Account closed',
  'Paid $534 to settle $890 balance (60%). First debt settled! Got confirmation in writing.',
  534.00, 'Debit card', 'CE-SETTLE-2025-1220',
  '{}',
  '2025-12-20T11:30:00Z', '2025-12-20T11:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-007: Discover/Midland harassment call #3 (before 8am)
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, caller_phone, call_duration,
  is_harassment, harassment_details,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000005',
  'phone-call', 'inbound', '2026-02-05T07:45:00Z',
  'Harassment call - Before 8am',
  'Midland Credit called at 7:45 AM. This is the third call this week before 8am. Documenting for FDCPA violation.',
  '877-653-2428', 2,
  true, '{"timeOfCall": "Before 8am", "repeatedCalls": true}'::jsonb,
  '{}',
  '2026-02-05T08:00:00Z', '2026-02-05T08:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-008: Discover/Midland harassment call #2 (before 8am)
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, caller_phone, call_duration,
  is_harassment, harassment_details,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000005',
  'phone-call', 'inbound', '2026-02-03T07:30:00Z',
  'Harassment call - Before 8am',
  'Second early morning call this week.',
  '877-653-2428', 1,
  true, '{"timeOfCall": "Before 8am", "repeatedCalls": true}'::jsonb,
  '{}',
  '2026-02-03T07:45:00Z', '2026-02-03T07:45:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-009: NYU Medical collection notice received
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'letter-received', 'inbound', '2026-01-25T00:00:00Z',
  'Collection notice received',
  'Received initial collection notice from IC System. They claim I have 30 days to dispute.',
  '{}',
  '2026-01-25T18:00:00Z', '2026-01-25T18:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-010: Capital One payment Jan
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, amount, payment_method, confirmation_number,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'payment-made', 'outbound', '2026-01-01T09:00:00Z',
  'Monthly payment - January',
  'Payment plan installment #3 of 18',
  175.00, 'Bank transfer', 'CAP-2026-JAN-4521',
  '{}',
  '2026-01-01T09:05:00Z', '2026-01-01T09:05:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-011: Synchrony collection letter
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'letter-received', 'inbound', '2026-01-10T00:00:00Z',
  'Collection letter from Portfolio Recovery',
  'First contact from PRA. Balance seems inflated with fees. Will dispute.',
  '{}',
  '2026-01-10T19:00:00Z', '2026-01-10T19:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-012: Discover/Midland harassment call (after 9pm)
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, caller_phone, call_duration,
  is_harassment, harassment_details,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000005',
  'phone-call', 'inbound', '2026-01-30T21:15:00Z',
  'Harassment call - After 9pm',
  'Called after 9pm. When I said I was going to report them, they hung up.',
  '877-653-2428', 3,
  true, '{"timeOfCall": "After 9pm"}'::jsonb,
  '{}',
  '2026-01-30T21:30:00Z', '2026-01-30T21:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-013: Discover/Midland cease and desist
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, template_used,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000005',
  'letter-sent', 'outbound', '2026-02-06T09:00:00Z',
  'Cease and desist letter sent',
  'Sent cease and desist letter via certified mail due to repeated FDCPA violations.',
  'cease-and-desist',
  '{}',
  '2026-02-06T09:15:00Z', '2026-02-06T09:15:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-014: Mt. Sinai billing call
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, call_duration,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000006',
  'phone-call', 'outbound', '2026-01-28T14:00:00Z',
  'Called billing department',
  'Called to check on insurance claim status. They said it takes 4-6 weeks to process. Will call back in February.',
  18,
  '{}',
  '2026-01-28T14:30:00Z', '2026-01-28T14:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-015: Macy's charge-off notice
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000008',
  'letter-received', 'inbound', '2025-11-10T00:00:00Z',
  'Charge-off notice received',
  'Received notice that account has been charged off. Low priority - focusing on other debts first.',
  '{}',
  '2025-11-10T18:00:00Z', '2025-11-10T18:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-016: Capital One payment plan confirmation
INSERT INTO public.activities (
  id, user_id, account_id, type, date,
  title, notes,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'note', '2025-11-01T10:00:00Z',
  'Payment plan confirmation received',
  'Got written confirmation of the payment plan terms. Keep this for records.',
  '{}',
  '2025-11-01T10:30:00Z', '2025-11-01T10:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-017: Synchrony credit report update
INSERT INTO public.activities (
  id, user_id, account_id, type, date,
  title, notes,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000017',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'credit-report-update', '2026-01-22T00:00:00Z',
  'Dispute marked on credit report',
  'Checked Equifax - account now shows "consumer disputes" status. Good sign.',
  '{}',
  '2026-01-22T20:00:00Z', '2026-01-22T20:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-018: Con Edison settlement offer
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes, amount,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000018',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000004',
  'settlement-offer', 'inbound', '2025-12-15T00:00:00Z',
  'Settlement offer received',
  'ConEd offered to settle for 60% ($534). Decided to take it.',
  534.00,
  '{}',
  '2025-12-15T19:00:00Z', '2025-12-15T19:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- act-019: NYU Medical validation response
INSERT INTO public.activities (
  id, user_id, account_id, type, direction, date,
  title, notes,
  document_ids, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000019',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'letter-received', 'inbound', '2026-02-03T00:00:00Z',
  'Debt validation response received',
  'IC System sent validation documents. Reviewing to verify accuracy.',
  '{}',
  '2026-02-03T18:30:00Z', '2026-02-03T18:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. Cases
-- ============================================================================

-- Case 1: Credit Bureau Dispute - Synchrony
INSERT INTO public.cases (
  id, user_id, account_id, type, status, status_history,
  title, description, case_number,
  credit_bureau, dispute_reason,
  date_filed, response_deadline,
  document_ids, activity_ids, reminders,
  created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'credit-bureau-dispute', 'under-review',
  '[
    {"from": "draft", "to": "filed", "date": "2026-01-20T15:30:00Z", "notes": "Dispute submitted online to Equifax"},
    {"from": "filed", "to": "under-review", "date": "2026-01-22T00:00:00Z", "notes": "Equifax confirmed receipt and investigation started"}
  ]'::jsonb,
  'Equifax Dispute - Synchrony Incorrect Balance',
  'Disputing the reported balance. Portfolio Recovery Associates added $550 in fees that were never disclosed. Original balance was $2,340 but they report $2,890.',
  'EQ-2026-7845321',
  'equifax', 'Incorrect balance - unauthorized fees added',
  '2026-01-20', '2026-02-19',
  '{}', ARRAY['act-005', 'act-017'],
  '[
    {"id": "rem-001", "caseId": "case-001", "title": "Check for Equifax response", "date": "2026-02-10", "isCompleted": false, "notes": "They have 30 days to investigate. Follow up if no response."},
    {"id": "rem-002", "caseId": "case-001", "title": "Response deadline", "date": "2026-02-19", "isCompleted": false, "notes": "Final deadline for Equifax to respond to dispute."}
  ]'::jsonb,
  '2026-01-20T15:00:00Z', '2026-01-22T10:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Case 2: Debt Validation - NYU Medical
INSERT INTO public.cases (
  id, user_id, account_id, type, status, status_history,
  title, description,
  date_filed, response_deadline,
  document_ids, activity_ids, reminders,
  created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'debt-validation', 'response-received',
  '[
    {"from": "draft", "to": "filed", "date": "2026-01-20T10:15:00Z", "notes": "Debt validation letter sent certified mail"},
    {"from": "filed", "to": "under-review", "date": "2026-01-25T00:00:00Z", "notes": "Letter delivered per USPS tracking"},
    {"from": "under-review", "to": "response-received", "date": "2026-02-03T18:30:00Z", "notes": "IC System sent validation documents"}
  ]'::jsonb,
  'Debt Validation - IC System / NYU Langone',
  'Requested validation of $8,750 medical debt. Want to verify: 1) Original creditor agreement, 2) Complete payment history, 3) How current balance was calculated, 4) Their legal authority to collect.',
  '2026-01-20', '2026-02-19',
  '{}', ARRAY['act-002', 'act-019'],
  '[
    {"id": "rem-003", "caseId": "case-002", "title": "Review validation documents", "date": "2026-02-08", "isCompleted": false, "notes": "Compare documents to original hospital bills. Look for discrepancies."},
    {"id": "rem-004", "caseId": "case-002", "title": "Decide next steps", "date": "2026-02-15", "isCompleted": false, "notes": "If validation incomplete, file credit bureau dispute. If valid, consider negotiation."}
  ]'::jsonb,
  '2026-01-20T10:00:00Z', '2026-02-03T18:45:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Case 3: FDCPA Complaint - Midland Credit (Draft)
INSERT INTO public.cases (
  id, user_id, account_id, type, status, status_history,
  title, description,
  date_filed,
  document_ids, activity_ids, reminders,
  created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000005',
  'fdcpa-complaint', 'draft', '[]'::jsonb,
  'FDCPA Complaint - Midland Credit Management',
  'Documenting multiple FDCPA violations: 1) Calls before 8am (documented 3 times), 2) Call after 9pm (documented once). Considering filing CFPB complaint and/or lawsuit.',
  '2026-02-06',
  '{}', ARRAY['act-007', 'act-008', 'act-012', 'act-013'],
  '[
    {"id": "rem-005", "caseId": "case-003", "title": "Gather all harassment documentation", "date": "2026-02-10", "isCompleted": false, "notes": "Compile call logs, times, and notes for each violation."},
    {"id": "rem-006", "caseId": "case-003", "title": "Research FDCPA lawsuit options", "date": "2026-02-15", "isCompleted": false, "notes": "Can recover $1,000 statutory damages plus actual damages. Consider finding FDCPA attorney."}
  ]'::jsonb,
  '2026-02-06T10:00:00Z', '2026-02-06T10:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. Budgets
-- ============================================================================

-- Budget: February 2026
INSERT INTO public.budgets (
  id, user_id, month, total_income, total_expenses,
  available_for_debt, repayment_strategy, debt_payments,
  created_at, updated_at
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '2026-02', 4200.00, 2990.00, 1210.00,
  'snowball',
  '[
    {"accountId": "acc-002-capital-one", "allocatedAmount": 175, "isPaid": true, "paidDate": "2026-02-01"},
    {"accountId": "acc-006-mt-sinai", "allocatedAmount": 100, "isPaid": false}
  ]'::jsonb,
  '2026-02-01T00:00:00Z', '2026-02-01T09:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Budget: January 2026
INSERT INTO public.budgets (
  id, user_id, month, total_income, total_expenses,
  available_for_debt, repayment_strategy, debt_payments,
  created_at, updated_at
) VALUES (
  'd0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '2026-01', 4300.00, 3085.00, 1215.00,
  'snowball',
  '[{"accountId": "acc-002-capital-one", "allocatedAmount": 175, "isPaid": true, "paidDate": "2026-01-01"}]'::jsonb,
  '2026-01-01T00:00:00Z', '2026-01-31T23:59:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Budget: December 2025
INSERT INTO public.budgets (
  id, user_id, month, total_income, total_expenses,
  available_for_debt, repayment_strategy, debt_payments,
  created_at, updated_at
) VALUES (
  'd0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '2025-12', 4100.00, 3165.00, 935.00,
  'snowball',
  '[
    {"accountId": "acc-002-capital-one", "allocatedAmount": 175, "isPaid": true, "paidDate": "2025-12-01"},
    {"accountId": "acc-004-con-edison", "allocatedAmount": 534, "isPaid": true, "paidDate": "2025-12-20"}
  ]'::jsonb,
  '2025-12-01T00:00:00Z', '2025-12-31T23:59:00Z'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6b. Budget Income Entries
-- ============================================================================

-- Feb 2026 income
INSERT INTO public.budget_income (id, user_id, budget_id, source, amount, frequency, is_recurring) VALUES
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Salary (Administrative Assistant)', 3800.00, 'monthly', true),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Freelance Data Entry', 400.00, 'monthly', false)
ON CONFLICT (id) DO NOTHING;

-- Jan 2026 income
INSERT INTO public.budget_income (id, user_id, budget_id, source, amount, frequency, is_recurring) VALUES
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Salary (Administrative Assistant)', 3800.00, 'monthly', true),
  ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Holiday Bonus', 500.00, 'one-time', false)
ON CONFLICT (id) DO NOTHING;

-- Dec 2025 income
INSERT INTO public.budget_income (id, user_id, budget_id, source, amount, frequency, is_recurring) VALUES
  ('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Salary (Administrative Assistant)', 3800.00, 'monthly', true),
  ('e0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Freelance Data Entry', 300.00, 'monthly', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6c. Budget Expense Entries
-- ============================================================================

-- Feb 2026 expenses
INSERT INTO public.budget_expenses (id, user_id, budget_id, category, name, amount, is_fixed, is_recurring) VALUES
  ('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'housing', 'Rent (1BR in Astoria)', 1850.00, true, true),
  ('f0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'utilities', 'ConEd Electric', 95.00, false, true),
  ('f0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'utilities', 'National Grid Gas', 45.00, false, true),
  ('f0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'utilities', 'Spectrum Internet', 55.00, true, true),
  ('f0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'utilities', 'T-Mobile Phone', 65.00, true, true),
  ('f0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'food', 'Groceries', 350.00, false, true),
  ('f0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'food', 'Dining/Takeout', 80.00, false, true),
  ('f0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'transportation', 'MTA MetroCard', 132.00, true, true),
  ('f0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'healthcare', 'Health Insurance (Employer)', 180.00, true, true),
  ('f0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'healthcare', 'Medications', 45.00, false, true),
  ('f0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'insurance', 'Renter''s Insurance', 25.00, true, true),
  ('f0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'personal', 'Personal Care/Toiletries', 40.00, false, true),
  ('f0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'personal', 'Streaming (Netflix, Spotify)', 28.00, true, true)
ON CONFLICT (id) DO NOTHING;

-- Jan 2026 expenses
INSERT INTO public.budget_expenses (id, user_id, budget_id, category, name, amount, is_fixed, is_recurring) VALUES
  ('f0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'housing', 'Rent (1BR in Astoria)', 1850.00, true, true),
  ('f0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'utilities', 'ConEd Electric', 110.00, false, true),
  ('f0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'utilities', 'National Grid Gas', 65.00, false, true),
  ('f0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'utilities', 'Spectrum Internet', 55.00, true, true),
  ('f0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'utilities', 'T-Mobile Phone', 65.00, true, true),
  ('f0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'food', 'Groceries', 380.00, false, true),
  ('f0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'food', 'Dining/Takeout', 100.00, false, true),
  ('f0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'transportation', 'MTA MetroCard', 132.00, true, true),
  ('f0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'healthcare', 'Health Insurance (Employer)', 180.00, true, true),
  ('f0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'healthcare', 'Medications', 45.00, false, true),
  ('f0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'insurance', 'Renter''s Insurance', 25.00, true, true),
  ('f0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'personal', 'Personal Care/Toiletries', 50.00, false, true),
  ('f0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'personal', 'Streaming (Netflix, Spotify)', 28.00, true, true)
ON CONFLICT (id) DO NOTHING;

-- Dec 2025 expenses
INSERT INTO public.budget_expenses (id, user_id, budget_id, category, name, amount, is_fixed, is_recurring) VALUES
  ('f0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'housing', 'Rent (1BR in Astoria)', 1850.00, true, true),
  ('f0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'utilities', 'ConEd Electric', 85.00, false, true),
  ('f0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'utilities', 'National Grid Gas', 55.00, false, true),
  ('f0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'utilities', 'Spectrum Internet', 55.00, true, true),
  ('f0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'utilities', 'T-Mobile Phone', 65.00, true, true),
  ('f0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'food', 'Groceries', 400.00, false, true),
  ('f0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'food', 'Dining/Takeout', 120.00, false, true),
  ('f0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'transportation', 'MTA MetroCard', 132.00, true, true),
  ('f0000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'healthcare', 'Health Insurance (Employer)', 180.00, true, true),
  ('f0000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'healthcare', 'Medications', 45.00, false, true),
  ('f0000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'personal', 'Holiday Gifts', 150.00, false, false),
  ('f0000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'personal', 'Streaming (Netflix, Spotify)', 28.00, true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. Savings Goals
-- ============================================================================

INSERT INTO public.savings_goals (id, user_id, name, target_amount, current_amount, monthly_contribution, target_date, created_at) VALUES
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Emergency Fund', 3000.00, 450.00, 100.00, '2026-12-31', '2026-01-15T00:00:00Z'),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Settlement Fund', 5000.00, 200.00, 150.00, '2027-06-30', '2026-01-15T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. Credit Scores
-- ============================================================================

INSERT INTO public.credit_scores (
  id, user_id, score, rating, date, source, change,
  factors, history, created_at
) VALUES (
  '80000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  580, 'fair', '2026-02-01', 'Mock (Based on VantageScore 3.0)', 8,
  '[
    {"name": "Payment History", "impact": "high", "status": "negative", "description": "You have 4 accounts with late payments in the past 24 months. Making on-time payments going forward will help this factor improve over time."},
    {"name": "Credit Utilization", "impact": "high", "status": "negative", "description": "Your credit utilization is very high. The one active card (Chase) has a low balance, but closed accounts with balances hurt this score."},
    {"name": "Derogatory Marks", "impact": "high", "status": "negative", "description": "You have 3 accounts in collections and 2 charge-offs. These stay on your report for 7 years but their impact decreases over time."},
    {"name": "Age of Credit History", "impact": "medium", "status": "neutral", "description": "Your oldest account is 6 years old (Chase). This is a moderately positive factor. Keep your oldest accounts open if possible."},
    {"name": "Total Accounts", "impact": "low", "status": "neutral", "description": "You have 8 total accounts. This is a reasonable number. Having a mix of credit types can help."},
    {"name": "Recent Inquiries", "impact": "low", "status": "positive", "description": "You have no recent hard inquiries. This is good - avoid applying for new credit while rebuilding."}
  ]'::jsonb,
  '[
    {"score": 545, "date": "2025-09-01"},
    {"score": 552, "date": "2025-10-01"},
    {"score": 558, "date": "2025-11-01"},
    {"score": 565, "date": "2025-12-01"},
    {"score": 572, "date": "2026-01-01"},
    {"score": 580, "date": "2026-02-01"}
  ]'::jsonb,
  '2026-02-01T06:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. Notifications
-- ============================================================================

INSERT INTO public.notifications (
  id, user_id, type, priority, title, message,
  action_url, action_label, account_id, case_id,
  is_read, is_dismissed, read_at, created_at
) VALUES
  -- notif-001
  ('90000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'deadline-approaching', 'high',
   'Equifax dispute deadline in 11 days',
   'The credit bureau has until Feb 19 to respond to your dispute on the Synchrony account.',
   '/cases/case-001', 'View Case',
   NULL, 'c0000000-0000-0000-0000-000000000001',
   false, false, NULL,
   '2026-02-08T08:00:00Z'),

  -- notif-002
  ('90000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'payment-due', 'medium',
   'Capital One payment due March 1',
   'Your monthly payment of $175 is due in 21 days. Keep up the good work!',
   '/accounts/acc-002-capital-one', 'View Account',
   'a0000000-0000-0000-0000-000000000002', NULL,
   false, false, NULL,
   '2026-02-08T07:00:00Z'),

  -- notif-003
  ('90000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'milestone-reached', 'low',
   'You made your 4th payment!',
   'You''ve completed 4 payments on your Capital One plan. Only 14 to go - you''re making real progress!',
   '/accounts/acc-002-capital-one', 'View Progress',
   'a0000000-0000-0000-0000-000000000002', NULL,
   true, false, '2026-02-01T12:30:00Z',
   '2026-02-01T10:00:00Z'),

  -- notif-004
  ('90000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   'account-status-change', 'medium',
   'Debt validation response received',
   'IC System responded to your debt validation request for the NYU Langone account. Review the documents they sent.',
   '/cases/case-002', 'Review Documents',
   'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
   false, false, NULL,
   '2026-02-03T19:00:00Z'),

  -- notif-005
  ('90000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000001',
   'vinny-tip', 'low',
   'Tip: Document those collection calls',
   'I noticed you''ve logged several harassment incidents with Midland Credit. Keep documenting - you may have a strong FDCPA case!',
   '/cases/case-003', 'View FDCPA Case',
   NULL, NULL,
   false, false, NULL,
   '2026-02-06T14:00:00Z'),

  -- notif-006
  ('90000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000001',
   'budget-alert', 'medium',
   'Food spending update',
   'You''ve spent $280 on food this month - that''s 65% of your $430 budget with 3 weeks left.',
   '/budget', 'View Budget',
   NULL, NULL,
   true, false, '2026-02-07T20:15:00Z',
   '2026-02-07T18:00:00Z'),

  -- notif-007
  ('90000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000001',
   'credit-score-change', 'low',
   'Credit score update: +8 points!',
   'Your credit score increased from 572 to 580. Your consistent payments and dispute are making a difference!',
   '/budget', 'View Credit Score',
   NULL, NULL,
   true, false, '2026-02-01T08:45:00Z',
   '2026-02-01T06:00:00Z'),

  -- notif-008
  ('90000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000001',
   'system', 'low',
   'Welcome to Vindicate NYC!',
   'You''re taking control of your financial future. Explore your dashboard and let Vinny help guide you.',
   '/', 'Go to Dashboard',
   NULL, NULL,
   true, false, '2026-01-15T10:32:00Z',
   '2026-01-15T10:30:00Z'),

  -- notif-009
  ('90000000-0000-0000-0000-000000000009',
   '00000000-0000-0000-0000-000000000001',
   'deadline-approaching', 'medium',
   'Reminder: Review validation documents',
   'You set a reminder to review the debt validation documents by Feb 8.',
   '/cases/case-002', 'Review Now',
   NULL, 'c0000000-0000-0000-0000-000000000002',
   false, false, NULL,
   '2026-02-08T06:00:00Z'),

  -- notif-010
  ('90000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   'milestone-reached', 'low',
   'First debt settled!',
   'Congratulations! You settled the Con Edison account for 60% of the balance. One down!',
   '/accounts/acc-004-con-edison', 'View Details',
   'a0000000-0000-0000-0000-000000000004', NULL,
   true, false, '2025-12-20T12:05:00Z',
   '2025-12-20T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

COMMIT;
