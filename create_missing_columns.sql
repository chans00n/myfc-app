-- Add duration_seconds column to workouts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'workouts' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE workouts ADD COLUMN duration_seconds INTEGER;
    
    -- Update existing records to set duration_seconds based on duration (if it exists)
    -- Assuming duration is in minutes, convert to seconds
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'workouts' AND column_name = 'duration'
    ) THEN
      UPDATE workouts SET duration_seconds = duration * 60 WHERE duration_seconds IS NULL;
    END IF;
  END IF;
END $$; 