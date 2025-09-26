-- Debug user role issue
-- Check if the users table has the role column
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';

-- Check your specific user record
SELECT id, email, role, created_at 
FROM public.users 
WHERE id = 'f75201c7-26c0-4340-b86c-2beb7692508d';

-- Check if RLS is blocking the query
SELECT * FROM public.users WHERE id = 'f75201c7-26c0-4340-b86c-2beb7692508d';