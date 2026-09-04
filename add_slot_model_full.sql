-- Add all new columns for slot model (if not already present)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reason text,
ADD COLUMN IF NOT EXISTS options text,
ADD COLUMN IF NOT EXISTS candidate text,
ADD COLUMN IF NOT EXISTS slot_assigned text,
ADD COLUMN IF NOT EXISTS trace text;

ALTER TABLE bookings ALTER COLUMN time DROP NOT NULL;
