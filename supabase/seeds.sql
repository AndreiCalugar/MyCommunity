-- Seed Data for MyCommunity App
-- Run this AFTER schema.sql to add sample communities for testing

-- ============================================
-- SAMPLE COMMUNITIES
-- ============================================
INSERT INTO public.communities (name, short_description, description, image_url, member_count)
VALUES
  (
    'Tech Enthusiasts',
    'A community for tech lovers',
    'Join us to discuss the latest in technology, programming, and innovation. Share your projects, ask questions, and connect with fellow developers and tech enthusiasts from around the world.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    42
  ),
  (
    'Book Club',
    'Read and discuss great books',
    'Monthly book discussions, reading recommendations, and author interviews. Whether you love fiction, non-fiction, sci-fi, or romance, there''s something for everyone in our community.',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    28
  ),
  (
    'Fitness Warriors',
    'Get fit together!',
    'Share workouts, nutrition tips, and motivate each other to stay healthy. From yoga to weightlifting, running to CrossFit, we support all fitness journeys. Let''s get strong together!',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    156
  ),
  (
    'Photography Hub',
    'Capture and share moments',
    'A community for photographers of all levels. Share your photos, get feedback, learn new techniques, and participate in weekly photo challenges.',
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800',
    89
  ),
  (
    'Cooking & Recipes',
    'Food lovers unite!',
    'Share recipes, cooking tips, and food experiences. From beginners to master chefs, everyone is welcome. Let''s make delicious food together!',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
    203
  ),
  (
    'Travel Adventurers',
    'Explore the world',
    'Share travel stories, tips, and recommendations. Connect with fellow travelers, plan trips together, and discover hidden gems around the world.',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    67
  ),
  (
    'Music Makers',
    'Create and share music',
    'For musicians, producers, and music lovers. Share your tracks, collaborate on projects, get feedback, and discuss music theory and production techniques.',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    134
  ),
  (
    'Art & Design',
    'Creative minds gather here',
    'A space for artists and designers to showcase work, get inspired, and collaborate. All mediums welcome: digital art, painting, sculpture, graphic design, and more.',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
    112
  ),
  (
    'Gaming Community',
    'Level up together',
    'Discuss games, find teammates, share clips, and stay updated on gaming news. PC, console, mobile - all platforms welcome!',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    289
  ),
  (
    'Mental Wellness',
    'Support and grow together',
    'A supportive community focused on mental health, mindfulness, and personal growth. Share experiences, coping strategies, and encourage each other.',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    78
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SUCCESS!
-- ============================================
-- Sample communities have been added!
-- You can now test the app with real data.

