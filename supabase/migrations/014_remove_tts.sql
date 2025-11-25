-- Remove TTS (Text-to-Speech) feature
-- TTS is no longer used in the app

-- Drop TTS-related columns from user_preferences
ALTER TABLE public.user_preferences
DROP COLUMN IF EXISTS tts_voice,
DROP COLUMN IF EXISTS enable_tts;

-- Drop TTS cache table and related objects
DROP TRIGGER IF EXISTS update_tts_cache_access_trigger ON public.tts_cache;
DROP FUNCTION IF EXISTS public.update_tts_cache_access();
DROP TABLE IF EXISTS public.tts_cache;

-- Note: If you created a 'tts-audio' storage bucket, you may want to delete it manually:
-- DELETE FROM storage.buckets WHERE id = 'tts-audio';
