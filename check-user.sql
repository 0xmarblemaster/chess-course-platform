-- Check if user exists in public.users table
SELECT id, email, role, created_at 
FROM public.users 
WHERE email = '0xmarblemaster@gmail.com';

-- Check if user exists in auth.users table
SELECT id, email, created_at 
FROM auth.users 
WHERE email = '0xmarblemaster@gmail.com';