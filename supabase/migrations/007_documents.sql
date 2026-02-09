-- 007: Documents table

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type public.document_type NOT NULL DEFAULT 'other',
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0, -- bytes

  -- Storage
  url TEXT,
  thumbnail_url TEXT,

  -- Relations
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,

  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  description TEXT,
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.documents IS 'Document metadata for uploaded files';
