# Chess Empire Platform

A gamified online chess learning platform built with Next.js, TailwindCSS, and Supabase. Students progress through structured levels with video lessons and interactive Lichess challenges.

## 🚀 Features

- **Sequential Learning**: 3 levels with 30+ lessons each
- **Progress Tracking**: Video watched + test passed for each lesson
- **Gamification**: Progress bars, badges, and level unlocking
- **Interactive Content**: YouTube videos + Lichess embeds
- **Mobile-First Design**: Responsive across all devices
- **Authentication**: Supabase Auth with email/password and magic links
- **Downloadable Content**: PDF downloads for each level

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS v4
- **Backend**: Supabase (Auth + Database)
- **Deployment**: Vercel
- **Content**: YouTube embeds + Lichess iframes

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd chess-course
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `database-schema.sql`
4. Execute the SQL script

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication callbacks
│   ├── dashboard/         # Student dashboard
│   ├── levels/            # Level pages
│   ├── lessons/           # Lesson pages
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/            # Reusable UI components
│   ├── BadgeDisplay.tsx
│   ├── LichessEmbed.tsx
│   ├── PDFDownloadButton.tsx
│   ├── ProgressBar.tsx
│   ├── ProtectedRoute.tsx
│   └── VideoPlayer.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx
└── lib/                   # Utility functions
    ├── data.ts           # Data fetching functions
    ├── progress.ts       # Progress tracking functions
    └── supabaseClient.ts # Supabase configuration
```

## 🎯 User Flow

1. **Landing Page**: Course overview and signup/login
2. **Authentication**: Email/password or magic link
3. **Dashboard**: Global progress, levels list, earned badges
4. **Level Page**: Lessons list, level progress, PDF download
5. **Lesson Page**: Video + Lichess embed, mark complete

## 🗄️ Database Schema

- **users**: User profiles (extends Supabase auth)
- **levels**: Course levels (3 levels with PDFs)
- **lessons**: Individual lessons with video/Lichess content
- **progress**: Student completion tracking
- **badges**: Achievement system

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📱 Mobile-First Design

All pages and components are built with mobile-first responsive design:
- Touch-friendly interfaces
- Optimized for small screens
- Progressive enhancement for larger screens
- Accessible navigation

## 🔐 Authentication

- Supabase Auth integration
- Email/password authentication
- Magic link authentication
- Protected routes with HOC
- Automatic user profile creation

## 🎮 Gamification Features

- **Progress Bars**: Visual progress tracking
- **Badges**: Achievement system for level completion
- **Level Unlocking**: Sequential progression
- **Completion Tracking**: Video watched + test passed

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📚 Content Management

### Adding New Levels

1. Insert into `levels` table in Supabase
2. Add lessons to `lessons` table
3. Upload PDF to your storage solution
4. Update `pdf_url` in the level record

### Adding New Lessons

1. Insert into `lessons` table with:
   - `level_id`: Reference to parent level
   - `title`: Lesson title
   - `video_url`: YouTube video URL
   - `lichess_embed_url`: Lichess challenge URL
   - `order_index`: Display order

## 🧪 Testing

The platform includes:
- Authentication flow testing
- Progress tracking verification
- Mobile responsiveness testing
- Cross-browser compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the database schema
- Test with sample data
- Verify environment variables

## 🎯 Roadmap

- [ ] Admin dashboard for content management
- [ ] Advanced analytics and reporting
- [ ] Social features and leaderboards
- [ ] Offline mode support
- [ ] Mobile app development