# Database Fix Instructions

The dashboard is not displaying data because of some database schema issues. Follow these steps to fix them:

## 1. Open the Supabase Dashboard

Go to your Supabase project dashboard and navigate to the SQL Editor.

## 2. Run the Database Fix Script

Copy and paste the contents of the `fix_database.sql` file into the SQL Editor and run it. This will:
- Add any missing columns to the tables
- Create the profiles table if it doesn't exist with all required columns
- Set up Row Level Security (RLS) policies for the profiles table
- Create triggers to automatically create profiles for new users
- Create triggers to automatically update the updated_at timestamp
- Update the user ID in the sample data to match your authenticated user

## 3. Run the Sample Data Script

Copy and paste the contents of the `sample_data.sql` file into the SQL Editor and run it. This will:
- Insert sample workouts, schedules, progress metrics, and achievements
- Create or update a profile for your authenticated user

> **Note:** The sample_data.sql file has been updated to include values for the required fields:
> - `video_url` and `thumbnail_url` columns (URLs to videos and images)
> - `duration` column (integer representing workout length in minutes, e.g., 15)
> - `duration_seconds` column (integer representing workout length in seconds, e.g., 900)
> - `metric_value` column in the progress_metrics table (NOT NULL float value)
> - `full_name` and `avatar_url` columns in the profiles table (required for user display in the UI)
> - `email` column in the profiles table (NOT NULL field required for user identification)
> - `subscription_status` and `subscription_plan` columns in the profiles table (for subscription features)
>
> The script also includes ON CONFLICT clauses to handle duplicate entries in tables with unique constraints.
>
> If you encounter a NOT NULL constraint violation or type mismatch error, make sure you're using the latest version of the file.

## 4. Restart the Application

After applying the database fixes, restart your Next.js development server:

```bash
# First, stop any running instances
pkill -f "next dev"
# Then clear the Next.js cache
rm -rf .next
# Start the development server
npm run dev
```

## 5. Check Authentication

Make sure you're properly signed in to the application. The data fetching hooks require an authenticated user session to work correctly.

## 6. Check the Console

If you're still experiencing issues, check the browser console for any error messages. The hooks have been updated with debug logging to help identify where the issue might be occurring.

## Common Issues

1. **404 Errors for Static Files**: This indicates an issue with the Next.js build. Clearing the `.next` cache and restarting the server should fix this.

2. **No Data Displayed**: This could be due to:
   - Not being authenticated
   - Database schema mismatch
   - User ID mismatch in the sample data
   - Missing profile data (check if your user has an entry in the profiles table)

3. **Database Column Errors**: The sample data might be using column names that don't match the expected schema. The fix scripts should address this.
   - For example, the `progress_metrics` table uses `metric_value` (not `value`) for storing the numeric values

4. **Unique Constraint Violations**: Tables like `user_achievements` have unique constraints (e.g., a user can't earn the same achievement twice). The updated sample data script handles this with ON CONFLICT clauses.

5. **Command Line Errors**: If you see errors like `Could not read package.json: Error: ENOENT: no such file or directory`, make sure you're running commands from the correct directory:
   ```bash
   cd MYFC_App
   npm run dev
   ```
   
6. **Port Already in Use**: If you see messages like "Port 3000 is in use", you can either:
   - Use the suggested alternative port (e.g., http://localhost:3001)
   - Kill the process using port 3000 with `lsof -i :3000` to find the PID and then `kill <PID>`

7. **User Profile Not Displaying**: If you see a placeholder avatar and "User" instead of your profile:
   - Make sure the profiles table exists and has data for your user
   - Check that the user ID in the profiles table matches your authenticated user ID
   - Verify that the profiles table has the required columns: id, full_name, avatar_url, and email
   - The email field is required and cannot be null
   - The fix_database.sql script now includes triggers to automatically create profiles for new users

8. **Data Disappears After Navigation**: If your data disappears when navigating between pages:
   - This is likely due to authentication state being lost or profile data not being properly linked
   - The updated fix_database.sql script includes improved profile handling and RLS policies
   - Make sure to run both scripts in order (fix_database.sql first, then sample_data.sql)
   - Clear your browser cache and cookies if the issue persists 