-- Fix any missing columns in the workouts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'exercises') THEN
        ALTER TABLE workouts ADD COLUMN exercises JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'duration_seconds') THEN
        ALTER TABLE workouts ADD COLUMN duration_seconds INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'duration') THEN
        ALTER TABLE workouts ADD COLUMN duration INTEGER DEFAULT 0;
    END IF;
END $$;

-- Fix any missing columns in the achievements table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'category') THEN
        ALTER TABLE achievements ADD COLUMN category TEXT DEFAULT 'workout';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'requirement') THEN
        ALTER TABLE achievements ADD COLUMN requirement INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'reward_points') THEN
        ALTER TABLE achievements ADD COLUMN reward_points INTEGER DEFAULT 10;
    END IF;
END $$;

-- Fix any missing columns in the user_achievements table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'earned_at') THEN
        ALTER TABLE user_achievements ADD COLUMN earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Fix any missing columns in the progress_metrics table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'progress_metrics' AND column_name = 'metric_value') THEN
        ALTER TABLE progress_metrics ADD COLUMN metric_value FLOAT DEFAULT 0;
    END IF;
END $$;

-- Create profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            full_name TEXT,
            avatar_url TEXT,
            email TEXT NOT NULL,
            stripe_customer_id TEXT,
            subscription_status TEXT,
            subscription_plan TEXT,
            trial_end_date TIMESTAMP WITH TIME ZONE
        );
        
        -- Enable Row Level Security
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view their own profile"
            ON profiles FOR SELECT
            USING (auth.uid() = id);
        
        CREATE POLICY "Users can update their own profile"
            ON profiles FOR UPDATE
            USING (auth.uid() = id);
        
        CREATE POLICY "Users can insert their own profile"
            ON profiles FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Fix any missing columns in the profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT NOT NULL DEFAULT 'user@example.com';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
        ALTER TABLE profiles ADD COLUMN subscription_plan TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_end_date') THEN
        ALTER TABLE profiles ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create or replace the function to handle new users
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'User'));
        RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Create the trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END $$;

-- Create or replace the function to handle updated_at
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
    
    -- Create the trigger
    CREATE TRIGGER handle_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- Update user ID in sample data to match the current user
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
BEGIN
    -- Get the current user ID
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    IF current_user_id IS NOT NULL THEN
        -- Update workout_schedule
        UPDATE workout_schedule SET user_id = current_user_id WHERE user_id = '8eb78da7-5bdc-49b8-baed-bfa50db9d252';
        
        -- Update workout_progress
        UPDATE workout_progress SET user_id = current_user_id WHERE user_id = '8eb78da7-5bdc-49b8-baed-bfa50db9d252';
        
        -- Update progress_metrics
        UPDATE progress_metrics SET user_id = current_user_id WHERE user_id = '8eb78da7-5bdc-49b8-baed-bfa50db9d252';
        
        -- Update user_achievements
        UPDATE user_achievements SET user_id = current_user_id WHERE user_id = '8eb78da7-5bdc-49b8-baed-bfa50db9d252';
        
        -- Check if profile exists for current user
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = current_user_id) THEN
            -- Get user email from auth.users
            SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
            
            -- Insert profile for current user
            INSERT INTO profiles (id, email, full_name, avatar_url, updated_at)
            VALUES (current_user_id, user_email, 'User', NULL, NOW());
        END IF;
        
        -- Update sample profile to current user if it exists
        IF EXISTS (SELECT 1 FROM profiles WHERE id = '8eb78da7-5bdc-49b8-baed-bfa50db9d252') THEN
            UPDATE profiles SET id = current_user_id WHERE id = '8eb78da7-5bdc-49b8-baed-bfa50db9d252';
        END IF;
    END IF;
END $$;

