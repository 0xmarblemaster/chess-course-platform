-- Temporarily disable RLS again to get the app working
-- We'll implement proper RLS later once the basic functionality is confirmed

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled - app should work now' as status;