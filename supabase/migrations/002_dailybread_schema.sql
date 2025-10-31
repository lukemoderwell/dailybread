  -- DailyBread Bible Study App Schema (MVP - flexible for iteration)

  -- Family members (keep it simple)
  CREATE TABLE public.family_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- User reading progress (one active book at a time for simplicity)
  CREATE TABLE public.reading_progress (
    user_id UUID REFERENCES auth.users PRIMARY KEY,
    current_book TEXT NOT NULL, -- e.g., "Proverbs"
    current_chapter INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Reading sessions (completed readings)
  CREATE TABLE public.reading_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Store the content as JSON for flexibility
    -- Will contain: { scripture_text, scripture_audio_url, questions: [{family_member_id, question, audio_url}] }
    content JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Enable RLS
  ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

  -- Family members policies
  CREATE POLICY "Users manage own family members"
    ON public.family_members
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Reading progress policies
  CREATE POLICY "Users manage own progress"
    ON public.reading_progress
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Reading sessions policies
  CREATE POLICY "Users manage own sessions"
    ON public.reading_sessions
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Function to update streak when completing a session
  CREATE OR REPLACE FUNCTION public.update_streak_on_completion()
  RETURNS TRIGGER AS $$
  DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
  BEGIN
    -- Get current progress
    SELECT last_completed_date, current_streak, longest_streak
    INTO v_last_date, v_current_streak, v_longest_streak
    FROM public.reading_progress
    WHERE user_id = NEW.user_id;

    -- Calculate new streak
    IF v_last_date IS NULL THEN
      v_current_streak := 1;
    ELSIF v_last_date = NEW.date THEN
      -- Same day, no change
      v_current_streak := v_current_streak;
    ELSIF v_last_date = NEW.date - INTERVAL '1 day' THEN
      -- Consecutive day
      v_current_streak := v_current_streak + 1;
    ELSE
      -- Streak broken
      v_current_streak := 1;
    END IF;

    -- Update longest if needed
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;

    -- Update progress
    UPDATE public.reading_progress
    SET
      current_chapter = NEW.chapter + 1,
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_completed_date = NEW.date,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Trigger on session insert
  CREATE TRIGGER on_session_completed
    AFTER INSERT ON public.reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_streak_on_completion();
