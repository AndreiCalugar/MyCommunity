-- =============================================
-- AGGRESSIVE FIX: Remove ALL conversation_participants policies and recreate
-- Uses SECURITY DEFINER function to break recursion
-- =============================================

-- Step 1: Drop ALL existing policies on conversation_participants
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_participants'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversation_participants', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Step 2: Create a SECURITY DEFINER function to check conversation membership
-- This runs with elevated privileges and bypasses RLS, preventing recursion
CREATE OR REPLACE FUNCTION is_conversation_participant(
  conv_id UUID,
  check_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_participant BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = check_user_id
  ) INTO is_participant;
  
  RETURN is_participant;
END;
$$;

-- Step 3: Create NEW policies using the SECURITY DEFINER function

-- Policy 1: SELECT - View participants (uses function, no recursion)
CREATE POLICY "view_conversation_participants_v3"
ON public.conversation_participants
FOR SELECT
USING (
  is_conversation_participant(conversation_id, auth.uid())
);

-- Policy 2: INSERT - Add participants (simple check, no recursion)
CREATE POLICY "insert_conversation_participants_v3"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  -- Can only add yourself
  user_id = auth.uid()
);

-- Policy 3: UPDATE - Update own record (simple check, no recursion)
CREATE POLICY "update_own_participant_record_v3"
ON public.conversation_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 4: DELETE - Remove yourself from conversations (simple check, no recursion)
CREATE POLICY "delete_own_participant_record_v3"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());

-- Step 4: Verify new policies
SELECT '✅ New policies created:' as status;
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'conversation_participants'
ORDER BY policyname;
