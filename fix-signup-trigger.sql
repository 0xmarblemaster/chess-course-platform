-- Fix the signup trigger to handle errors more gracefully
-- Run this in your Supabase SQL Editor

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_error text;
BEGIN
  -- Try to insert the user
  BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'student')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = COALESCE(public.users.role, 'student');

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error (you can check Supabase logs)
      v_error := SQLERRM;
      RAISE WARNING 'Error in handle_new_user: %', v_error;
      -- Still return NEW so signup doesn't fail completely
      RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Verify the trigger is created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

SELECT 'Trigger recreated successfully!' as status;
