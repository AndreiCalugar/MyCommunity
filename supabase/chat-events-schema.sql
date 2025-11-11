-- =============================================
-- PHASE 5: CHAT & EVENTS SCHEMA
-- =============================================

-- =============================================
-- CHAT MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_community ON public.chat_messages(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
-- Members can read messages in their communities
CREATE POLICY "Members can read community messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = chat_messages.community_id
    AND community_members.user_id = auth.uid()
  )
);

-- Members can insert messages in their communities
CREATE POLICY "Members can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = chat_messages.community_id
    AND community_members.user_id = auth.uid()
  )
);

-- Users can soft-delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- EVENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  max_attendees INTEGER DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_community ON public.events(community_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
-- Members can read events in their communities
CREATE POLICY "Members can read community events"
ON public.events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = events.community_id
    AND community_members.user_id = auth.uid()
  )
);

-- Admins and Moderators can create events
CREATE POLICY "Admins and moderators can create events"
ON public.events
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = events.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin', 'moderator')
  )
);

-- Admins, moderators, and event creators can update events
CREATE POLICY "Admins, moderators, and creators can update events"
ON public.events
FOR UPDATE
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = events.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin', 'moderator')
  )
);

-- Admins, moderators, and event creators can delete events
CREATE POLICY "Admins, moderators, and creators can delete events"
ON public.events
FOR DELETE
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = events.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin', 'moderator')
  )
);

-- =============================================
-- EVENT RSVPs TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON public.event_rsvps(user_id);

-- Enable Row Level Security
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_rsvps
-- Members can read RSVPs for events in their communities
CREATE POLICY "Members can read event RSVPs"
ON public.event_rsvps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    INNER JOIN public.community_members ON community_members.community_id = events.community_id
    WHERE events.id = event_rsvps.event_id
    AND community_members.user_id = auth.uid()
  )
);

-- Members can create/update their own RSVPs
CREATE POLICY "Members can manage own RSVPs"
ON public.event_rsvps
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp for chat_messages
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_messages_updated_at();

-- Update updated_at timestamp for events
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION update_events_updated_at();

-- Update updated_at timestamp for event_rsvps
CREATE OR REPLACE FUNCTION update_event_rsvps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_rsvps_updated_at
BEFORE UPDATE ON public.event_rsvps
FOR EACH ROW
EXECUTE FUNCTION update_event_rsvps_updated_at();

-- =============================================
-- ENABLE REALTIME FOR CHAT
-- =============================================

-- Enable realtime for chat messages (for live chat updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 'Chat and Events schema created successfully!' as message;

