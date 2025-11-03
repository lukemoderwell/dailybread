-- Add enable_tts and verses_per_session to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS enable_tts BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS verses_per_session INTEGER NOT NULL DEFAULT 15;

-- Comment on columns
COMMENT ON COLUMN public.user_preferences.enable_tts IS 'Whether to generate TTS audio for passages';
COMMENT ON COLUMN public.user_preferences.verses_per_session IS 'Target number of verses per daily reading session';
