-- Add notes column to family_members for personalization context
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.family_members.notes IS 'Optional parent notes about the child: interests, personality, things they are working on, etc. Used to personalize discussion questions.';
