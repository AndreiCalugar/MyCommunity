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

## What's Next - Phase 1: Authentication

The next phase will implement:
- Login screen with email/password
- Signup screen
- Auth state management
- Protected routes
- Profile screen

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

