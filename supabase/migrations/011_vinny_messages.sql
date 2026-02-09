-- 011: Vinny chat messages table

CREATE TABLE public.vinny_messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID DEFAULT extensions.uuid_generate_v4(),
  role public.vinny_message_role NOT NULL,
  content TEXT NOT NULL,
  suggestion_chips TEXT[] DEFAULT '{}',
  resource_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.vinny_messages IS 'Chat history with Vinny AI companion';
