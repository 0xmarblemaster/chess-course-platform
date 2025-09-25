# Database Setup Instructions

## Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Update Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Update the following variables with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Database Schema**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `database-schema.sql`
   - Execute the SQL script

4. **Verify Setup**
   - Check that all tables are created: `users`, `levels`, `lessons`, `progress`, `badges`
   - Verify that sample data is inserted
   - Test that Row Level Security policies are active

## Database Schema Overview

### Tables Created:
- **users**: User profiles (extends Supabase auth)
- **levels**: Course levels (3 levels with PDFs)
- **lessons**: Individual lessons with video/Lichess content
- **progress**: Student completion tracking
- **badges**: Achievement system

### Key Features:
- Row Level Security (RLS) enabled
- Automatic user profile creation on signup
- Automatic badge awarding on level completion
- Sample data for 3 levels with 5 lessons each

### Security:
- Users can only access their own progress and badges
- Levels and lessons are publicly readable
- All operations require authentication