# Deployment Guide - Chess Course Platform

## 🚀 Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy from current directory**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No**
   - Project name: **chess-course-platform** (or your preferred name)
   - Directory: **./** (current directory)
   - Override settings? **No**

4. **Add Environment Variables**
   After deployment, add your Supabase credentials in Vercel dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

5. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Chess Course Platform"
   git branch -M main
   git remote add origin https://github.com/yourusername/chess-course-platform.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables
   - Deploy

## 🗄️ Database Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Note your project URL and anon key

### 2. Run Database Schema
- Go to SQL Editor in Supabase dashboard
- Copy and paste contents of `database-schema.sql`
- Execute the script

### 3. Update Environment Variables
Add your Supabase credentials to Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔧 Post-Deployment

### 1. Test the Application
- Visit your deployed URL
- Test signup/login flow
- Verify database connectivity

### 2. Custom Domain (Optional)
- Go to Vercel project settings
- Add your custom domain
- Configure DNS records

### 3. Monitor Performance
- Check Vercel analytics
- Monitor Supabase usage
- Set up error tracking

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check environment variables are set
   - Verify Supabase URL format
   - Check build logs in Vercel dashboard

2. **Database Connection Issues**
   - Verify Supabase project is active
   - Check RLS policies are enabled
   - Confirm anon key is correct

3. **Authentication Issues**
   - Check Supabase Auth settings
   - Verify redirect URLs
   - Test magic link configuration

## 📊 Performance Optimization

- Enable Vercel Analytics
- Configure Supabase connection pooling
- Optimize images and assets
- Set up CDN caching

## 🔒 Security Checklist

- [ ] Environment variables are secure
- [ ] RLS policies are enabled
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Authentication flows are tested

## 📈 Monitoring

- Set up Vercel monitoring
- Configure Supabase alerts
- Monitor user analytics
- Track error rates

Your Chess Course Platform should now be live and ready for students! 🎓♟️