-- =============================================
-- ADD CATEGORIES TO COMMUNITIES
-- =============================================

-- Add categories column to communities table
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Create index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_communities_categories ON public.communities USING GIN (categories);

-- Update existing communities with sample categories
UPDATE public.communities
SET categories = CASE 
  WHEN name ILIKE '%tech%' OR name ILIKE '%coding%' OR name ILIKE '%developer%' THEN ARRAY['Tech', 'Self-Improvement']
  WHEN name ILIKE '%fitness%' OR name ILIKE '%gym%' OR name ILIKE '%workout%' THEN ARRAY['Sports & Fitness', 'Health & Wellness']
  WHEN name ILIKE '%music%' OR name ILIKE '%band%' OR name ILIKE '%concert%' THEN ARRAY['Music', 'Hobbies']
  WHEN name ILIKE '%game%' OR name ILIKE '%gaming%' THEN ARRAY['Gaming', 'Hobbies']
  WHEN name ILIKE '%food%' OR name ILIKE '%cooking%' THEN ARRAY['Food & Cooking', 'Hobbies']
  WHEN name ILIKE '%book%' OR name ILIKE '%reading%' THEN ARRAY['Self-Improvement', 'Hobbies']
  WHEN name ILIKE '%money%' OR name ILIKE '%invest%' OR name ILIKE '%finance%' THEN ARRAY['Money & Finance', 'Self-Improvement']
  ELSE ARRAY['Hobbies', 'Self-Improvement']
END
WHERE categories = '{}';

SELECT 'Categories added to communities!' as message;

