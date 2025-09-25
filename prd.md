# Product Requirements Document (PRD)
**Project:** Online Chess Course Platform  
**Tech Stack:** Vercel + Next.js + Tailwind + Supabase + YouTube embeds + Lichess embeds

---

## 1. Vision & Goals
Deliver a gamified online chess course where users progress through Levels with video lessons and Lichess challenges.

**Objectives:**
- Track user progress per lesson and Level.
- Unlock Levels sequentially (Level N+1 locked until Level N complete).
- Provide dynamic visual feedback (progress bars + badges).
- Make course content downloadable (PDF per Level).
- **Mobile-first design:** all pages, components, and interactions must look modern and function flawlessly on phones, tablets, and desktops.

---

## 2. User Roles
- **Student:** accesses courses, watches lessons, completes challenges.
- **Admin:** manages lessons, Levels, PDFs, badges, monitors progress.

---

## 3. Student-Facing Pages

| Page | Path | Description / Features |
|------|------|------------------------|
| Home / Landing | `/` | Course overview, Levels summary, login/signup CTA, progress teaser |
| Login | `/login` | Supabase Auth (magic link + email/password) |
| Signup | `/signup` | Optional signup page |
| Dashboard | `/dashboard` | Global progress, list of Levels, earned badges, link to next available lesson |
| Level Page | `/levels/[levelId]` | Shows lessons in the Level, Level progress bar, PDF download, locked/unlocked status |
| Lesson Page | `/lessons/[lessonId]` | Embedded YouTube video, Lichess iframe, “Mark Complete” button, lesson progress update |

---

## 4. Admin Pages

| Page | Path | Description / Features |
|------|------|------------------------|
| Admin Dashboard | `/admin` | Overview of Levels, lessons, PDFs, badges, student progress |
| Manage Levels & Lessons | `/admin/manage` | Add/edit/delete Levels, lessons, PDFs, badge graphics |
| Optional Admin Stats | `/admin/stats` | Analytics and progress monitoring (can be included in MVP) |

---

## 5. Functional Requirements

### 5.1 Authentication & Access
- Supabase Auth: email/password + magic link
- Auth state persists
- User record created at signup

### 5.2 Course & Lesson Management
- 3 Levels at MVP launch, each 30–40 lessons
- Lessons include:
  - Embedded YouTube video
  - Embedded Lichess challenge iframe
  - “Mark as Complete” button
- Level unlock = all lessons in prior Level complete
- Admin dashboard: add/edit/delete lessons and PDFs

### 5.3 Progress Tracking & Visualization
- Lesson-level: `video_watched` + `test_passed`
- Level-level: progress bar (% lessons complete)
- Global progress: overall % complete
- Badges: graphical badge on Level completion

### 5.4 UI/UX Requirements
- **Mobile-first, responsive design** for all devices (phones, tablets, desktops)
- **Student Dashboard:** global progress bar, Levels list, badges
- **Level Page:** lesson list, Level progress bar, PDF download button
- **Lesson Page:** video + Lichess embed, Mark Complete button

### 5.5 Admin Dashboard
- Manage Levels, lessons, PDFs, badges
- Monitor student progress
- Mobile-friendly design optional for admin view

---

## 6. Database Schema (Supabase)

**users**
- id (UUID, PK)
- email (string)
- created_at (timestamp)

**levels**
- id (int, PK)
- title (string)
- description (text)
- order (int)
- pdf_url (string)

**lessons**
- id (int, PK)
- level_id (FK)
- title (string)
- video_url (string)
- lichess_embed_url (string)
- order (int)

**progress**
- id (UUID, PK)
- user_id (FK)
- lesson_id (FK)
- video_watched (boolean)
- test_passed (boolean)
- completed_at (timestamp)

**badges**
- id (UUID, PK)
- user_id (FK)
- level_id (FK)
- badge_url (string)
- earned_at (timestamp)

---

## 7. Non-Functional Requirements
- **Mobile-first and responsive:** UI must adjust gracefully to all screen sizes, modern look
- Scalability: 50k+ users on Supabase free tier
- Performance: load <2s
- Security: Supabase Auth + RLS policies

---

## 8. Milestones
1. **MVP:** mobile-first dashboard, Level + lesson pages, video + Lichess embeds, manual completion, progress bars, PDFs, badges

---

## 9. Success Metrics
- Lessons track progress correctly
- Progress bars update dynamically
- Badges appear correctly
- Sequential Level unlocking works
- **UI looks great and functions correctly on mobile devices**
