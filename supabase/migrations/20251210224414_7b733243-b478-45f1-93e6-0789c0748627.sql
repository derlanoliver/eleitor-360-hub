-- Add new categories array column
ALTER TABLE events ADD COLUMN categories TEXT[] DEFAULT '{}';

-- Migrate existing category data to new array column
UPDATE events SET categories = ARRAY[category] WHERE category IS NOT NULL AND category != '';

-- Drop the old category column
ALTER TABLE events DROP COLUMN category;