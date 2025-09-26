-- Test simple insert to verify database connection and schema
-- First, let's check the current columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'levels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Try a simple insert with minimal data
INSERT INTO levels (title, description, order_index)
VALUES ('Test Course', 'Test Description', 1);

-- Check if the insert worked
SELECT * FROM levels WHERE title = 'Test Course';

-- Clean up the test data
DELETE FROM levels WHERE title = 'Test Course';