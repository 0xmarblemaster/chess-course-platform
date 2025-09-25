-- Chess Course Platform Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create levels table
CREATE TABLE public.levels (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id SERIAL PRIMARY KEY,
  level_id INTEGER REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  lichess_embed_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress table
CREATE TABLE public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id INTEGER REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  video_watched BOOLEAN DEFAULT FALSE,
  test_passed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  level_id INTEGER REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
  badge_url TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, level_id)
);

-- Row Level Security Policies

-- Users can only see their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Levels are public for reading
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels are viewable by everyone" ON public.levels
  FOR SELECT USING (true);

-- Lessons are public for reading
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons are viewable by everyone" ON public.lessons
  FOR SELECT USING (true);

-- Progress is user-specific
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges are user-specific
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if level is completed
CREATE OR REPLACE FUNCTION public.is_level_completed(user_uuid UUID, level_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  -- Count total lessons in the level
  SELECT COUNT(*) INTO total_lessons
  FROM public.lessons
  WHERE lessons.level_id = is_level_completed.level_id;
  
  -- Count completed lessons for the user
  SELECT COUNT(*) INTO completed_lessons
  FROM public.progress p
  JOIN public.lessons l ON p.lesson_id = l.id
  WHERE p.user_id = user_uuid
    AND l.level_id = is_level_completed.level_id
    AND p.video_watched = TRUE
    AND p.test_passed = TRUE;
  
  RETURN completed_lessons = total_lessons;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award badge when level is completed
CREATE OR REPLACE FUNCTION public.award_badge_on_level_completion()
RETURNS TRIGGER AS $$
DECLARE
  level_id INTEGER;
  is_completed BOOLEAN;
BEGIN
  -- Get the level_id for this lesson
  SELECT l.level_id INTO level_id
  FROM public.lessons l
  WHERE l.id = NEW.lesson_id;
  
  -- Check if level is now completed
  SELECT public.is_level_completed(NEW.user_id, level_id) INTO is_completed;
  
  -- Award badge if level is completed
  IF is_completed THEN
    INSERT INTO public.badges (user_id, level_id, badge_url)
    VALUES (NEW.user_id, level_id, '/badges/level-' || level_id || '.png')
    ON CONFLICT (user_id, level_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to award badges on progress update
CREATE TRIGGER on_progress_update
  AFTER UPDATE ON public.progress
  FOR EACH ROW
  WHEN (NEW.video_watched = TRUE AND NEW.test_passed = TRUE)
  EXECUTE FUNCTION public.award_badge_on_level_completion();

-- Insert sample data

-- Insert sample levels
INSERT INTO public.levels (title, description, order_index, pdf_url) VALUES
('Beginner Level', 'Learn the basics of chess including piece movement, basic tactics, and opening principles.', 1, '/pdfs/beginner-level.pdf'),
('Intermediate Level', 'Advance your skills with complex tactics, positional play, and common endgames.', 2, '/pdfs/intermediate-level.pdf'),
('Advanced Level', 'Master advanced strategies, complex endgames, and tournament preparation.', 3, '/pdfs/advanced-level.pdf');

-- Insert sample lessons for Level 1
INSERT INTO public.lessons (level_id, title, video_url, lichess_embed_url, order_index) VALUES
(1, 'Introduction to Chess', 'https://youtube.com/watch?v=example1', 'https://lichess.org/training/example1', 1),
(1, 'How Pieces Move', 'https://youtube.com/watch?v=example2', 'https://lichess.org/training/example2', 2),
(1, 'Basic Checkmate Patterns', 'https://youtube.com/watch?v=example3', 'https://lichess.org/training/example3', 3),
(1, 'Opening Principles', 'https://youtube.com/watch?v=example4', 'https://lichess.org/training/example4', 4),
(1, 'Basic Tactics', 'https://youtube.com/watch?v=example5', 'https://lichess.org/training/example5', 5);

-- Insert sample lessons for Level 2
INSERT INTO public.lessons (level_id, title, video_url, lichess_embed_url, order_index) VALUES
(2, 'Advanced Tactics', 'https://youtube.com/watch?v=example6', 'https://lichess.org/training/example6', 1),
(2, 'Positional Play', 'https://youtube.com/watch?v=example7', 'https://lichess.org/training/example7', 2),
(2, 'Pawn Structures', 'https://youtube.com/watch?v=example8', 'https://lichess.org/training/example8', 3),
(2, 'King and Pawn Endgames', 'https://youtube.com/watch?v=example9', 'https://lichess.org/training/example9', 4),
(2, 'Rook Endgames', 'https://youtube.com/watch?v=example10', 'https://lichess.org/training/example10', 5);

-- Insert sample lessons for Level 3
INSERT INTO public.lessons (level_id, title, video_url, lichess_embed_url, order_index) VALUES
(3, 'Advanced Endgames', 'https://youtube.com/watch?v=example11', 'https://lichess.org/training/example11', 1),
(3, 'Complex Tactics', 'https://youtube.com/watch?v=example12', 'https://lichess.org/training/example12', 2),
(3, 'Strategic Planning', 'https://youtube.com/watch?v=example13', 'https://lichess.org/training/example13', 3),
(3, 'Tournament Preparation', 'https://youtube.com/watch?v=example14', 'https://lichess.org/training/example14', 4),
(3, 'Game Analysis', 'https://youtube.com/watch?v=example15', 'https://lichess.org/training/example15', 5);