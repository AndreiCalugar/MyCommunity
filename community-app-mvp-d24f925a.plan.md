<!-- d24f925a-fcd0-4c2d-9fa0-4bc4e58790cd b9a12107-7d03-4aae-a146-5a4aeb078ebe -->
# MyCommunity App - MVP Implementation Plan

## Overview

Transform the Expo starter into a community-building app with Supabase backend, featuring authentication, community browsing, and full community features (chat, timeline, calendar, events, members, resources).

## Tech Stack Configuration

### 1. Project Dependencies & Setup

**Install required packages:**

- Supabase client: `@supabase/supabase-js`
- Auth providers: `@react-native-google-signin/google-signin`, `expo-apple-authentication`
- UI/UX: `react-native-gifted-chat` (chat), `react-native-calendars` (calendar), `expo-image-picker` (media uploads)
- State management: `zustand` (lightweight global state)
- Testing: `jest`, `@testing-library/react-native`, `@testing-library/jest-native`, `maestro` (later)
- Analytics: `posthog-react-native`, `@sentry/react-native`
- Payments: `react-native-purchases` (RevenueCat - for future)

**Configuration files to create/update:**

- `.env` for Supabase keys
- `app.json` for EAS configuration
- `eas.json` for build profiles

### 2. Supabase Backend Schema

**Database Tables:**

```sql
-- Users (extends Supabase auth.users)
profiles (id, email, full_name, avatar_url, bio, created_at)

-- Communities
communities (id, name, description, short_description, image_url, admin_id, member_count, created_at)

-- Membership
community_members (id, community_id, user_id, role, joined_at)
community_invites (id, community_id, inviter_id, invitee_email, status, created_at)

-- Timeline/Posts
posts (id, community_id, user_id, content, media_urls[], type, likes_count, created_at)
post_likes (id, post_id, user_id, created_at)
post_comments (id, post_id, user_id, content, created_at)

-- Chat
messages (id, community_id, user_id, content, created_at)

-- Events/Calendar
events (id, community_id, creator_id, title, description, start_time, end_time, location, created_at)

-- Resources
resources (id, community_id, uploader_id, title, description, file_url, file_type, created_at)
```

**Row Level Security (RLS) policies:**

- Users can only read communities they're members of (except public community list)
- Only admins can create communities
- Community members can read posts, messages, events, resources
- Members can create posts, messages; admins control resources

### 3. App Architecture

**Folder structure:**

```
app/
├── (auth)/           # Auth flow (login, signup)
│   ├── login.tsx
│   ├── signup.tsx
│   └── _layout.tsx
├── (tabs)/           # Main app tabs
│   ├── profile.tsx
│   ├── communities.tsx
│   └── _layout.tsx
├── community/        # Community detail & nested tabs
│   ├── [id]/
│   │   ├── about.tsx
│   │   ├── chat.tsx
│   │   ├── timeline.tsx
│   │   ├── events.tsx
│   │   ├── members.tsx
│   │   ├── resources.tsx
│   │   └── _layout.tsx
├── _layout.tsx       # Root layout with auth check
└── index.tsx         # Entry redirect

lib/
├── supabase.ts       # Supabase client
├── auth.ts           # Auth helpers (Google, Apple)
└── stores/           # Zustand stores
    ├── authStore.ts
    └── communityStore.ts

components/
├── auth/
│   └── SocialAuthButtons.tsx
├── community/
│   ├── CommunityCard.tsx
│   ├── CommunityHeader.tsx
│   └── JoinButton.tsx
├── posts/
│   ├── PostCard.tsx
│   ├── CreatePost.tsx
│   └── PostActions.tsx
├── chat/
│   └── ChatBubble.tsx
└── shared/
    ├── Avatar.tsx
    ├── Button.tsx
    └── Input.tsx
```

## Implementation Steps

### Phase 1: Foundation & Authentication

1. **Environment & Supabase Setup**

   - Create Supabase project, get API keys
   - Set up `.env` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Initialize Supabase client in `lib/supabase.ts`
   - Create database schema with migrations
   - Configure RLS policies

2. **Auth System**

   - Build login/signup screens with email/password
   - Integrate Google Sign-In (`@react-native-google-signin/google-signin`)
   - Integrate Apple Authentication (`expo-apple-authentication`)
   - Create auth context/store with Zustand
   - Add auth state persistence with `AsyncStorage`
   - Implement protected routes in root `_layout.tsx`

3. **User Profile**

   - Create/update profile schema in Supabase
   - Build profile screen with avatar, name, bio
   - Implement profile editing
   - Add image upload with `expo-image-picker` + Supabase Storage

### Phase 2: Communities List & Discovery

4. **Community List Screen**

   - Design `CommunityCard` component (image, name, short description, member count, join button)
   - Fetch communities from Supabase with real-time subscriptions
   - Implement join/leave functionality
   - Add loading states and error handling

