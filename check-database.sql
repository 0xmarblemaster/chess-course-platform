-- Check current database state
-- Run this in Supabase SQL Editor first

-- Check if tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'levels', 'lessons', 'progress', 'badges');

-- Check if users table has role column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- Check current data
SELECT COUNT(*) as user_count FROM public.users;
SELECT COUNT(*) as level_count FROM public.levels;
SELECT COUNT(*) as lesson_count FROM public.lessons;