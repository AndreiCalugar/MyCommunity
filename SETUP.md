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

---

## ✅ Phase 7A: Resources Tab - COMPLETED

### What was built:

1. **Resources Database & API**:

   - Created `resources` table with RLS policies
   - Link and file resource types
   - Category system (Documents, Videos, Articles, Tools, Guides, Other)
   - Full CRUD operations
   - File storage integration

2. **Resources Tab UI**:

   - Added new "Resources" tab in community view
   - ResourceCard component with file type icons
   - AddResourceModal with tabbed interface (Link/File)
   - FAB button to add resources
   - Delete functionality for creators/admins

3. **Features**:
   - Add links with URL, title, description
   - Upload files up to 10MB
   - Auto-open links and files on tap
   - Beautiful file type detection and icons
   - Category badges and filtering
   - Creator profiles on resources

### Setup Instructions:

1. **Run the SQL schema**:

   ```sql
   -- In Supabase SQL Editor, run:
   supabase/resources-schema.sql
   ```

2. **Create Storage Bucket**:

   - Go to Supabase Dashboard → Storage
   - Create a new bucket named: `community-resources`
   - **Make it PUBLIC** (enable public access)
   - Set file size limit: 10MB
   - Allowed types: All file types

3. **Update RLS Policies** (if needed):
   - The schema already includes policies for member access
   - Admins and moderators can create resources
   - Creators can delete their own resources

### Testing Resources:

1. **Add a Link**:

   - Go to any community you're a member of
   - Tap Resources tab
   - Tap the + FAB button
   - Select "Link" tab
   - Fill in title, URL, description
   - Optionally select a category
   - Tap "Add Link"

2. **Upload a File**:

   - Tap + button
   - Select "File" tab
   - Tap to select a file from device
   - Add title and description
   - Select category (optional)
   - Tap "Upload File"

3. **View Resources**:

   - See all links and files
   - Notice different icons for file types (PDF, image, video, etc.)
   - Tap any resource to open it
   - See creator info and upload date

4. **Delete Resources**:
   - If you created a resource, you'll see a trash icon
   - Tap to delete with confirmation

---

## ✅ Phase 7B: Advanced Search - COMPLETED

### What was built:

1. **Full-Text Search Database**:

   - Created `search_history` table with RLS policies
   - Added GIN indexes to communities, posts, events, resources tables
   - PostgreSQL `tsquery` and `tsvector` for relevance ranking
   - Search functions for each content type
   - Search history cleanup function

2. **Search API**:

   - `performSearch()` with multi-table search
   - Type filtering (All, Communities, Posts, Events, Resources)
   - Automatic search history tracking
   - Get/delete/clear history functions
   - Result count aggregation
   - Community and profile data enrichment

3. **Search Tab UI**:
   - New Search tab in main navigation
   - Real-time search input
   - Category filter chips
   - Recent search history display
   - Categorized results with icons
   - Direct navigation to content

### Setup Instructions:

1. **Run the SQL schema**:

   ```sql
   -- In Supabase SQL Editor, run:
   supabase/search-schema.sql
   ```

2. **No additional setup needed** - Search indexes are created automatically

### Testing Search:

1. **Basic Search**:

   - Go to Search tab (second tab in bottom navigation)
   - Type any keyword (e.g., "fitness", "tech", "music")
   - See categorized results appear instantly

2. **Filter by Type**:

   - Tap filter chips: All, Communities, Posts, Events, Resources
   - Search results update to show only that type
   - Try searching for "event" with "Events" filter

3. **Search History**:

   - Your searches are automatically saved
   - Tap any recent search to re-run it
   - Tap X on individual items to delete
   - Tap "Clear All" to remove all history

4. **Navigate from Results**:
   - Tap any community result → Opens community
   - Tap any post → Opens community timeline
   - Tap any event → Opens community events
   - Tap any resource → Opens community resources

---

## ✅ Phase 7C: Event Detail View - COMPLETED

### What was built:

