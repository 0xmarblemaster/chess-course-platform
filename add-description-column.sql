-- Add description column to lessons table
-- This will allow the admin to save lesson descriptions

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND column_name = 'description';