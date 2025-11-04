-- Add color field to family_members table
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'mustard';

-- Update existing family members with unique colors
DO $$
DECLARE
  colors TEXT[] := ARRAY['mustard', 'coral', 'terracotta', 'burnt-orange', 'teal', 'dusty-blue', 'sage', 'lavender'];
  member_record RECORD;
  color_index INT := 0;
BEGIN
  FOR member_record IN
    SELECT id FROM public.family_members ORDER BY created_at
  LOOP
    UPDATE public.family_members
    SET color = colors[(color_index % 8) + 1]
    WHERE id = member_record.id;

    color_index := color_index + 1;
  END LOOP;
END $$;
