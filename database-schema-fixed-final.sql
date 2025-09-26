-- FIXED Database Schema - Handles Dependencies Properly
-- This version properly drops triggers before functions

-- Step 1: Drop and recreate users table to ensure it has the role column
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create levels table
DROP TABLE IF EXISTS public.levels CASCADE;
CREATE TABLE public.levels (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create lessons table
DROP TABLE IF EXISTS public.lessons CASCADE;
CREATE TABLE public.lessons (
  id SERIAL PRIMARY KEY,
  level_id INTEGER REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  lichess_embed_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create progress table
DROP TABLE IF EXISTS public.progress CASCADE;
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

-- Step 5: Create badges table
DROP TABLE IF EXISTS public.badges CASCADE;
CREATE TABLE public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  level_id INTEGER REFERENCES public.levels(id) ON DELETE CASCADE NOT NULL,
  badge_url TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, level_id)
);

-- Step 6: Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view levels" ON public.levels;
DROP POLICY IF EXISTS "Only admins can manage levels" ON public.levels;
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Only admins can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.progress;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.badges;
DROP POLICY IF EXISTS "System can create badges for users" ON public.badges;
DROP POLICY IF EXISTS "Admins can view all badges" ON public.badges;

-- Step 8: Create RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 9: Create RLS Policies for levels table
CREATE POLICY "Anyone can view levels" ON public.levels
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage levels" ON public.levels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 10: Create RLS Policies for lessons table
CREATE POLICY "Anyone can view lessons" ON public.lessons
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage lessons" ON public.lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 11: Create RLS Policies for progress table
CREATE POLICY "Users can view their own progress" ON public.progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 12: Create RLS Policies for badges table
CREATE POLICY "Users can view their own badges" ON public.badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create badges for users" ON public.badges
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all badges" ON public.badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 13: Insert sample data
INSERT INTO public.levels (title, description, order_index, pdf_url) VALUES
  ('Beginner Level', 'Learn the basics of chess', 1, 'https://example.com/beginner-guide.pdf'),
  ('Intermediate Level', 'Improve your chess skills', 2, 'https://example.com/intermediate-guide.pdf'),
  ('Advanced Level', 'Master advanced chess strategies', 3, 'https://example.com/advanced-guide.pdf');

INSERT INTO public.lessons (level_id, title, video_url, lichess_embed_url, order_index) VALUES
  (1, 'Introduction to Chess', 'https://youtube.com/watch?v=example1', 'https://lichess.org/training/example1', 1),
  (1, 'Basic Moves', 'https://youtube.com/watch?v=example2', 'https://lichess.org/training/example2', 2),
  (1, 'Check and Checkmate', 'https://youtube.com/watch?v=example3', 'https://lichess.org/training/example3', 3),
  (2, 'Tactics and Strategy', 'https://youtube.com/watch?v=example4', 'https://lichess.org/training/example4', 1),
  (2, 'Opening Principles', 'https://youtube.com/watch?v=example5', 'https://lichess.org/training/example5', 2),
  (3, 'Advanced Tactics', 'https://youtube.com/watch?v=example6', 'https://lichess.org/training/example6', 1);

-- Step 14: Drop existing triggers FIRST (before functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 15: Drop existing functions (now safe to drop)
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.promote_to_admin(TEXT);

-- Step 16: Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'student')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(public.users.role, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 17: Create function to promote user to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET role = 'admin' 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 18: Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 19: Verify the setup
SELECT 'Database schema created successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
SELECT 'Users table columns:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users';
SELECT 'Sample data inserted:' as info;
SELECT COUNT(*) as level_count FROM public.levels;
SELECT COUNT(*) as lesson_count FROM public.lessons;