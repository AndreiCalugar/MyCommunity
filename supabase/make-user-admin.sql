-- =============================================
-- MAKE CURRENT USER AN ADMIN
-- =============================================
-- This script makes the currently logged-in user an admin in all communities they're a member of

UPDATE public.community_members
SET role = 'admin'
WHERE user_id = auth.uid();

-- Verify the update
SELECT 
  cm.user_id,
  cm.community_id,
  c.name as community_name,
  cm.role,
  p.full_name as user_name
FROM public.community_members cm
JOIN public.communities c ON c.id = cm.community_id
JOIN public.profiles p ON p.id = cm.user_id
WHERE cm.user_id = auth.uid();

SELECT 'User has been made admin in all their communities!' as message;

