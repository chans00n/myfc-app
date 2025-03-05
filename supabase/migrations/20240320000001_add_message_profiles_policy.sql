-- Add policy for joining messages with profiles
CREATE POLICY "Authenticated users can view message profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.user_id = profiles.id
    )
  ); 