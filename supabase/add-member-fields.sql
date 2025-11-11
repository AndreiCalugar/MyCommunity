-- Add location field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update existing profiles with some sample data
-- (You can customize these for your actual users)
UPDATE public.profiles
SET 
  bio = CASE 
    WHEN bio IS NULL THEN 'Community member passionate about connecting with others.'
    ELSE bio
  END,
  location = CASE
    WHEN location IS NULL THEN 
      CASE (RANDOM() * 10)::INT
        WHEN 0 THEN 'New York, USA'
        WHEN 1 THEN 'London, UK'
        WHEN 2 THEN 'Tokyo, Japan'
        WHEN 3 THEN 'Paris, France'
        WHEN 4 THEN 'Sydney, Australia'
        WHEN 5 THEN 'Toronto, Canada'
        WHEN 6 THEN 'Berlin, Germany'
        WHEN 7 THEN 'Mumbai, India'
        WHEN 8 THEN 'São Paulo, Brazil'
        ELSE 'Amsterdam, Netherlands'
      END
    ELSE location
  END
WHERE bio IS NULL OR location IS NULL;

-- Success message
SELECT 'Location field added and profiles updated!' as message;

