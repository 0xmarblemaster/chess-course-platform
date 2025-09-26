# Vercel Environment Variables Setup

## Issue
The Vercel deployment is showing "Failed to fetch" because the Supabase environment variables are not configured in Vercel.

## Solution
You need to add the environment variables to your Vercel project settings.

## Steps to Fix:

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Find your project: `chess-course-9m6w2tlxj-artdrive`

### 2. Add Environment Variables
- Click on your project
- Go to **Settings** tab
- Click on **Environment Variables** in the left sidebar
- Add these two variables:

#### Variable 1:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://vqrilwkbkfslriwlsowu.supabase.co`
- **Environment:** Production, Preview, Development (select all)

#### Variable 2:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcmlsd2tia2ZzbHJpd2xzb3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NTA4ODUsImV4cCI6MjA3MzQyNjg4NX0.Am4ZsggfFqJ7VdFWUoUXAmFIvt_j4l46_f-6X1Xu6Z0`
- **Environment:** Production, Preview, Development (select all)

### 3. Redeploy
- After adding the environment variables, click **Redeploy** on your latest deployment
- Or push a new commit to trigger a new deployment

## Alternative: Use Vercel CLI
If you have Vercel CLI installed, you can also run:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter: https://vqrilwkbkfslriwlsowu.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcmlsd2tia2ZzbHJpd2xzb3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NTA4ODUsImV4cCI6MjA3MzQyNjg4NX0.Am4ZsggfFqJ7VdFWUoUXAmFIvt_j4l46_f-6X1Xu6Z0

vercel --prod
```

## Verification
After redeploying, the login page should work without "Failed to fetch" errors.