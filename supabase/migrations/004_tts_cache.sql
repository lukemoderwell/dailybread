-- TTS Cache table to store generated audio references
CREATE TABLE IF NOT EXISTS public.tts_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE, -- Hash of content + voice
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  content_hash TEXT NOT NULL, -- For quick lookup
  voice TEXT NOT NULL,
  audio_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX idx_tts_cache_key ON public.tts_cache(cache_key);
CREATE INDEX idx_tts_cache_content_hash ON public.tts_cache(content_hash);
CREATE INDEX idx_tts_cache_last_accessed ON public.tts_cache(last_accessed_at);

-- Enable RLS
ALTER TABLE public.tts_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (since this is cached content)
CREATE POLICY "Anyone can read TTS cache"
  ON public.tts_cache FOR SELECT
  USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert TTS cache"
  ON public.tts_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Function to update last accessed timestamp
CREATE OR REPLACE FUNCTION public.update_tts_cache_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for TTS audio (run this manually in Supabase dashboard or via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tts-audio', 'tts-audio', true)
-- ON CONFLICT (id) DO NOTHING;
