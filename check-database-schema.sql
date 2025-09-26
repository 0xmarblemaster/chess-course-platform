-- Check if the new columns exist in the levels table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'levels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current structure of levels table
SELECT * FROM levels LIMIT 1;