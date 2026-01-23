-- Add max_timer_hours column to user_settings table
-- This column controls the auto-pause feature for timers
ALTER TABLE user_settings
ADD COLUMN max_timer_hours NUMERIC DEFAULT 8;

-- Add a comment explaining the column
COMMENT ON COLUMN user_settings.max_timer_hours IS 'Maximum hours before timer auto-pauses. NULL means no limit.';
