-- Sample data for workouts table
INSERT INTO workouts (id, title, description, video_url, thumbnail_url, difficulty, duration, duration_seconds, exercises, date)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Facial Yoga Basics', 'Learn the fundamentals of facial yoga with this beginner-friendly routine.', 'https://example.com/videos/facial-yoga-basics.mp4', 'https://example.com/thumbnails/facial-yoga-basics.jpg', 'beginner', 15, 900, '[]'::jsonb, CURRENT_DATE - INTERVAL '7 days'),
  
  ('22222222-2222-2222-2222-222222222222', 'Advanced Cheek Sculpting', 'Intensive cheek sculpting routine for more defined cheekbones.', 'https://example.com/videos/cheek-sculpting.mp4', 'https://example.com/thumbnails/cheek-sculpting.jpg', 'intermediate', 20, 1200, '[]'::jsonb, CURRENT_DATE - INTERVAL '5 days'),
  
  ('33333333-3333-3333-3333-333333333333', 'Jawline Definition', 'Target your jawline with these effective exercises for a more defined look.', 'https://example.com/videos/jawline-definition.mp4', 'https://example.com/thumbnails/jawline-definition.jpg', 'intermediate', 25, 1500, '[]'::jsonb, CURRENT_DATE - INTERVAL '3 days'),
  
  ('44444444-4444-4444-4444-444444444444', 'Eye Area Toning', 'Reduce the appearance of fine lines around the eyes with these gentle exercises.', 'https://example.com/videos/eye-area-toning.mp4', 'https://example.com/thumbnails/eye-area-toning.jpg', 'beginner', 10, 600, '[]'::jsonb, CURRENT_DATE - INTERVAL '2 days'),
  
  ('55555555-5555-5555-5555-555555555555', 'Full Face Workout', 'Comprehensive facial workout targeting all major muscle groups for overall toning.', 'https://example.com/videos/full-face-workout.mp4', 'https://example.com/thumbnails/full-face-workout.jpg', 'advanced', 30, 1800, '[]'::jsonb, CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE 
SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  thumbnail_url = EXCLUDED.thumbnail_url,
  difficulty = EXCLUDED.difficulty,
  duration = EXCLUDED.duration,
  duration_seconds = EXCLUDED.duration_seconds,
  exercises = EXCLUDED.exercises,
  date = EXCLUDED.date;

-- Sample data for workout_schedule table
INSERT INTO workout_schedule (id, user_id, workout_id, scheduled_for, completed)
VALUES
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', '11111111-1111-1111-1111-111111111111', CURRENT_DATE + INTERVAL '1 day', false),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', '22222222-2222-2222-2222-222222222222', CURRENT_DATE + INTERVAL '3 days', false),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', '33333333-3333-3333-3333-333333333333', CURRENT_DATE + INTERVAL '5 days', false),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', '44444444-4444-4444-4444-444444444444', CURRENT_DATE + INTERVAL '7 days', false);

-- Sample data for workout_progress table
INSERT INTO workout_progress (id, user_id, workout_id, completed_at, duration_seconds, rating, notes)
VALUES
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '7 days', 950, 4, 'Felt good, noticed some immediate tightening.'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '5 days', 1180, 5, 'Great workout! Cheeks feel more toned.'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', '33333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '3 days', 1450, 3, 'Challenging but effective.'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', '55555555-5555-5555-5555-555555555555', CURRENT_DATE - INTERVAL '1 day', 1820, 5, 'Comprehensive workout, face feels rejuvenated!');

