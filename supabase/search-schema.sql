-- =============================================
-- PHASE 7B: ADVANCED SEARCH SCHEMA
-- =============================================

-- =============================================
-- SEARCH HISTORY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT, -- 'all', 'communities', 'posts', 'events', 'resources'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR SEARCH HISTORY
-- =============================================

-- Users can read their own search history
CREATE POLICY "Users can read own search history"
ON public.search_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own search history
CREATE POLICY "Users can insert own search history"
ON public.search_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own search history
CREATE POLICY "Users can delete own search history"
ON public.search_history
FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- FULL-TEXT SEARCH INDEXES
-- =============================================

-- Communities full-text search
CREATE INDEX IF NOT EXISTS idx_communities_search 
ON public.communities 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(short_description, '')));

-- Posts full-text search
CREATE INDEX IF NOT EXISTS idx_posts_search 
ON public.posts 
USING gin(to_tsvector('english', content));

-- Events full-text search
CREATE INDEX IF NOT EXISTS idx_events_search 
ON public.events 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, '')));

-- Resources full-text search
CREATE INDEX IF NOT EXISTS idx_resources_search 
ON public.resources 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(url, '')));

-- =============================================
-- SEARCH FUNCTIONS
-- =============================================

-- Function to search communities
CREATE OR REPLACE FUNCTION search_communities(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  member_count INT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.short_description,
    c.image_url,
    c.member_count,
    ts_rank(
      to_tsvector('english', c.name || ' ' || COALESCE(c.description, '') || ' ' || COALESCE(c.short_description, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM public.communities c
  WHERE to_tsvector('english', c.name || ' ' || COALESCE(c.description, '') || ' ' || COALESCE(c.short_description, ''))
    @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, c.member_count DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search posts (only in user's communities)
CREATE OR REPLACE FUNCTION search_posts(search_query TEXT, user_uuid UUID)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  user_id UUID,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.community_id,
    p.user_id,
    p.content,
    p.image_url,
    p.created_at,
    ts_rank(
      to_tsvector('english', p.content),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM public.posts p
  INNER JOIN public.community_members cm ON cm.community_id = p.community_id
  WHERE cm.user_id = user_uuid
    AND to_tsvector('english', p.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, p.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search events (only in user's communities)
CREATE OR REPLACE FUNCTION search_events(search_query TEXT, user_uuid UUID)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  event_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.community_id,
    e.title,
    e.description,
    e.location,
    e.event_date,
    e.created_at,
    ts_rank(
      to_tsvector('english', e.title || ' ' || COALESCE(e.description, '') || ' ' || COALESCE(e.location, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM public.events e
  INNER JOIN public.community_members cm ON cm.community_id = e.community_id
  WHERE cm.user_id = user_uuid
    AND to_tsvector('english', e.title || ' ' || COALESCE(e.description, '') || ' ' || COALESCE(e.location, ''))
      @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, e.event_date ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search resources (only in user's communities)
CREATE OR REPLACE FUNCTION search_resources(search_query TEXT, user_uuid UUID)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  type resource_type,
  title TEXT,
  description TEXT,
  url TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.community_id,
    r.type,
    r.title,
    r.description,
    r.url,
    r.file_url,
    r.created_at,
    ts_rank(
      to_tsvector('english', r.title || ' ' || COALESCE(r.description, '') || ' ' || COALESCE(r.url, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM public.resources r
  INNER JOIN public.community_members cm ON cm.community_id = r.community_id
  WHERE cm.user_id = user_uuid
    AND to_tsvector('english', r.title || ' ' || COALESCE(r.description, '') || ' ' || COALESCE(r.url, ''))
      @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, r.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to clean up old search history (keep last 50 per user)
CREATE OR REPLACE FUNCTION cleanup_search_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.search_history
  WHERE id IN (
    SELECT id FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM public.search_history
    ) sub
    WHERE rn > 50
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Search schema created successfully!' as message;
SELECT 'Full-text search indexes added to all major tables' as info;

