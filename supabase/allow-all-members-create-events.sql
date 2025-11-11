-- =============================================
-- ALLOW ALL MEMBERS TO CREATE EVENTS
-- =============================================
-- This script replaces the restrictive policy with one that allows all community members to create events

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins and moderators can create events" ON public.events;

-- Create a more permissive policy (all members can create events)
CREATE POLICY "Members can create events"
ON public.events
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = events.community_id
    AND community_members.user_id = auth.uid()
  )
);

SELECT 'All community members can now create events!' as message;

