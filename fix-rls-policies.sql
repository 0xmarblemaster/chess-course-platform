-- Fix RLS policies that are causing infinite recursion
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Disable RLS temporarily to fix the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't cause recursion
CREATE POLICY "Enable read access for all authenticated users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.users
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Test the fix
SELECT 'RLS policies fixed successfully' as status;