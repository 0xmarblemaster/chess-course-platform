-- Update database schema to support Course structure with video and puzzle practice
-- This script adds new fields to the levels table and renames it conceptually to "courses"

-- Add new columns to levels table (which represents courses)
ALTER TABLE levels 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS puzzle_practice_url TEXT;

-- Update the levels table to remove the order column since courses don't need ordering
-- (lessons within courses have ordering instead)
ALTER TABLE levels 
DROP COLUMN IF EXISTS "order";

-- Add a comment to clarify that levels table represents courses
COMMENT ON TABLE levels IS 'Courses table - each row represents a chess course with video and puzzle practice';

-- Update the lessons table to clarify it contains lessons within courses
COMMENT ON TABLE lessons IS 'Lessons table - each row represents a lesson within a course, ordered by order_index';

-- Ensure lessons are properly ordered within each course
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(level_id, order_index);

-- Sample data update (optional - for existing data)
-- UPDATE levels SET video_url = 'https://www.youtube.com/watch?v=example' WHERE id = 1;
-- UPDATE levels SET puzzle_practice_url = 'https://lichess.org/training/example' WHERE id = 1;