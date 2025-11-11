-- =============================================
-- FIX: Allow all community members to create resources
-- =============================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins and moderators can create resources" ON public.resources;

-- Create a new policy that allows ALL community members to create resources
CREATE POLICY "Community members can create resources"
ON public.resources
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = resources.community_id
    AND community_members.user_id = auth.uid()
  )
);

SELECT 'Resources permissions updated - all members can now add resources!' as message;

