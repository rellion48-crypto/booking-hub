-- Add email column to bookings table
ALTER TABLE bookings ADD COLUMN email TEXT;

-- Create index on email for faster queries
CREATE INDEX idx_bookings_email ON bookings(email);
