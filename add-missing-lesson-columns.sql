-- Add missing columns to lessons table
-- These columns are being used in the LessonForm but don't exist in the database

-- Add description column
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add second Lichess embed URL
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lichess_embed_url_2 TEXT;

-- Add Lichess image URLs
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lichess_image_url TEXT;
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lichess_image_url_2 TEXT;

-- Add Lichess descriptions
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lichess_description TEXT;
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lichess_description_2 TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
ORDER BY ordinal_position;