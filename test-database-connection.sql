-- Test database connection and check if we can insert data
-- First, let's see what's in the levels table
SELECT * FROM levels;

-- Let's try to insert a test record
INSERT INTO levels (title, description, order_index, pdf_url, video_url, puzzle_practice_url)
VALUES (
  'Test Course',
  'This is a test course to verify the database is working',
  1,
  'https://example.com/test.pdf',
  'https://www.youtube.com/embed/wfb5UYf54qE',
  'https://lichess.org/training/test'
);

-- Check if the insert worked
SELECT * FROM levels WHERE title = 'Test Course';