1. **Event Detail Screen**:

   - Full-screen modal presentation
   - Event info cards (date, time, location)
   - Comprehensive description display
   - Delete functionality for creators
   - Beautiful card-based layout

2. **Attendees System**:

   - Attendees list with profiles
   - Separated by status (Going/Interested)
   - Avatar display with overflow count
   - Full attendees modal
   - Real-time count updates

3. **Enhanced RSVP UI**:
   - Three-button system (Going/Interested/Remove)
   - Visual feedback with colors
   - Success (green), Interest (yellow), Remove (red)
   - Optimistic UI updates
   - Icon indicators

### Testing Event Details:

1. **Open Event Detail**:

   - Go to any community → Events tab
   - Tap any event card (list or calendar view)
   - Event detail modal slides up

2. **View Event Info**:

   - See event title, date, time
   - Location (if provided)
   - Full description
   - Beautiful info cards with icons

3. **RSVP to Event**:

   - Tap "Going" button → Button turns green
   - Tap "Interested" → Button turns yellow
   - Tap "Remove" → Clears your RSVP
   - See attendee count update instantly

4. **View Attendees**:

   - Tap on "Attendees (N)" section
   - Opens modal with full list
   - See who's Going (green checkmark)
   - See who's Interested (star icon)
   - Avatars and names displayed

5. **Delete Event** (if you created it):
   - Tap trash icon in top right
   - Confirm deletion
   - Event is removed

---

## What's Next - Phase 8: Future Enhancements

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

## Phase 8: Direct Messaging & Messages Inbox

### Phase 8A: Direct Messaging Foundation ✅ COMPLETE

**New Features:**

- Direct messaging between users
- User profile modal with "Message" button
- Clickable usernames throughout the app (posts, chat, members)
- Unified conversations system (community + direct chats)
- Real-time message delivery

**Database Changes:**
Run these SQL scripts in order:

```sql
-- 1. Create conversations schema
-- File: supabase/conversations-schema.sql

-- 2. Fix RLS recursion issue
-- File: supabase/force-fix-rls-recursion.sql

-- 3. Make community_id nullable
-- File: supabase/make-community-id-nullable.sql

-- 4. (Optional) Create dummy users for testing
-- File: supabase/seed-dummy-users.sql
```

**New API Functions:**

- `lib/api/conversations.ts` - DM management
- `getOrCreateDirectConversation()` - Find or create DM
- `fetchConversations()` - Get all user conversations
- `sendMessageToConversation()` - Send DM
- `markConversationAsRead()` - Track read status

**New Screens:**

- `app/user/[id].tsx` - User profile modal
- `app/chat/[conversationId].tsx` - DM chat screen

**Updated Features:**

- Community chat now uses conversations system
- Keyboard handling fixed with `KeyboardAvoidingView`
- Android keyboard config: `softwareKeyboardLayoutMode: "pan"`

### Phase 8B: Messages Inbox ✅ COMPLETE

**New Features:**

- Unified messages inbox in profile
- Shows all conversations (community + direct)
- Unread message badges
- Last message preview
- Smart time formatting (relative time)
- Pull-to-refresh support

**New Screens:**

- `app/messages/index.tsx` - Messages inbox

**Navigation:**

- Profile → "View All Messages" → Inbox
- Community conversations → Community chat
- Direct messages → DM chat

**Keyboard Fix:**

- Added `softwareKeyboardLayoutMode: "pan"` to `app.json`
- Requires app rebuild after changes
- Fixed duplicate `KeyboardAvoidingView` issues

### What's Next: Phase 8C & 8D

**Phase 8C: In-App Notifications** (Planned)

- Notify on new messages
- Notify on new events in joined communities
- Badge counts on tabs
- Notification center

**Phase 8D: Deep Links & Sharing** (Planned)

- Share communities
- Share events
- Deep link support
- Open app from shared links

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Zustand Docs](https://zustand.docs.pmnd.rs/)
- [Phase 8A Summary](./PHASE-8A-SUMMARY.md)
- [Testing Status](./TESTING-STATUS.md)
