-- Safely add DELETE policy for rooms table (handles if policy already exists)
DO $$ 
BEGIN
    -- Try to create the policy, ignore if it already exists
    BEGIN
        CREATE POLICY "Users can delete their own rooms" ON rooms
          FOR DELETE USING (auth.uid() = created_by);
        RAISE NOTICE 'Room delete policy created successfully';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Room delete policy already exists, skipping...';
    END;
END $$;
