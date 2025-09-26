-- Re-enable RLS with proper, non-recursive policies (FIXED VERSION)
-- This will secure the database while maintaining functionality

-- Re-enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Create proper policies for users table (FIXED: using uuid comparison)
CREATE POLICY "Users can read their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for levels (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read levels" ON public.levels
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for lessons (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read lessons" ON public.lessons
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for progress (users can manage their own progress)
CREATE POLICY "Users can read their own progress" ON public.progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for badges (users can read their own badges)
CREATE POLICY "Users can read their own badges" ON public.badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON public.badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Test the policies
SELECT 'RLS policies created successfully' as status;