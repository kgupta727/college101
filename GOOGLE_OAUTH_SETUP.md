# Google OAuth Setup Guide for college101

## Current Status
Google OAuth buttons are visible in the app but not yet configured. When users click them, they'll see: `"Unsupported provider: provider is not enabled"`

## Setup Steps

### Part 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Project name: `college101` (or whatever you prefer)
   - Click "Create"
   - Wait for project to be created, then select it

3. **Enable Google+ API** (if needed)
   - In the left sidebar, go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "Google Identity"
   - Click it and click "Enable" if not already enabled

4. **Configure OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**
   - User Type: Select **External**
   - Click "Create"
   
   **Fill in the form:**
   - App name: `college101`
   - User support email: Your email
   - App logo: (optional, skip for now)
   - Application home page: `http://localhost:3000` (for dev) or your production URL
   - Authorized domains: Leave empty for localhost testing
   - Developer contact email: Your email
   - Click "Save and Continue"
   
   **Scopes:**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click "Update"
   - Click "Save and Continue"
   
   **Test users:** (for development)
   - Click "Add Users"
   - Add your email and any test user emails
   - Click "Save and Continue"
   - Click "Back to Dashboard"

5. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   
   **Application type:** Web application
   
   **Name:** `college101-web`
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://bsyfsrfmdjjvdybohtts.supabase.co
   ```
   
   **Authorized redirect URIs:** ⚠️ **CRITICAL - MUST BE EXACT**
   ```
   https://bsyfsrfmdjjvdybohtts.supabase.co/auth/v1/callback
   ```
   
   - Click "Create"
   
6. **Copy Your Credentials**
   - A popup will show your **Client ID** and **Client Secret**
   - **IMPORTANT:** Copy both and save them somewhere safe
   - Client ID looks like: `xxxxx.apps.googleusercontent.com`
   - Client Secret looks like: `GOCSPX-xxxxx`

---

### Part 2: Supabase Configuration

1. **Open Supabase Dashboard**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your `college101` project

2. **Navigate to Auth Providers**
   - Click **Authentication** in the left sidebar
   - Click **Providers** tab

3. **Enable Google Provider**
   - Find **Google** in the list
   - Toggle the switch to **ON** (enabled)

4. **Enter Google Credentials**
   - **Client ID (OAuth):** Paste your Google Client ID
   - **Client Secret (OAuth):** Paste your Google Client Secret
   - Click **Save**

5. **Verify Redirect URL**
   - Supabase shows you the callback URL
   - Make sure it matches what you entered in Google Console:
     ```
     https://bsyfsrfmdjjvdybohtts.supabase.co/auth/v1/callback
     ```

---

## Testing

1. **Restart your dev server** (if running):
   ```bash
   npm run dev
   ```

2. **Test the flow:**
   - Go to `http://localhost:3000`
   - Click "Sign Up" or "Login"
   - Click "Continue with Google"
   - You should see Google's OAuth consent screen
   - Select your Google account
   - Grant permissions
   - You'll be redirected back to your app at `/flow`

3. **Check Supabase:**
   - Go to **Authentication** → **Users** in Supabase dashboard
   - You should see your user with provider: `google`

---

## Troubleshooting

### "Unsupported provider" error
- Google provider not enabled in Supabase
- Go to Supabase → Authentication → Providers → Toggle Google ON

### "Redirect URI mismatch" error
- The redirect URI in Google Console doesn't match Supabase
- Must be exactly: `https://bsyfsrfmdjjvdybohtts.supabase.co/auth/v1/callback`
- No trailing slash
- Must be HTTPS (not HTTP)

### "Access blocked: This app's request is invalid"
- OAuth consent screen not properly configured
- Make sure you added your email as a test user
- Check that scopes are added (email and profile)

### "The redirect URI in the request did not match"
- Check for typos in the redirect URI
- Make sure you're using the correct Supabase project URL
- Clear browser cookies and try again

### Still stuck?
- Double-check that both Client ID and Secret are copied correctly
- Verify no extra spaces when pasting
- Try creating new credentials in Google Console
- Check Supabase logs: Authentication → Logs

---

## Production Setup

When deploying to production (e.g., Vercel):

1. **Update Google Console:**
   - Add your production domain to Authorized JavaScript origins:
     ```
     https://yourdomain.com
     ```
   - Redirect URI stays the same (Supabase URL)

2. **Update OAuth Consent Screen:**
   - Publishing status: Change from "Testing" to "In Production"
   - This requires Google verification if you have >100 users
   - For <100 users, testing mode works fine

3. **No changes needed in Supabase** - same configuration works for dev and prod

---

## Security Notes

- ✅ Client ID and Secret are safe in Supabase (not exposed to browser)
- ✅ OAuth flow handled entirely by Supabase
- ✅ Your app never sees the user's Google password
- ✅ Users can revoke access anytime in their Google account settings
- ⚠️ Never commit Client Secret to git (it's not in your code anyway)

---

## Quick Reference

**Your Supabase Callback URL:**
```
https://bsyfsrfmdjjvdybohtts.supabase.co/auth/v1/callback
```

**Required Google OAuth Scopes:**
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

**Where to find things:**
- Google Console: [console.cloud.google.com](https://console.cloud.google.com)
- Supabase Auth: Dashboard → Authentication → Providers
- OAuth Credentials: Google Console → APIs & Services → Credentials
