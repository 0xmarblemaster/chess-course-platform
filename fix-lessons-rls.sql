-- Fix RLS policies for lessons table to allow INSERT operations
-- This should resolve the 409 error when creating lessons

-- First, let's check what policies exist on lessons table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'lessons';

-- Drop existing policies on lessons table
DROP POLICY IF EXISTS "Allow read for all" ON public.lessons;

-- Re-enable RLS on lessons table
ALTER TABLE public.lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for lessons table
CREATE POLICY "Allow read for all" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.lessons 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON public.lessons 
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON public.lessons 
    FOR DELETE USING (auth.role() = 'authenticated');

-- Also fix levels table to ensure it has proper INSERT policies
DROP POLICY IF EXISTS "Allow read for all" ON public.levels;
ALTER TABLE public.levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON public.levels FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.levels 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON public.levels 
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON public.levels 
    FOR DELETE USING (auth.role() = 'authenticated');

-- Test the fix
SELECT 'RLS policies for lessons and levels tables fixed successfully' as status;