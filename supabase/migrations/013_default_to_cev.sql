-- Change default Bible translation from KJV to CEV (Contemporary English Version)
-- CEV is more accessible for families with children

ALTER TABLE public.user_preferences
ALTER COLUMN bible_translation SET DEFAULT '555fef9a6cb31151-01';

COMMENT ON COLUMN public.user_preferences.bible_translation IS 'API.Bible translation ID - default is CEV (555fef9a6cb31151-01)';
