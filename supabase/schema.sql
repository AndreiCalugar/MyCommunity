-- MyCommunity App Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Extends auth.users with additional profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- COMMUNITIES TABLE (for Phase 2)
-- ============================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Policies for communities (everyone can view)
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT
  USING (true);

-- ============================================
-- COMMUNITY MEMBERS TABLE (for Phase 2)
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Policies for community members
CREATE POLICY "Community members are viewable by everyone"
  ON public.community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities they're in"
  ON public.community_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);

-- ============================================
-- SEED DATA: Sample Communities (Optional)
-- ============================================
-- Uncomment to add sample communities for testing

-- INSERT INTO public.communities (name, short_description, description, image_url)
-- VALUES
--   ('Tech Enthusiasts', 'A community for tech lovers', 'Join us to discuss the latest in technology, programming, and innovation.', 'https://images.unsplash.com/photo-1518770660439-4636190af475'),
--   ('Book Club', 'Read and discuss great books', 'Monthly book discussions, reading recommendations, and author interviews.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570'),
--   ('Fitness Warriors', 'Get fit together!', 'Share workouts, nutrition tips, and motivate each other to stay healthy.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438');

-- ============================================
-- SUCCESS!
-- ============================================
-- Your database is ready for Phase 1 & Phase 2!
-- Next: Add more tables for posts, messages, events, etc. in Phase 3+

