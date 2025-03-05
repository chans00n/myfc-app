-- Create workout_schedule table
CREATE TABLE IF NOT EXISTS workout_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for workout_schedule
CREATE INDEX IF NOT EXISTS idx_workout_schedule_user_id ON workout_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_schedule_scheduled_for ON workout_schedule(scheduled_for);

-- Create workout_progress table
CREATE TABLE IF NOT EXISTS workout_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL,
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for workout_progress
CREATE INDEX IF NOT EXISTS idx_workout_progress_user_id ON workout_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_progress_completed_at ON workout_progress(completed_at);

-- Create progress_metrics table
CREATE TABLE IF NOT EXISTS progress_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_name VARCHAR(50) NOT NULL,
  metric_value DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for progress_metrics
CREATE INDEX IF NOT EXISTS idx_progress_metrics_user_id ON progress_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_metric_name ON progress_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_recorded_at ON progress_metrics(recorded_at);

-- Enable Row Level Security on all tables
ALTER TABLE workout_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_schedule
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'workout_schedule' AND policyname = 'Users can view their own workout schedule'
  ) THEN
    CREATE POLICY "Users can view their own workout schedule"
      ON workout_schedule FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'workout_schedule' AND policyname = 'Users can insert their own workout schedule'
  ) THEN
    CREATE POLICY "Users can insert their own workout schedule"
      ON workout_schedule FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'workout_schedule' AND policyname = 'Users can update their own workout schedule'
  ) THEN
    CREATE POLICY "Users can update their own workout schedule"
      ON workout_schedule FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'workout_schedule' AND policyname = 'Users can delete their own workout schedule'
  ) THEN
    CREATE POLICY "Users can delete their own workout schedule"
      ON workout_schedule FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for workout_progress
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'workout_progress' AND policyname = 'Users can view their own workout progress'
  ) THEN
    CREATE POLICY "Users can view their own workout progress"
      ON workout_progress FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'workout_progress' AND policyname = 'Users can insert their own workout progress'
  ) THEN
    CREATE POLICY "Users can insert their own workout progress"
      ON workout_progress FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'workout_progress' AND policyname = 'Users can update their own workout progress'
  ) THEN
    CREATE POLICY "Users can update their own workout progress"
      ON workout_progress FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for progress_metrics
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'progress_metrics' AND policyname = 'Users can view their own progress metrics'
  ) THEN
    CREATE POLICY "Users can view their own progress metrics"
      ON progress_metrics FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'progress_metrics' AND policyname = 'Users can insert their own progress metrics'
  ) THEN
    CREATE POLICY "Users can insert their own progress metrics"
      ON progress_metrics FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'progress_metrics' AND policyname = 'Users can update their own progress metrics'
  ) THEN
    CREATE POLICY "Users can update their own progress metrics"
      ON progress_metrics FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$; 