# Update Supabase Redirect URLs

## Current Issue
Magic links are redirecting to old deployment URLs because Supabase auth configuration is outdated.

## Solution
Update Supabase authentication settings to use the latest deployment URLs.

## Steps to Fix:

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `vqrilwkbkfslriwlsowu`

### 2. Update Authentication Settings
- Go to **Authentication** → **URL Configuration**
- In the **Site URL** field, enter: `https://chess-course-artdrive.vercel.app`
- In the **Redirect URLs** field, add these URLs (one per line):
  ```
  https://chess-course-artdrive.vercel.app/auth/callback
  https://chess-course-artdrive.vercel.app/dashboard
  https://chess-course-artdrive.vercel.app/login
  https://chess-course-m1w67d72d-artdrive.vercel.app/auth/callback
  https://chess-course-m1w67d72d-artdrive.vercel.app/dashboard
  https://chess-course-m1w67d72d-artdrive.vercel.app/login
  http://localhost:3000/auth/callback
  http://localhost:3000/dashboard
  http://localhost:3000/login
  ```

### 3. Save Changes
- Click **Save** to apply the changes

## Current Deployment URLs:
- **Main alias**: `https://chess-course-artdrive.vercel.app`
- **Latest deployment**: `https://chess-course-m1w67d72d-artdrive.vercel.app`
- **Local development**: `http://localhost:3000`

## Verification
After updating the redirect URLs:
1. Try signing up with a new email
2. Check your email for the magic link
3. Click the magic link - it should redirect properly to the dashboard
4. The user should be created in both `auth.users` and `public.users` tables

## Common Issues:
- **Wrong redirect URL**: Make sure the URL in Supabase matches your Vercel deployment URL exactly
- **Missing callback route**: Ensure `/auth/callback` route exists (it does in our app)
- **CORS issues**: The redirect URLs need to be explicitly allowed in Supabase
- **Old deployment URLs**: Always use the latest deployment URL or the main alias