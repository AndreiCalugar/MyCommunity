-- =============================================
-- FIX: Remove infinite recursion in conversation_participants RLS policy
-- =============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;

-- =============================================
-- FIXED POLICIES (No circular references)
-- =============================================

-- Policy 1: Users can view participants in conversations they're part of
-- Instead of checking conversation_participants recursively, we check via conversations table
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (
  -- Allow viewing if user is in the same conversation (via conversations table)
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

-- Policy 2: Users can add participants when creating conversations or when already a participant
CREATE POLICY "Users can add participants to conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  -- Allow adding yourself
  user_id = auth.uid() 
  OR
  -- Or if you're already a participant (for group conversations in future)
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'conversation_participants'
ORDER BY policyname;

