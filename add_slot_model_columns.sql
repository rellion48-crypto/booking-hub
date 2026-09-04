-- Add new columns for slot model
ALTER TABLE bookings
ADD COLUMN kind text,
ADD COLUMN form text,
ADD COLUMN memo text,
ADD COLUMN slots_wanted text,
ADD COLUMN decision text DEFAULT 'pending',
ADD COLUMN email text;

-- Make existing time column nullable since we're not using it anymore
ALTER TABLE bookings ALTER COLUMN time DROP NOT NULL;
