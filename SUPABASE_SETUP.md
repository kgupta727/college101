# Supabase Authentication & Database Setup Guide

## ✅ What's Been Completed

### 1. Packages Installed
- `@supabase/supabase-js` - Supabase client library
- `@supabase/ssr` - Server-side rendering support for Next.js

### 2. Supabase Client Setup
Created three utility files:
- `src/lib/supabase/client.ts` - For client-side operations
- `src/lib/supabase/server.ts` - For server-side operations
- `src/lib/supabase/middleware.ts` - For auth middleware

### 3. Middleware Protection
- `src/middleware.ts` - Automatically protects `/flow` route
- Redirects unauthenticated users to `/login`

### 4. Authentication Pages
- **Login Page** (`/login`): Email/password + Google OAuth
- **Signup Page** (`/signup`): Email/password + Google OAuth with email verification
- **Auth Callback** (`/auth/callback`): Handles OAuth redirects

### 5. Database Schema
Created `supabase/migrations/001_initial_schema.sql` with tables:
- `profiles` - Main student profile data
- `activities` - Student activities with snapshots
- `schools` - Target schools
- `narratives` - Cached AI-generated narratives

All tables have Row Level Security (RLS) enabled - users can only access their own data.

### 6. Server Actions
Created `src/actions/profileActions.ts` with:
- `saveProfileAction()` - Saves complete profile to database
- `loadProfileAction()` - Loads user's profile from database
- `saveNarrativesAction()` - Caches generated narratives

### 7. UI Components
- `src/components/UserMenu.tsx` - User dropdown menu with logout
- Updated home page (`/`) - Shows signup prompt for unauthenticated users

---

## 🔧 What YOU Need to Do

### Step 1: Set Up Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project name**: `college101`
   - **Database password**: Choose a strong password (SAVE THIS!)
   - **Region**: Choose closest to you (e.g., us-west-1)
4. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Get API Keys

Once your project is ready:
1. Go to **Project Settings** (gear icon on left sidebar)
2. Click **API** in the left menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 3: Update .env.local

Open `.env.local` in your project and replace the placeholders:

```env
# OpenAI API Key (already set)
OPENAI_API_KEY=sk-proj-...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### Step 4: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the ENTIRE contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** (bottom right)
6. You should see "Success. No rows returned" - that's correct!

### Step 5: Enable Google OAuth (Optional - 3 minutes)

To enable "Continue with Google":

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. Go to [Google Cloud Console](https://console.cloud.google.com/)
5. Create a new project or select existing
6. Enable "Google+ API"
7. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
8. Application type: **Web application**
9. Authorized redirect URIs: Add `https://YOUR_PROJECT_URL.supabase.co/auth/v1/callback`
10. Copy **Client ID** and **Client Secret**
11. Paste them into Supabase Google provider settings
12. Click **Save**

**Skip this for now if you want to start with just email/password.**

### Step 6: Test It Out!

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000`

3. Click **"Start Your Profile"** - should redirect to signup

4. Create an account with your email

5. Check your email for verification link (check spam!)

6. Click verification link

7. Login and start filling your profile

---

## 🎯 Current Limitations & Next Steps

### What Works Now:
✅ User signup with email verification
✅ Login with email/password
✅ Google OAuth (if you set it up)
✅ Auto-redirect to signup when not logged in
✅ Protected `/flow` route
✅ User menu with logout

### What Needs to Be Finished:

1. **Auto-save functionality** - Profile data needs to be wired up to save on each "Next" click
2. **Auto-load functionality** - Load existing profile when user returns
3. **User menu integration** - Add UserMenu component to flow page header
4. **Type inconsistencies** - StudentProfile type needs to be unified across the app

---

## 📝 Database Structure

```
auth.users (managed by Supabase)
  └── profiles (your data)
       ├── activities
       ├── schools
       └── narratives
```

Each user can have:
- **1 profile** (main student info)
- **Many activities** (linked to profile)
- **Many schools** (target schools)
- **Many narratives** (cached AI results)

All data is automatically secured with Row Level Security - users can only see/edit their own data.

---

## 🔒 Security Features

1. **Row Level Security (RLS)** - Users can only access their own data
2. **Server-side auth checks** - Middleware validates every request
3. **Secure cookie handling** - Session tokens stored in HTTP-only cookies
4. **OAuth security** - Google login handled securely by Supabase

---

## 🐛 Troubleshooting

**"Invalid API key" error:**
- Check that you copied the keys correctly (no extra spaces)
- Make sure you're using the **anon public** key, not the service_role key

**"Email not confirmed" error:**
- Check your email inbox (and spam folder)
- Resend verification email from login page

**"Not authorized" database errors:**
- Make sure you ran the migration SQL script
- RLS policies must be in place

**Google OAuth not working:**
- Check redirect URI matches exactly
- Make sure Google provider is enabled in Supabase

---

## 📞 What to Tell Me

Once you've completed Steps 1-4, let me know and I'll:
1. Wire up auto-save to database on each Next click
2. Add auto-load when user returns to the app
3. Fix the type inconsistencies
4. Add the UserMenu to the flow page

Just say "Supabase is set up!" and I'll continue! 🚀
