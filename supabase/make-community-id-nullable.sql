-- =============================================
-- FIX: Make community_id nullable in chat_messages
-- =============================================
-- Direct messages don't have a community_id, only conversation_id

-- Remove NOT NULL constraint from community_id
ALTER TABLE public.chat_messages 
ALTER COLUMN community_id DROP NOT NULL;

-- Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_messages' 
AND column_name IN ('community_id', 'conversation_id');

-- Should show community_id as nullable (is_nullable = 'YES')

