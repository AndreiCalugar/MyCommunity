-- =============================================
-- PHASE 8A: DUMMY USERS FOR TESTING
-- =============================================
-- Creates test users for testing direct messaging functionality

-- =============================================
-- STEP 1: CLEANUP ORPHANED PROFILES
-- =============================================
-- Run this section first if you encounter duplicate key errors

-- Find and delete orphaned profiles (profiles without auth.users)
DELETE FROM public.profiles
WHERE id IN (
  SELECT p.id
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  WHERE u.id IS NULL
);

-- =============================================
-- STEP 2: CLEANUP EXISTING DUMMY USERS
-- =============================================

DO $$
DECLARE
  dummy_emails TEXT[] := ARRAY[
    'alex.johnson@example.com',
    'maria.garcia@example.com',
    'james.chen@example.com',
    'sarah.williams@example.com',
    'david.brown@example.com'
  ];
  dummy_user_ids UUID[];
BEGIN
  -- Get all dummy user IDs
  SELECT ARRAY_AGG(id) INTO dummy_user_ids
  FROM auth.users 
  WHERE email = ANY(dummy_emails);

  IF dummy_user_ids IS NOT NULL AND array_length(dummy_user_ids, 1) > 0 THEN
    RAISE NOTICE 'Cleaning up % existing dummy users...', array_length(dummy_user_ids, 1);
    
    -- Delete in correct order
    DELETE FROM public.chat_messages WHERE user_id = ANY(dummy_user_ids);
    DELETE FROM public.conversation_participants WHERE user_id = ANY(dummy_user_ids);
    DELETE FROM public.conversations WHERE type = 'direct' AND NOT EXISTS (
      SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversations.id
    );
    DELETE FROM public.community_members WHERE user_id = ANY(dummy_user_ids);
    DELETE FROM public.profiles WHERE id = ANY(dummy_user_ids);
    DELETE FROM auth.users WHERE id = ANY(dummy_user_ids);
    
    RAISE NOTICE '✅ Cleanup complete';
  ELSE
    RAISE NOTICE 'No existing dummy users to clean up';
  END IF;
END $$;

-- =============================================
-- STEP 3: CREATE DUMMY USERS
-- =============================================

DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  user4_id UUID;
  user5_id UUID;
  community_id UUID;
  conv_id UUID;
BEGIN
  RAISE NOTICE 'Creating dummy users...';
  
  -- User 1: Alex Johnson
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role
  ) VALUES (
    gen_random_uuid(), 'alex.johnson@example.com',
    crypt('password123', gen_salt('bf')), NOW(),
    NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}',
    false, 'authenticated'
  ) RETURNING id INTO user1_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user1_id, 'Alex Johnson',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    'Tech enthusiast and coffee lover. Always looking to learn something new!',
    'San Francisco, CA', NOW(), NOW()
  );

  -- User 2: Maria Garcia
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role
  ) VALUES (
    gen_random_uuid(), 'maria.garcia@example.com',
    crypt('password123', gen_salt('bf')), NOW(),
    NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}',
    false, 'authenticated'
  ) RETURNING id INTO user2_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user2_id, 'Maria Garcia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    'Fitness coach and wellness advocate. Let''s stay healthy together! 💪',
    'Austin, TX', NOW(), NOW()
  );

  -- User 3: James Chen
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role
  ) VALUES (
    gen_random_uuid(), 'james.chen@example.com',
    crypt('password123', gen_salt('bf')), NOW(),
    NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}',
    false, 'authenticated'
  ) RETURNING id INTO user3_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user3_id, 'James Chen',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    'Software engineer by day, gamer by night 🎮',
    'Seattle, WA', NOW(), NOW()
  );

  -- User 4: Sarah Williams
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role
  ) VALUES (
    gen_random_uuid(), 'sarah.williams@example.com',
    crypt('password123', gen_salt('bf')), NOW(),
    NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}',
    false, 'authenticated'
  ) RETURNING id INTO user4_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user4_id, 'Sarah Williams',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    'Artist and designer. Creating beauty one project at a time 🎨',
    'New York, NY', NOW(), NOW()
  );

  -- User 5: David Brown
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role
  ) VALUES (
    gen_random_uuid(), 'david.brown@example.com',
    crypt('password123', gen_salt('bf')), NOW(),
    NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}',
    false, 'authenticated'
  ) RETURNING id INTO user5_id;

  INSERT INTO public.profiles (id, full_name, avatar_url, bio, location, created_at, updated_at)
  VALUES (
    user5_id, 'David Brown',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    'Entrepreneur and startup enthusiast. Building the future! 🚀',
    'Boston, MA', NOW(), NOW()
  );

  RAISE NOTICE '✅ Created 5 users';

  -- Add to communities
  FOR community_id IN SELECT id FROM public.communities LIMIT 5 LOOP
    INSERT INTO public.community_members (community_id, user_id, role, joined_at)
    VALUES 
      (community_id, user1_id, 'member', NOW()),
      (community_id, user2_id, 'member', NOW() - INTERVAL '5 days'),
      (community_id, user3_id, 'member', NOW() - INTERVAL '10 days'),
      (community_id, user4_id, 'member', NOW() - INTERVAL '15 days'),
      (community_id, user5_id, 'member', NOW() - INTERVAL '20 days')
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE '✅ Added to communities';

  -- Create DM conversations with messages
  conv_id := get_or_create_direct_conversation(user1_id, user2_id);
  INSERT INTO public.chat_messages (conversation_id, user_id, message, created_at)
  VALUES 
    (conv_id, user1_id, 'Hey Maria! How are you?', NOW() - INTERVAL '2 hours'),
    (conv_id, user2_id, 'Hi Alex! I''m doing great, thanks! How about you?', NOW() - INTERVAL '1 hour 50 minutes'),
    (conv_id, user1_id, 'I''m good! Just checking out this new app 😊', NOW() - INTERVAL '1 hour 40 minutes'),
    (conv_id, user2_id, 'Yeah, it''s pretty cool! I love the community features.', NOW() - INTERVAL '1 hour 30 minutes');

  conv_id := get_or_create_direct_conversation(user1_id, user3_id);
  INSERT INTO public.chat_messages (conversation_id, user_id, message, created_at)
  VALUES 
    (conv_id, user3_id, 'Hey! Want to join our gaming session tonight?', NOW() - INTERVAL '3 hours'),
    (conv_id, user1_id, 'Sure! What time?', NOW() - INTERVAL '2 hours 45 minutes'),
    (conv_id, user3_id, '8 PM EST. I''ll send you the link!', NOW() - INTERVAL '2 hours 30 minutes');

  RAISE NOTICE '✅ Created sample DM conversations';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Successfully created 5 dummy users!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📧 alex.johnson@example.com';
  RAISE NOTICE '📧 maria.garcia@example.com';
  RAISE NOTICE '📧 james.chen@example.com';
  RAISE NOTICE '📧 sarah.williams@example.com';
  RAISE NOTICE '📧 david.brown@example.com';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Password for all: password123';
  RAISE NOTICE '✅ Added to communities';
  RAISE NOTICE '✅ Sample DM conversations created';
  RAISE NOTICE '========================================';
END $$;
