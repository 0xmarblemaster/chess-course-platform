-- Migration: Add multi-language video URL support to lessons
-- Date: 2026-01-09
-- Description: Adds video_url_kk (Kazakh) and video_url_en (English) columns
--              Existing video_url column remains for Russian videos

-- Add Kazakh video URL column
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_url_kk TEXT;

-- Add English video URL column
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_url_en TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.lessons.video_url IS 'YouTube video URL in Russian (primary)';
COMMENT ON COLUMN public.lessons.video_url_kk IS 'YouTube video URL in Kazakh';
COMMENT ON COLUMN public.lessons.video_url_en IS 'YouTube video URL in English';
