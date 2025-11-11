-- =============================================
-- PHASE 7A: RESOURCES SCHEMA
-- =============================================

-- =============================================
-- RESOURCE TYPES ENUM
-- =============================================
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('link', 'file');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- RESOURCES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  type resource_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT, -- For links
  file_url TEXT, -- For files (Supabase Storage URL)
  file_name TEXT, -- Original file name
  file_size BIGINT, -- File size in bytes
  file_type TEXT, -- MIME type
  category TEXT, -- Optional category (Documents, Videos, Articles, etc.)
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_community ON public.resources(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_created_by ON public.resources(created_by);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR RESOURCES
-- =============================================

-- Members can read resources in their communities
CREATE POLICY "Members can read community resources"
ON public.resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = resources.community_id
    AND community_members.user_id = auth.uid()
  )
);

-- Admins and moderators can create resources
CREATE POLICY "Admins and moderators can create resources"
ON public.resources
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = resources.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin', 'moderator')
  )
);

-- Admins, moderators, and creators can update resources
CREATE POLICY "Admins, moderators, and creators can update resources"
ON public.resources
FOR UPDATE
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = resources.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin', 'moderator')
  )
);

-- Admins, moderators, and creators can delete resources
CREATE POLICY "Admins, moderators, and creators can delete resources"
ON public.resources
FOR DELETE
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = resources.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin', 'moderator')
  )
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION update_resources_updated_at();

-- =============================================
-- STORAGE BUCKET FOR FILES
-- =============================================

-- Note: Create storage bucket manually in Supabase dashboard
-- Bucket name: 'community-resources'
-- Public: false (members only)
-- File size limit: 10MB recommended
-- Allowed file types: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, jpg, jpeg, png, gif, zip

SELECT 'Resources schema created successfully!' as message;
SELECT 'Remember to create storage bucket: community-resources' as reminder;

