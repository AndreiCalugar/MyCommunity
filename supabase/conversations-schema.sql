-- =============================================
-- PHASE 8A: CONVERSATIONS & DIRECT MESSAGING
-- =============================================

-- =============================================
-- CONVERSATIONS TABLE
-- =============================================
-- Stores all chat contexts (community chats + direct messages)

CREATE TYPE conversation_type AS ENUM ('community', 'direct');

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: if type is 'community', community_id must be set
  CONSTRAINT community_conversation_check CHECK (
    (type = 'community' AND community_id IS NOT NULL) OR
    (type = 'direct' AND community_id IS NULL)
  )
);

-- Index for looking up community conversations
CREATE INDEX IF NOT EXISTS idx_conversations_community ON public.conversations(community_id) WHERE type = 'community';
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);

-- =============================================
-- CONVERSATION PARTICIPANTS TABLE
-- =============================================
-- Many-to-many relationship between users and conversations

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT FALSE,
  
  -- Unique constraint: a user can only be in a conversation once
  UNIQUE(conversation_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id, last_read_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);

-- =============================================
-- UPDATE CHAT_MESSAGES TABLE
-- =============================================
-- Add conversation_id to existing chat_messages table

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Create index on conversation_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at DESC);

-- =============================================
-- MIGRATION: Create conversations for existing community chats
-- =============================================

DO $$
DECLARE
  community_record RECORD;
  new_conversation_id UUID;
BEGIN
  -- For each community, create a conversation if chat messages exist
  FOR community_record IN 
    SELECT DISTINCT community_id 
    FROM public.chat_messages 
    WHERE conversation_id IS NULL
  LOOP
    -- Create a conversation for this community
    INSERT INTO public.conversations (type, community_id)
    VALUES ('community', community_record.community_id)
    RETURNING id INTO new_conversation_id;
    
    -- Update all messages for this community to reference the new conversation
    UPDATE public.chat_messages
    SET conversation_id = new_conversation_id
    WHERE community_id = community_record.community_id 
    AND conversation_id IS NULL;
    
    -- Add all community members as conversation participants
    INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
    SELECT new_conversation_id, user_id, joined_at
    FROM public.community_members
    WHERE community_id = community_record.community_id
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Created conversation % for community %', new_conversation_id, community_record.community_id;
  END LOOP;
END $$;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: conversations
-- =============================================

-- Users can view conversations they're part of
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Users can create direct message conversations
CREATE POLICY "Users can create direct conversations"
ON public.conversations
FOR INSERT
WITH CHECK (type = 'direct');

-- System creates community conversations (handled by triggers/functions)
-- No policy needed for community conversation creation (admins only via triggers)

-- =============================================
-- RLS POLICIES: conversation_participants
-- =============================================

-- Users can view participants in their conversations
-- Fixed: Using subquery to avoid infinite recursion
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

-- Users can add participants when creating conversations or when already a participant
-- Fixed: Using subquery to avoid infinite recursion
CREATE POLICY "Users can add participants to conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  OR
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

-- Users can update their own participant record (last_read_at, is_muted)
CREATE POLICY "Users can update their participant record"
ON public.conversation_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================
-- UPDATE CHAT_MESSAGES RLS POLICIES
-- =============================================

-- Drop old policies that only check community_id
DROP POLICY IF EXISTS "Members can read community messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;

-- New policy: Users can read messages in conversations they're part of
CREATE POLICY "Users can read conversation messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = chat_messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- New policy: Users can send messages to conversations they're part of
CREATE POLICY "Users can send conversation messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = chat_messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_conversation_id UUID;
  new_conversation_id UUID;
BEGIN
  -- Check if a direct conversation already exists between these two users
  SELECT c.id INTO existing_conversation_id
  FROM public.conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
  )
  AND (
    -- Ensure it's exactly a 2-person conversation
    SELECT COUNT(*) FROM public.conversation_participants cp
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1;
  
  -- If conversation exists, return it
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;
  
  -- Otherwise, create a new conversation
  INSERT INTO public.conversations (type)
  VALUES ('direct')
  RETURNING id INTO new_conversation_id;
  
  -- Add both users as participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (new_conversation_id, user1_id),
    (new_conversation_id, user2_id);
  
  RETURN new_conversation_id;
END;
$$;

-- Function to auto-add community members to community conversations
CREATE OR REPLACE FUNCTION add_member_to_community_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  community_conversation_id UUID;
BEGIN
  -- Find the conversation for this community
  SELECT id INTO community_conversation_id
  FROM public.conversations
  WHERE type = 'community' AND community_id = NEW.community_id
  LIMIT 1;
  
  -- If no conversation exists yet, create one
  IF community_conversation_id IS NULL THEN
    INSERT INTO public.conversations (type, community_id)
    VALUES ('community', NEW.community_id)
    RETURNING id INTO community_conversation_id;
  END IF;
  
  -- Add the new member as a participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
  VALUES (community_conversation_id, NEW.user_id, NEW.joined_at)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger: When a user joins a community, add them to the community conversation
DROP TRIGGER IF EXISTS trigger_add_member_to_conversation ON public.community_members;
CREATE TRIGGER trigger_add_member_to_conversation
AFTER INSERT ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION add_member_to_community_conversation();

-- =============================================
-- VIEWS FOR EASIER QUERYING
-- =============================================

-- View: Conversations with last message info
CREATE OR REPLACE VIEW conversation_list AS
SELECT 
  c.id,
  c.type,
  c.community_id,
  c.created_at,
  c.updated_at,
  -- Last message
  (
    SELECT json_build_object(
      'message', cm.message,
      'created_at', cm.created_at,
      'user_id', cm.user_id
    )
    FROM public.chat_messages cm
    WHERE cm.conversation_id = c.id
    AND cm.deleted_at IS NULL
    ORDER BY cm.created_at DESC
    LIMIT 1
  ) AS last_message,
  -- Participant count
  (
    SELECT COUNT(*)
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = c.id
  ) AS participant_count
FROM public.conversations c;

COMMENT ON TABLE public.conversations IS 'Stores all chat contexts (community chats + direct messages)';
COMMENT ON TABLE public.conversation_participants IS 'Many-to-many relationship between users and conversations';
COMMENT ON FUNCTION get_or_create_direct_conversation IS 'Gets existing or creates new direct conversation between two users';

