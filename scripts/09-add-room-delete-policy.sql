-- Add DELETE policy for rooms table to allow room deletion
CREATE POLICY "Users can delete their own rooms" ON rooms
  FOR DELETE USING (auth.uid() = created_by);
