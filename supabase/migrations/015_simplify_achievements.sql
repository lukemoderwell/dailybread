-- Simplify achievements: merge tables, drop definitions table
-- TypeScript is now the source of truth for achievement definitions

-- Drop foreign key constraints to achievement_definitions
ALTER TABLE public.family_achievements
DROP CONSTRAINT IF EXISTS family_achievements_achievement_id_fkey;

ALTER TABLE public.achievement_notifications
DROP CONSTRAINT IF EXISTS achievement_notifications_achievement_id_fkey;

-- Add 'seen' column to family_achievements
ALTER TABLE public.family_achievements
ADD COLUMN IF NOT EXISTS seen BOOLEAN DEFAULT FALSE;

-- Migrate notification data: mark achievements as unseen if they have pending notifications
UPDATE public.family_achievements fa
SET seen = NOT EXISTS (
  SELECT 1 FROM public.achievement_notifications an
  WHERE an.user_id = fa.user_id
    AND an.achievement_id = fa.achievement_id
    AND an.seen = FALSE
);

-- Drop the notifications table (no longer needed)
DROP TABLE IF EXISTS public.achievement_notifications;

-- Drop the definitions table (TypeScript is source of truth)
DROP TABLE IF EXISTS public.achievement_definitions CASCADE;

-- Update index for unseen achievements
CREATE INDEX IF NOT EXISTS idx_family_achievements_unseen
ON public.family_achievements(user_id) WHERE seen = FALSE;