5. **Community Detail - About Tab**

   - Create dynamic route: `app/community/[id]/_layout.tsx` with nested tabs
   - Build About screen with full description, admin info, member count
   - Add "Leave Community" button

### Phase 3: Core Community Features

6. **Chat Feature**

   - Use `react-native-gifted-chat` for UI
   - Implement real-time messaging with Supabase Realtime
   - Store messages in Supabase with proper RLS
   - Add user avatars and timestamps

7. **Timeline/Posts**

   - Create post creation UI (text, images, events)
   - Implement post feed with infinite scroll
   - Add like/comment functionality
   - Use Supabase Storage for media uploads
   - Real-time updates for new posts

8. **Members List**

   - Display community members with avatars, names, roles
   - Add search/filter functionality
   - Show online status (optional)

9. **Events & Calendar**

   - Integrate `react-native-calendars` for calendar view
   - Create event detail modal/screen
   - Allow admins to create events
   - Show upcoming events list

10. **Resources Tab**

    - Display resources list (documents, images, files)
    - Allow members to upload resources
    - Use Supabase Storage for file management
    - Add file preview/download functionality

### Phase 4: Polish & Production Ready

11. **Analytics & Monitoring**

    - Integrate PostHog for analytics
    - Set up Sentry for crash reporting
    - Track key events (signups, community joins, posts created)

12. **Testing Setup**

    - Configure Jest + React Native Testing Library
    - Write unit tests for key components
    - Set up Maestro for E2E UI flow tests
    - Add test scripts to `package.json`

13. **CI/CD with GitHub Actions**

    - Create `.github/workflows/ci.yml`
    - Add lint, type-check, test jobs
    - Set up EAS Preview builds on PR
    - Configure build notifications

14. **EAS Build & Release**

    - Configure `eas.json` with build profiles (dev, preview, production)
    - Set up app icons and splash screens
    - Create EAS development build
    - Prepare for TestFlight/Google Play beta

## Design System (Modern Minimal - Discord-inspired)

**Color Palette:**

- Background: `#FFFFFF` (light), `#1E1F22` (dark)
- Surface: `#F2F3F5` (light), `#2B2D31` (dark)
- Primary: `#5865F2` (Discord blue)
- Text: `#060607` (light), `#FFFFFF` (dark)
- Secondary text: `#4E5058` (light), `#B5BAC1` (dark)
- Accent: `#23A559` (green for success)

**Typography:**

- Headings: SF Pro Display / Inter (bold, 20-28px)
- Body: SF Pro Text / Inter (regular, 14-16px)
- Captions: 12px

**Spacing:** 4px base unit (8, 12, 16, 24, 32px)

**Components:** Rounded corners (8-12px), subtle shadows, clean borders, lots of white space

## Key Files to Create/Modify

**New files:**

- `lib/supabase.ts`, `lib/auth.ts`, `lib/stores/authStore.ts`, `lib/stores/communityStore.ts`
- `app/(auth)/*` (login, signup screens)
- `app/(tabs)/communities.tsx`, `app/(tabs)/profile.tsx`
- `app/community/[id]/*` (all community feature screens)
- `components/community/CommunityCard.tsx`, `components/posts/PostCard.tsx`, etc.
- `.env`, `eas.json`, `.github/workflows/ci.yml`

**Modify:**

- `app/_layout.tsx` (add auth provider, protect routes)
- `app/(tabs)/_layout.tsx` (update tab structure)
- `package.json` (add dependencies, test scripts)
- `app.json` (update app name, icons, permissions)

## Notes

- Start with email/password auth, then add social providers
- Use Supabase Realtime for chat and live updates
- Implement optimistic updates for better UX
- Add proper error boundaries and fallback UI
- Keep components small and reusable
- Write tests as you go for critical paths

### To-dos

- [ ] Create Supabase project, set up environment variables, initialize client, and create database schema with RLS policies
- [ ] Build authentication system with email/password, Google, and Apple sign-in, including auth context and protected routes
- [ ] Create user profile screen with avatar upload, bio editing, and profile management
- [ ] Build communities list screen with CommunityCard components, join/leave functionality, and real-time updates
- [ ] Create community detail structure with About tab showing full description and community info
- [ ] Implement real-time chat using Gifted Chat and Supabase Realtime
- [ ] Build timeline feature with post creation, media uploads, likes, comments, and infinite scroll
- [ ] Create members list with search functionality and role indicators
- [ ] Implement events and calendar view with event details and creation interface
- [ ] Build resources tab with file upload, preview, and download functionality
- [ ] Integrate PostHog analytics and Sentry crash reporting
- [ ] Configure Jest, Testing Library, and Maestro with test scripts and initial test coverage
- [ ] Set up GitHub Actions CI pipeline and EAS build configuration for development, preview, and production builds