-- Sample data for progress_metrics table
INSERT INTO progress_metrics (id, user_id, metric_name, metric_value, recorded_at, notes)
VALUES
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'face_symmetry', 7.5, CURRENT_DATE - INTERVAL '30 days', 'Initial measurement'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'face_symmetry', 8.0, CURRENT_DATE - INTERVAL '20 days', 'Slight improvement'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'face_symmetry', 8.5, CURRENT_DATE - INTERVAL '10 days', 'Continuing to improve'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'face_symmetry', 9.0, CURRENT_DATE - INTERVAL '1 day', 'Significant improvement'),
  
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'jawline_definition', 6.0, CURRENT_DATE - INTERVAL '30 days', 'Initial measurement'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'jawline_definition', 6.5, CURRENT_DATE - INTERVAL '20 days', 'Slight improvement'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'jawline_definition', 7.0, CURRENT_DATE - INTERVAL '10 days', 'Continuing to improve'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'jawline_definition', 7.5, CURRENT_DATE - INTERVAL '1 day', 'Noticeable definition'),
  
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'skin_elasticity', 7.0, CURRENT_DATE - INTERVAL '30 days', 'Initial measurement'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'skin_elasticity', 7.3, CURRENT_DATE - INTERVAL '20 days', 'Slight improvement'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'skin_elasticity', 7.8, CURRENT_DATE - INTERVAL '10 days', 'Continuing to improve'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'skin_elasticity', 8.2, CURRENT_DATE - INTERVAL '1 day', 'Skin feels firmer');

-- Sample data for achievements table
INSERT INTO achievements (id, name, description, category, requirement, reward_points)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'First Workout', 'Complete your first facial workout', 'workout', 1, 10),
  ('a2222222-2222-2222-2222-222222222222', 'Consistency Champion', 'Complete workouts for 7 consecutive days', 'streak', 7, 50),
  ('a3333333-3333-3333-3333-333333333333', 'Facial Fitness Guru', 'Complete 30 facial workouts', 'workout', 30, 100),
  ('a4444444-4444-4444-4444-444444444444', 'Progress Tracker', 'Record progress metrics for 30 days', 'progress', 30, 75),
  ('a5555555-5555-5555-5555-555555555555', 'Advanced Practitioner', 'Complete 10 advanced level workouts', 'workout', 10, 150)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  requirement = EXCLUDED.requirement,
  reward_points = EXCLUDED.reward_points;

-- Sample data for user_achievements table
INSERT INTO user_achievements (id, user_id, achievement_id, earned_at)
VALUES
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'a1111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '25 days'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'a2222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '18 days'),
  (gen_random_uuid(), '8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'a4444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (user_id, achievement_id) DO UPDATE
SET earned_at = EXCLUDED.earned_at;

-- Sample data for profiles table
INSERT INTO profiles (id, full_name, avatar_url, email, created_at, updated_at, stripe_customer_id, subscription_status, subscription_plan, trial_end_date)
VALUES
  ('8eb78da7-5bdc-49b8-baed-bfa50db9d252', 'John Doe', 'https://example.com/avatars/john-doe.jpg', 'user@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, 'active', 'MONTHLY', CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  email = EXCLUDED.email,
  updated_at = CURRENT_TIMESTAMP,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  subscription_status = EXCLUDED.subscription_status,
  subscription_plan = EXCLUDED.subscription_plan,
  trial_end_date = EXCLUDED.trial_end_date;

-- Update the current user's profile with sample data
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
BEGIN
    -- Get the current user ID
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    IF current_user_id IS NOT NULL THEN
        -- Get user email
        SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
        
        -- Update or insert profile for current user
        INSERT INTO profiles (
            id, 
            full_name, 
            avatar_url, 
            email, 
            created_at, 
            updated_at, 
            stripe_customer_id, 
            subscription_status, 
            subscription_plan, 
            trial_end_date
        )
        VALUES (
            current_user_id, 
            'John Doe', 
            'https://example.com/avatars/john-doe.jpg', 
            user_email, 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP, 
            NULL, 
            'active', 
            'MONTHLY', 
            CURRENT_DATE + INTERVAL '30 days'
        )
        ON CONFLICT (id) DO UPDATE 
        SET 
            full_name = 'John Doe',
            avatar_url = 'https://example.com/avatars/john-doe.jpg',
            updated_at = CURRENT_TIMESTAMP,
            subscription_status = 'active',
            subscription_plan = 'MONTHLY',
            trial_end_date = CURRENT_DATE + INTERVAL '30 days';
    END IF;
END $$;