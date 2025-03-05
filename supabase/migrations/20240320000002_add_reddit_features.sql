-- Add parent_id to messages table for nested replies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN parent_id UUID REFERENCES messages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add votes table for upvoting/downvoting messages
CREATE TABLE message_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for upvote, -1 for downvote
  UNIQUE(message_id, user_id) -- Each user can only vote once per message
);

-- Add vote count to messages table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'vote_count'
  ) THEN
    ALTER TABLE messages ADD COLUMN vote_count INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Enable RLS on message_votes table
ALTER TABLE message_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for message_votes
CREATE POLICY "Authenticated users can view votes"
  ON message_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert votes"
  ON message_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own votes"
  ON message_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own votes"
  ON message_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update vote count when votes change
CREATE OR REPLACE FUNCTION update_message_vote_count()
RETURNS TRIGGER AS $$
DECLARE
  vote_sum INTEGER;
BEGIN
  -- Calculate the sum of votes for this message
  SELECT COALESCE(SUM(vote_type), 0) INTO vote_sum
  FROM message_votes
  WHERE message_id = COALESCE(NEW.message_id, OLD.message_id);
  
  -- Update the message's vote_count
  UPDATE messages
  SET vote_count = vote_sum
  WHERE id = COALESCE(NEW.message_id, OLD.message_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update vote count
CREATE TRIGGER on_vote_inserted
  AFTER INSERT ON message_votes
  FOR EACH ROW EXECUTE FUNCTION update_message_vote_count();

CREATE TRIGGER on_vote_updated
  AFTER UPDATE ON message_votes
  FOR EACH ROW EXECUTE FUNCTION update_message_vote_count();

CREATE TRIGGER on_vote_deleted
  AFTER DELETE ON message_votes
  FOR EACH ROW EXECUTE FUNCTION update_message_vote_count();

-- Add policy for users to update their own messages
CREATE POLICY "Authenticated users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add policy for users to delete their own messages
CREATE POLICY "Authenticated users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id); 