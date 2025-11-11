-- =============================================
-- STORAGE POLICIES FOR COMMUNITY RESOURCES
-- =============================================

-- This script sets up RLS policies for the 'community-resources' storage bucket
-- Make sure the bucket is created first in Supabase Dashboard

-- =============================================
-- POLICY: Community members can view resources
-- =============================================

CREATE POLICY "Community members can view resources"
ON storage.objects FOR SELECT
TO authenticated
USING (
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

-- =============================================
-- POLICY: Community members can upload resources
-- =============================================

CREATE POLICY "Community members can upload resources"
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
      -- Only admins and moderators can upload (optional - remove if all members should upload)
      AND community_members.role IN ('admin', 'moderator')
    )
  )
);

-- =============================================
-- POLICY: Admins and creators can delete resources
-- =============================================

CREATE POLICY "Admins and creators can delete resources"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-resources'
  AND (
    -- Owner can delete
    owner = auth.uid()
    OR
    -- Community admins can delete
    EXISTS (
      SELECT 1
      FROM public.community_members
      WHERE community_members.user_id = auth.uid()
      AND community_members.community_id::text = split_part(name, '/', 1)
      AND community_members.role = 'admin'
    )
  )
);

-- =============================================
-- ALTERNATIVE: More permissive upload policy
-- =============================================
-- If you want ALL community members to upload (not just admins/moderators),
-- uncomment and run this policy instead:

/*
DROP POLICY IF EXISTS "Community members can upload resources" ON storage.objects;

CREATE POLICY "All community members can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-resources'
  AND (
    EXISTS (
      SELECT 1
      FROM public.community_members
      WHERE community_members.user_id = auth.uid()
      AND community_members.community_id::text = split_part(name, '/', 1)
    )
  )
);
*/

SELECT 'Storage policies for community-resources bucket created successfully!' as message;
SELECT 'Remember: The bucket must be created first in Supabase Dashboard' as reminder;

