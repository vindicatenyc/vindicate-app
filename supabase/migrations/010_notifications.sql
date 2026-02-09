-- 010: Notifications table

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type public.notification_type NOT NULL,
  priority public.notification_priority NOT NULL DEFAULT 'low',

  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Navigation
  action_url TEXT,
  action_label TEXT,

  -- Relations
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,

  -- State
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'User notifications';
