-- User preferences for Bible reading customization
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  bible_translation TEXT NOT NULL DEFAULT 'de4e12af7f28f599-02', -- KJV default
  tts_voice TEXT NOT NULL DEFAULT 'onyx',
  daily_reading_minutes INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
