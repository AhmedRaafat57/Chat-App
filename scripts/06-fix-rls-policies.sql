-- Drop the old INSERT policy for room_members
DROP POLICY IF EXISTS "Users can join rooms" ON room_members;

-- Create new policies for room_members that allow both INSERT and UPDATE
CREATE POLICY "Users can join rooms" ON room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their room membership" ON room_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Also ensure DELETE is allowed for users to leave rooms
CREATE POLICY "Users can leave rooms" ON room_members
  FOR DELETE USING (auth.uid() = user_id);
