-- Add painting preferences to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS enable_paintings BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS painting_style_preference TEXT NOT NULL DEFAULT 'auto';

-- Comment on columns
COMMENT ON COLUMN public.user_preferences.enable_paintings IS 'Whether to generate AI paintings for Bible passages';
COMMENT ON COLUMN public.user_preferences.painting_style_preference IS 'Preferred classical painting style (auto, rembrandt, caravaggio, botticelli, vermeer, claude-lorrain, raphael)';

-- Create storage bucket for bible paintings (if not exists)
-- This needs to be run separately or via Supabase dashboard
-- Storage bucket: bible-paintings
-- Public access: enabled
-- File size limit: 10MB
-- Allowed MIME types: image/png, image/jpeg, image/webp

-- Create RLS policies for bible-paintings bucket
-- Note: These policies assume the bucket is named 'bible-paintings'
-- You need to create the bucket first via Supabase dashboard or CLI

-- Policy 1: Users can upload their own paintings
-- CREATE POLICY "Users can upload own paintings"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'bible-paintings' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy 2: Users can read their own paintings
-- CREATE POLICY "Users can read own paintings"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'bible-paintings' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy 3: Users can update their own paintings
-- CREATE POLICY "Users can update own paintings"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'bible-paintings' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy 4: Users can delete their own paintings
-- CREATE POLICY "Users can delete own paintings"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'bible-paintings' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );
