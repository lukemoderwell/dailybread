-- Question feedback table
-- Tracks user feedback on generated questions for quality improvement

CREATE TABLE public.question_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  session_id UUID REFERENCES public.reading_sessions(id) ON DELETE CASCADE,

  -- Question details for analysis
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  family_member_name TEXT NOT NULL,
  family_member_age INTEGER NOT NULL,
  question_text TEXT NOT NULL,

  -- Feedback
  rating INTEGER CHECK (rating IN (1, -1)), -- 1 = thumbs up, -1 = thumbs down
  feedback_text TEXT, -- Optional user explanation of what was wrong

  -- Metadata for improvement analysis
  bible_reference TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.question_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own feedback"
  ON public.question_feedback
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_question_feedback_user_id ON public.question_feedback(user_id);
CREATE INDEX idx_question_feedback_session_id ON public.question_feedback(session_id);
CREATE INDEX idx_question_feedback_rating ON public.question_feedback(rating);
