-- Add summary column to reading_sessions for caching AI-generated summaries
ALTER TABLE public.reading_sessions
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.reading_sessions.summary IS 'AI-generated summary of the reading session (cached to avoid regeneration)';
