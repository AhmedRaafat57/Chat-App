-- Add missing columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Drop existing foreign keys if they exist to avoid conflicts
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_user_id CASCADE;
ALTER TABLE room_members DROP CONSTRAINT IF EXISTS fk_room_members_user_id CASCADE;

-- Add proper foreign key constraints for joins
ALTER TABLE messages 
  ADD CONSTRAINT fk_messages_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE room_members 
  ADD CONSTRAINT fk_room_members_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Fix RLS policies for room_members
DROP POLICY IF EXISTS "Users can join rooms" ON room_members;
DROP POLICY IF EXISTS "Users can update their room membership" ON room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON room_members;

CREATE POLICY "Users can join rooms" ON room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their room membership" ON room_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON room_members
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(room_id, pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_room_members_joined_at ON room_members(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_room_id ON typing_indicators(room_id);
