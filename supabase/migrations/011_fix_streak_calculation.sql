-- Fix streak calculation to compare against NEW.date instead of CURRENT_DATE
-- This prevents timezone and timing issues from breaking streaks

DROP TRIGGER IF EXISTS on_reading_session_insert ON public.reading_sessions;
DROP FUNCTION IF EXISTS update_streak_on_completion() CASCADE;

-- Recreate the trigger function with correct date comparisons
CREATE OR REPLACE FUNCTION update_streak_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_completed DATE;
  v_current_book TEXT;
  v_current_chapter INTEGER;
  v_current_verse INTEGER;
  v_verses_read INTEGER;
BEGIN
  -- Get current progress
  SELECT
    current_streak,
    longest_streak,
    last_completed_date,
    current_book,
    current_chapter,
    current_verse
  INTO
    v_current_streak,
    v_longest_streak,
    v_last_completed,
    v_current_book,
    v_current_chapter,
    v_current_verse
  FROM public.reading_progress
  WHERE user_id = NEW.user_id;

  -- Get verses read from the session (default to 1 if not provided)
  v_verses_read := COALESCE(NEW.verses_read, 1);

  -- Calculate streak using NEW.date instead of CURRENT_DATE
  -- This ensures we compare the actual session date, not the trigger execution time
  IF v_last_completed = NEW.date THEN
    -- Already completed today, don't increment streak or progress
    RETURN NEW;
  ELSIF v_last_completed = NEW.date - INTERVAL '1 day' THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_completed IS NULL OR v_last_completed < NEW.date - INTERVAL '1 day' THEN
    -- Streak broken or first time
    v_current_streak := 1;
  END IF;

  -- Update longest streak if necessary
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Advance verse position
  -- Note: Complex multi-chapter logic will be handled by application code
  -- This trigger just increments current_verse by verses_read
  -- If verses exceed chapter, application will update book/chapter/verse directly
  v_current_verse := v_current_verse + v_verses_read;

  -- Update reading progress
  UPDATE public.reading_progress
  SET
    current_verse = v_current_verse,
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_completed_date = NEW.date,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_reading_session_insert
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_completion();
