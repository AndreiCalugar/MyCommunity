# MyCommunity App - Setup Guide

## Phase 0: Foundation Complete ✅

This project now has the basic infrastructure set up for building a community app with Supabase.

## What's Been Set Up

### Dependencies Installed

- `@supabase/supabase-js` - Supabase client library
- `zustand` - Lightweight state management
- `@react-native-async-storage/async-storage` - Persistent storage for auth
- `react-native-url-polyfill` - URL polyfill for React Native

### Folder Structure Created

```
lib/
├── supabase.ts              # Supabase client configuration
└── stores/
    ├── authStore.ts         # Authentication state management
    └── communityStore.ts    # Community state management

components/
└── shared/
    ├── Button.tsx           # Reusable button component
    ├── Input.tsx            # Reusable input component
    └── Avatar.tsx           # Avatar component with initials fallback
```

## Next Steps: Environment Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be provisioned (~2 minutes)

### 2. Get API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Copy your **anon/public** key

### 3. Create Environment File

Create a `.env` file in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Never commit the `.env` file to git (it's already in `.gitignore`)

### 4. Test the Setup

Run the app to make sure everything compiles:

```bash
pnpm start
```

## ✅ Phase 1: Authentication - COMPLETE!

Implemented features:

- ✅ Login screen with email/password
- ✅ Signup screen with full name, email, password
- ✅ Auth state management with Zustand
- ✅ Protected routes (auto-redirect based on auth state)
- ✅ Profile screen with user info and logout
- ✅ Session persistence with AsyncStorage

## Testing Phase 1

### 1. Set Up Supabase Database

Run the SQL schema in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/schema.sql`
4. Paste and click "Run"

This will create:

- `profiles` table with auto-creation trigger
- `communities` table (ready for Phase 2)
- `community_members` table (ready for Phase 2)
- All necessary RLS policies

### 2. Test the App

```bash
pnpm start
```

Then press:

- `i` for iOS simulator
- `a` for Android emulator
- Or scan QR code with Expo Go app

### 3. Test Authentication Flow

1. **Sign Up**: Create a new account with email/password
2. **Auto Login**: Should automatically log you in after signup
3. **View Profile**: Navigate to Profile tab to see your info
4. **Sign Out**: Click sign out button (with confirmation)
5. **Log In**: Sign back in with your credentials
6. **Protected Routes**: Try to access tabs without being logged in

## ✅ Phase 2: Communities List - COMPLETE!

Implemented features:

- ✅ Communities list screen with beautiful card UI
- ✅ Join/leave communities with confirmation dialogs
- ✅ Filter between "All Communities" and "My Communities"
- ✅ Real-time member count updates via Supabase subscriptions
- ✅ Optimistic UI updates for instant feedback
- ✅ Pull-to-refresh functionality
- ✅ Loading states and error handling
- ✅ Sample seed data with 10 communities

## Testing Phase 2

### 1. Add Sample Communities

Run the seed SQL in your Supabase SQL Editor:

1. Go to your Supabase dashboard → **SQL Editor**
2. Copy the contents of `supabase/seeds.sql`
3. Paste and click "Run"

This adds 10 sample communities with images and descriptions.

### 2. Test Communities Features

1. **View Communities**: See all communities in the Communities tab
2. **Join Community**: Tap "Join" button on any community card
3. **See Member Count Update**: Watch the member count increment
4. **Filter**: Toggle "My Communities" to see only joined communities
5. **Leave Community**: Tap "Leave" button (with confirmation)
6. **Pull to Refresh**: Pull down to reload communities
7. **Real-time Updates**: Open app on 2 devices, join/leave and see updates

## ✅ Phase 3: Community Detail & About - COMPLETE!

Implemented features:

- ✅ Community detail navigation (tap on any community card)
- ✅ Tab-based layout (About & Members tabs)
- ✅ About tab with full description, stats, and admin info
- ✅ Members tab with complete member list and role badges
- ✅ Leave community functionality from detail screen
- ✅ Beautiful header images and responsive design

## Testing Phase 3

### Test Community Detail Features

1. **Navigate**: Tap on any community card in the Communities list
2. **View About**: See full description, member count, creation date, admin info
3. **View Members**: Switch to Members tab to see all members with roles
4. **Leave Community**: If you're a member, tap "Leave Community" button
5. **Back Navigation**: Use back button to return to communities list

## ✅ Phase 4: Timeline/Posts & Rich Profiles - COMPLETE!

Implemented features:

- ✅ Create posts with text and images
- ✅ Like/unlike posts with instant UI feedback
- ✅ Comment on posts with full thread view
- ✅ Delete own posts and comments
- ✅ Image upload to Supabase Storage
- ✅ Real-time updates when posts are added
- ✅ Pull-to-refresh functionality
- ✅ Floating action button for quick post creation
- ✅ Time-ago timestamps and user avatars
- ✅ Enhanced Members tab with bio, location, and rich profiles
- ✅ Beautiful member cards with icons and metadata

## Testing Phase 4

### 1. Set Up Supabase Database

Run the timeline schema:

1. Go to your Supabase dashboard → **SQL Editor**
2. Copy the contents of `supabase/timeline-schema.sql`
3. Paste and click "Run"

### 2. Create Storage Bucket for Images

**IMPORTANT:** You must create a storage bucket manually:

1. Go to Supabase Dashboard → **Storage**
2. Click "**New Bucket**"
3. Name it: `post-images`
4. Make it **PUBLIC**
5. Click Create

Without this, image uploads will fail!

### 3. Enhance Profiles with Location Data

Run the profile enhancement SQL:

1. Go to your Supabase dashboard → **SQL Editor**
2. Copy the contents of `supabase/add-member-fields.sql`
3. Paste and click "Run"
4. This adds location field and populates profiles with sample data

### 4. Test Timeline Features

1. **View Timeline**: Go to any community, Timeline tab should be first
2. **Create Post**: Tap the + button (floating action button)
3. **Add Image**: Tap "Add Image" button, select a photo
4. **Post**: Write some text and tap "Post"
5. **Like**: Tap the heart icon to like/unlike posts
6. **Comment**: Tap comment icon, add comments
7. **Delete**: Tap trash icon on your own posts/comments
8. **Real-time**: Open on 2 devices, post from one, see it appear on the other

### 5. Test Enhanced Members Tab

1. **Navigate**: Go to any community → Members tab
2. **View Rich Profiles**: Each member card now shows:
   - Large avatar with name
   - Bio/description (if set)
   - Location with pin icon
   - Join date with calendar icon
   - Role badges (Admin/Moderator)
3. **Beautiful Layout**: Cards have improved spacing and icons

## ✅ Phase 5: Chat & Events - COMPLETE!

Implemented features:

- ✅ Real-time chat for community members
- ✅ Message history with pagination
- ✅ Delete own messages
- ✅ Auto-scroll to latest messages
- ✅ Create events with date, time, location, and max attendees
- ✅ RSVP system (Going/Maybe/Not Going)
- ✅ Attendee counts and lists
- ✅ Beautiful event cards with icons
- ✅ Date-time picker for event creation
- ✅ Only admins/moderators can create events

## Testing Phase 5

### 1. Set Up Database for Chat & Events

Run the chat and events schema:

1. Go to your Supabase dashboard → **SQL Editor**
2. Copy the contents of `supabase/chat-events-schema.sql`
3. Paste and click "Run"

This creates:

- `chat_messages` table for real-time messaging
- `events` table for community events
- `event_rsvps` table for RSVP tracking
- RLS policies for security
- Real-time subscriptions for chat

### 2. Test Chat Features

1. **Navigate**: Go to any community you're a member of → **Chat tab**
2. **Send Messages**: Type a message and tap send
3. **Real-time Updates**: Open on 2 devices, send from one, see it appear on the other instantly
4. **Delete Messages**: Long-press your own messages to delete them
5. **Auto-scroll**: New messages automatically scroll into view
6. **View History**: Scroll up to see older messages

### 3. Test Events Features

1. **Navigate**: Go to any community → **Events tab**
2. **View Events**: See all upcoming events
3. **Create Event**: (If you're an admin/moderator)
   - Tap the + FAB button
   - Fill in event details (title, description, date/time, location, max attendees)
   - Tap "Create Event"
4. **RSVP**: Tap the RSVP buttons on event cards:
   - ✓ Going (green)
   - ? Maybe (yellow)
   - ✗ Not Going (red)
5. **Attendee Counts**: See how many people are going
6. **Date Formatting**: Events show friendly date/time formats

### Features in Action:

**Chat:**

- Messages appear in chat bubbles (yours on the right, others on the left)
- Shows sender name and avatar for others' messages
- Timestamps show relative time (e.g., "2:30 PM", "Yesterday", "Jan 15")
- Smooth scrolling and keyboard handling

**Events:**

- Events sorted by date (soonest first)
- Event cards show: image, title, date/time, location, description
- Attendee count updates instantly when you RSVP
- Max attendees limit (if set) displayed
- Beautiful icons and color coding for RSVP statuses

## ✅ UX Polish & Improvements - COMPLETE!

Major UX enhancements applied:

- ✅ **Modal Presentation:** Community views now slide up as modals
  - Swipe down to dismiss
  - Main bottom tabs preserved underneath
  - Slide from bottom animation
  - Better navigation mental model

- ✅ **Community Categories & Filtering:**
  - 10 category tags (Tech, Music, Sports, Health, etc.)
  - Horizontal scrollable filter chips with icons
  - Dynamic filtering with instant results
  - SQL script to populate categories
  - Only shows on "All Communities" tab

- ✅ **Calendar View for Events:**
  - List/Calendar view toggle
  - Interactive calendar with event dots
  - Color-coded dots (green=going, yellow=maybe, blue=event)
  - Tap date to see events
  - Month navigation
  - Dark/light mode support

### Testing Polish Features:

1. **Community Navigation**:
   - Tap any community - notice smooth slide-up animation
   - Swipe down to dismiss (iOS) or use back button
   - Main tabs stay accessible

2. **Category Filtering**:
   - Go to Communities tab
   - Scroll category chips horizontally
   - Tap categories to filter (can select multiple)
   - Tap "All" to clear filters

3. **Event Calendar**:
   - Go to any community → Events tab
   - Tap "Calendar" toggle button
   - See events marked with colored dots
   - Tap any date to see that day's events
   - Switch back to "List" view anytime

## What's Next - Phase 6: Future Enhancements

Additional features that could be added:

- **Notifications:** Push notifications for new messages and event reminders
- **Media Sharing:** Send images in chat
- **Event Reminders:** Calendar integration and push reminders
- **Search:** Search messages and events
- **User Profiles:** Enhanced profiles with more details
- **Moderation:** Report messages, block users, admin tools
- **Themes:** Custom color themes per community
- **Badges:** Achievement badges for active members

## Project Structure Philosophy

- **lib/** - Business logic, API clients, stores
- **components/** - Reusable UI components
- **app/** - Screens and navigation (Expo Router)
- Keep components small and focused
- Use Zustand for global state
- Supabase for backend (auth, database, storage, realtime)

## Design System

Following a Discord-inspired minimal design:

- **Primary Color:** `#5865F2` (Discord blue)
- **Success Color:** `#23A559` (green)
- **Danger Color:** `#ED4245` (red)
- **Rounded corners:** 8-12px
- **Spacing:** 4px base unit (8, 12, 16, 24, 32px)

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Zustand Docs](https://zustand.docs.pmnd.rs/)
