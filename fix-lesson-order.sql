-- Fix lesson order_index values to be unique and sequential
-- This will ensure proper navigation between lessons

-- First, let's see the current state
SELECT id, title, order_index, level_id 
FROM lessons 
ORDER BY order_index, id;

-- Update order_index to be sequential based on the current order
-- We'll use a window function to assign sequential numbers
UPDATE lessons 
SET order_index = subquery.new_order
FROM (
  SELECT id, 
         ROW_NUMBER() OVER (ORDER BY order_index, id) as new_order
  FROM lessons
) as subquery
WHERE lessons.id = subquery.id;

-- Verify the fix
SELECT id, title, order_index, level_id 
FROM lessons 
ORDER BY order_index;