-- =============================================
-- FIX: Allow all community members to upload files
-- =============================================

-- Drop the restrictive upload policy
DROP POLICY IF EXISTS "Community members can upload resources" ON storage.objects;

-- Create a new policy that allows ALL community members to upload
CREATE POLICY "All community members can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-resources'
  AND (
    -- Extract community_id from path (format: communityId/timestamp-filename)
    EXISTS (
      SELECT 1
      FROM public.community_members
      WHERE community_members.user_id = auth.uid()
      AND community_members.community_id::text = split_part(name, '/', 1)
    )
  )
);

SELECT 'Storage permissions updated - all members can now upload files!' as message;

