-- =============================================
-- PHASE 8A: DUMMY USERS FOR TESTING
-- =============================================
-- Creates test users for testing direct messaging functionality

-- =============================================
-- IMPORTANT NOTES:
-- =============================================
-- 1. This script creates users in auth.users table
-- 2. You'll need to run this with superuser/service role privileges
-- 3. Passwords are set to 'password123' for all test users
-- 4. In production, NEVER use this approach!
-- 5. These users will be added to existing communities

-- =============================================
-- CREATE DUMMY USERS
-- =============================================

DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  user4_id UUID;
  user5_id UUID;
  community_id UUID;
BEGIN
  -- Create User 1: Alex Johnson
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'alex.johnson@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  RETURNING id INTO user1_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user1_id,
    'Alex Johnson',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    'Tech enthusiast and coffee lover. Always looking to learn something new!',
    'San Francisco, CA',
    NOW(),
    NOW()
  );

  -- Create User 2: Maria Garcia
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'maria.garcia@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  RETURNING id INTO user2_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user2_id,
    'Maria Garcia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    'Fitness coach and wellness advocate. Let''s stay healthy together! 💪',
    'Austin, TX',
    NOW(),
    NOW()
  );

  -- Create User 3: James Chen
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'james.chen@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  RETURNING id INTO user3_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user3_id,
    'James Chen',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    'Software engineer by day, gamer by night 🎮',
    'Seattle, WA',
    NOW(),
    NOW()
  );

  -- Create User 4: Sarah Williams
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'sarah.williams@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  RETURNING id INTO user4_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user4_id,
    'Sarah Williams',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    'Artist and designer. Creating beauty one project at a time 🎨',
    'New York, NY',
    NOW(),
    NOW()
  );

  -- Create User 5: David Brown
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'david.brown@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated'
  )
  RETURNING id INTO user5_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user5_id,
    'David Brown',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    'Entrepreneur and startup enthusiast. Building the future! 🚀',
    'Boston, MA',
    NOW(),
    NOW()
  );

  -- =============================================
  -- ADD DUMMY USERS TO EXISTING COMMUNITIES
  -- =============================================
  -- Get existing communities and add some users to them
  
  FOR community_id IN 
    SELECT id FROM public.communities LIMIT 5
  LOOP
    -- Add user1 to all communities
    INSERT INTO public.community_members (community_id, user_id, role, joined_at)
    VALUES (community_id, user1_id, 'member', NOW())
    ON CONFLICT DO NOTHING;
    
    -- Add user2 to most communities
    IF RANDOM() > 0.2 THEN
      INSERT INTO public.community_members (community_id, user_id, role, joined_at)
      VALUES (community_id, user2_id, 'member', NOW() - INTERVAL '5 days')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Add user3 to some communities
    IF RANDOM() > 0.4 THEN
      INSERT INTO public.community_members (community_id, user_id, role, joined_at)
      VALUES (community_id, user3_id, 'member', NOW() - INTERVAL '10 days')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Add user4 to some communities
    IF RANDOM() > 0.5 THEN
      INSERT INTO public.community_members (community_id, user_id, role, joined_at)
      VALUES (community_id, user4_id, 'member', NOW() - INTERVAL '15 days')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Add user5 to few communities
    IF RANDOM() > 0.6 THEN
      INSERT INTO public.community_members (community_id, user_id, role, joined_at)
      VALUES (community_id, user5_id, 'member', NOW() - INTERVAL '20 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- =============================================
  -- CREATE SOME TEST CONVERSATIONS & MESSAGES
  -- =============================================
  -- Create a DM conversation between user1 and user2
  DECLARE
    conv_id UUID;
  BEGIN
    -- Get or create conversation
    conv_id := get_or_create_direct_conversation(user1_id, user2_id);
    
    -- Add some messages
    INSERT INTO public.chat_messages (conversation_id, user_id, message, created_at)
    VALUES 
      (conv_id, user1_id, 'Hey Maria! How are you?', NOW() - INTERVAL '2 hours'),
      (conv_id, user2_id, 'Hi Alex! I''m doing great, thanks! How about you?', NOW() - INTERVAL '1 hour 50 minutes'),
      (conv_id, user1_id, 'I''m good! Just checking out this new app 😊', NOW() - INTERVAL '1 hour 40 minutes'),
      (conv_id, user2_id, 'Yeah, it''s pretty cool! I love the community features.', NOW() - INTERVAL '1 hour 30 minutes');
  END;

  -- Create a DM conversation between user1 and user3
  DECLARE
    conv_id UUID;
  BEGIN
    conv_id := get_or_create_direct_conversation(user1_id, user3_id);
    
    INSERT INTO public.chat_messages (conversation_id, user_id, message, created_at)
    VALUES 
      (conv_id, user3_id, 'Hey! Want to join our gaming session tonight?', NOW() - INTERVAL '3 hours'),
      (conv_id, user1_id, 'Sure! What time?', NOW() - INTERVAL '2 hours 45 minutes'),
      (conv_id, user3_id, '8 PM EST. I''ll send you the link!', NOW() - INTERVAL '2 hours 30 minutes');
  END;

  RAISE NOTICE 'Successfully created 5 dummy users:';
  RAISE NOTICE '  - Alex Johnson (alex.johnson@example.com)';
  RAISE NOTICE '  - Maria Garcia (maria.garcia@example.com)';
  RAISE NOTICE '  - James Chen (james.chen@example.com)';
  RAISE NOTICE '  - Sarah Williams (sarah.williams@example.com)';
  RAISE NOTICE '  - David Brown (david.brown@example.com)';
  RAISE NOTICE 'Password for all: password123';
  RAISE NOTICE 'Users have been added to communities and sample DM conversations created!';
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Uncomment to verify the data

-- SELECT * FROM auth.users WHERE email LIKE '%@example.com';
-- SELECT * FROM public.profiles WHERE email LIKE '%@example.com';
-- SELECT * FROM public.community_members WHERE user_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@example.com');
-- SELECT * FROM public.conversations WHERE type = 'direct';
-- SELECT * FROM public.chat_messages WHERE conversation_id IN (SELECT id FROM public.conversations WHERE type = 'direct');

