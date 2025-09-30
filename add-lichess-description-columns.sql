-- Add Lichess description columns to lessons table
-- These will allow the admin to add descriptions for Lichess challenges

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lichess_description TEXT;

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lichess_description_2 TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND column_name IN ('lichess_description', 'lichess_description_2')
ORDER BY column_name;