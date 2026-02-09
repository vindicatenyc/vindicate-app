-- 003: User profiles table

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  state TEXT DEFAULT 'NY',
  avatar_url TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notification_preferences JSONB DEFAULT '{
    "deadlines": true,
    "payments": true,
    "creditScore": true,
    "accountActivity": true,
    "budgetAlerts": true,
    "milestones": true,
    "vinnyTips": true
  }'::jsonb,
  is_demo_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users';

-- Auto-create profile on new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
