-- Timeline/Posts Schema for MyCommunity App
-- Run this in your Supabase SQL Editor AFTER the main schema.sql

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policies for posts
CREATE POLICY "Posts are viewable by community members"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = posts.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = posts.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- POST LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Policies for post_likes
CREATE POLICY "Post likes are viewable by community members"
  ON public.post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      JOIN public.community_members ON community_members.community_id = posts.community_id
      WHERE posts.id = post_likes.post_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- POST COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Policies for post_comments
CREATE POLICY "Comments are viewable by community members"
  ON public.post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      JOIN public.community_members ON community_members.community_id = posts.community_id
      WHERE posts.id = post_comments.post_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS: Update counts
-- ============================================

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comments count
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS: Auto-update counts
-- ============================================

-- Triggers for post likes
DROP TRIGGER IF EXISTS on_post_like_created ON public.post_likes;
CREATE TRIGGER on_post_like_created
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION increment_post_likes();

DROP TRIGGER IF EXISTS on_post_like_deleted ON public.post_likes;
CREATE TRIGGER on_post_like_deleted
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION decrement_post_likes();

-- Triggers for post comments
DROP TRIGGER IF EXISTS on_post_comment_created ON public.post_comments;
CREATE TRIGGER on_post_comment_created
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION increment_post_comments();

DROP TRIGGER IF EXISTS on_post_comment_deleted ON public.post_comments;
CREATE TRIGGER on_post_comment_deleted
  AFTER DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION decrement_post_comments();

-- Trigger for posts updated_at
DROP TRIGGER IF EXISTS on_post_updated ON public.posts;
CREATE TRIGGER on_post_updated
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for comments updated_at
DROP TRIGGER IF EXISTS on_comment_updated ON public.post_comments;
CREATE TRIGGER on_comment_updated
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON public.post_comments(created_at);

-- ============================================
-- STORAGE BUCKET for Post Images
-- ============================================
-- Create storage bucket for post images
-- Run this in the Supabase Dashboard -> Storage section
-- Or run this SQL if you have permissions:

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('post-images', 'post-images', true);

-- Create storage policy to allow authenticated users to upload
-- CREATE POLICY "Anyone can upload post images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

-- CREATE POLICY "Anyone can view post images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'post-images');

-- ============================================
-- IMPORTANT: Manual Setup Required
-- ============================================
-- After running this schema, you MUST:
-- 1. Go to Supabase Dashboard -> Storage
-- 2. Click "New Bucket"
-- 3. Name it: post-images
-- 4. Make it PUBLIC
-- 5. This allows posts to display images properly

-- ============================================
-- SUCCESS!
-- ============================================
-- Timeline schema is ready!
-- You can now create posts, like, and comment.

