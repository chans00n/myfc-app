-- Add policy to allow messages to reference themselves as parents
CREATE POLICY "Allow messages to reference parent messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = messages.parent_id
    )
  );

-- Add policy to allow inserting messages with parent_id
CREATE POLICY "Allow inserting messages with parent_id"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      parent_id IS NULL OR
      EXISTS (
        SELECT 1 FROM messages m
        WHERE m.id = parent_id
      )
    )
  ); 