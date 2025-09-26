# Supabase Redirect URL Configuration

## Issue
The signup process fails after clicking the email link because the redirect URL in Supabase doesn't match the Vercel deployment URL.

## Solution
You need to update the redirect URLs in your Supabase project settings.

## Steps to Fix:

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `vqrilwkbkfslriwlsowu`

### 2. Update Authentication Settings
- Go to **Authentication** → **URL Configuration**
- In the **Site URL** field, enter: `https://chess-course-9m6w2tlxj-artdrive.vercel.app`
- In the **Redirect URLs** field, add these URLs (one per line):
  ```
  https://chess-course-9m6w2tlxj-artdrive.vercel.app/auth/callback
  https://chess-course-9m6w2tlxj-artdrive.vercel.app/dashboard
  https://chess-course-9m6w2tlxj-artdrive.vercel.app/login
  http://localhost:3000/auth/callback
  http://localhost:3000/dashboard
  http://localhost:3000/login
  ```

### 3. Save Changes
- Click **Save** to apply the changes

## Alternative: Update via SQL
You can also update these settings via SQL in the Supabase SQL Editor:

```sql
-- Update the site URL
UPDATE auth.config 
SET site_url = 'https://chess-course-9m6w2tlxj-artdrive.vercel.app'
WHERE id = 1;

-- Add redirect URLs (this might need to be done through the dashboard)
```

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