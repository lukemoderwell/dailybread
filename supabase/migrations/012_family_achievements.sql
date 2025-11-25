-- Family Achievement System
-- Celebrates collective family Bible reading habits with badges

-- Achievement definitions (static reference data)
CREATE TABLE public.achievement_definitions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  is_major BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family achievements (unlocked badges per user/family)
CREATE TABLE public.family_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  achievement_id TEXT REFERENCES public.achievement_definitions(id) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Achievement notifications (pending celebrations to show)
CREATE TABLE public.achievement_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  achievement_id TEXT REFERENCES public.achievement_definitions(id) NOT NULL,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_notifications ENABLE ROW LEVEL SECURITY;

-- Achievement definitions are readable by all authenticated users
CREATE POLICY "Anyone can view achievement definitions"
  ON public.achievement_definitions FOR SELECT
  TO authenticated
  USING (true);

-- Family achievements policies
CREATE POLICY "Users can view own achievements"
  ON public.family_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.family_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievement notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.achievement_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.achievement_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.achievement_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_family_achievements_user_id ON public.family_achievements(user_id);
CREATE INDEX idx_achievement_notifications_user_id ON public.achievement_notifications(user_id);
CREATE INDEX idx_achievement_notifications_unseen ON public.achievement_notifications(user_id) WHERE seen = FALSE;

-- Seed achievement definitions
INSERT INTO public.achievement_definitions (id, category, name, description, icon, requirement_type, requirement_value, is_major, sort_order) VALUES
-- Streak achievements
('streak_1', 'streak', 'First Step', 'Complete your first reading together', 'footprints', 'streak', 1, FALSE, 1),
('streak_7', 'streak', 'Week Warrior', 'Read together for 7 days in a row', 'shield', 'streak', 7, FALSE, 2),
('streak_14', 'streak', 'Fortnight Family', 'Read together for 14 days in a row', 'mountain', 'streak', 14, FALSE, 3),
('streak_30', 'streak', 'Monthly Masters', 'Read together for 30 days in a row', 'moon', 'streak', 30, TRUE, 4),
('streak_100', 'streak', 'Century Club', 'Read together for 100 days in a row', 'crown', 'streak', 100, TRUE, 5),
('streak_365', 'streak', 'Year of Faith', 'Read together for an entire year!', 'sun', 'streak', 365, TRUE, 6),

-- Book completion achievements
('book_first', 'book', 'First Finish', 'Complete your first book of the Bible', 'book-open', 'book_count', 1, FALSE, 1),
('book_gospel', 'book', 'Gospel Reader', 'Complete any Gospel (Matthew, Mark, Luke, or John)', 'cross', 'custom', NULL, TRUE, 2),
('book_nt', 'book', 'New Testament', 'Complete all 27 New Testament books', 'bird', 'book_count', 27, TRUE, 3),
('book_ot', 'book', 'Old Testament', 'Complete all 39 Old Testament books', 'scroll', 'book_count', 39, TRUE, 4),
('book_bible', 'book', 'The Whole Story', 'Complete all 66 books of the Bible', 'book-heart', 'book_count', 66, TRUE, 5),

-- Journey milestones
('journey_start', 'journey', 'Getting Started', 'Begin your family Bible journey', 'sprout', 'session_count', 1, FALSE, 1),
('journey_25', 'journey', 'Quarter Way', 'Read 25% of the Bible together', 'circle-dot', 'bible_percent', 25, FALSE, 2),
('journey_50', 'journey', 'Halfway There', 'Read 50% of the Bible together', 'loader', 'bible_percent', 50, TRUE, 3),
('journey_75', 'journey', 'Almost There', 'Read 75% of the Bible together', 'circle-dot-dashed', 'bible_percent', 75, TRUE, 4),
('journey_100', 'journey', 'Journey Complete', 'Read the entire Bible as a family!', 'trophy', 'bible_percent', 100, TRUE, 5),

-- Special achievements
('special_50_sessions', 'special', 'Bookworm', 'Complete 50 reading sessions', 'book-open-check', 'session_count', 50, FALSE, 1),
('special_100_sessions', 'special', 'Story Time', 'Complete 100 reading sessions', 'library', 'session_count', 100, TRUE, 2);
