-- Temporarily disable RLS on all tables to test if that's the issue
-- This will allow us to isolate the problem

-- Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges DISABLE ROW LEVEL SECURITY;

-- Test if we can access data now
SELECT 'RLS disabled on all tables - test if app works now' as status;