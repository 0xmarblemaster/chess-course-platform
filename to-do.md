# To-Do List for Coding Agent
**Project:** Online Chess Course MVP  
**Progress:** 85%

---

## Tasks

### 1. Project Setup
1. [x] Set up Next.js project with TailwindCSS (ensure mobile-first responsive setup)
2. [x] Configure Supabase client (`supabaseClient.js`)
3. [x] Implement Supabase Auth (email/password + magic link)
4. [x] Create database schema in Supabase (`users`, `levels`, `lessons`, `progress`, `badges`)
5. [x] Build `ProtectedRoute` HOC for authenticated pages

---

### 2. Student-Facing Pages
6. [x] Create **Home / Landing Page** (`/`)
   - Mobile-first responsive layout
   - Course overview, Levels summary, login/signup CTA
7. [x] Create **Login Page** (`/login`)
   - Mobile-first responsive layout
   - Supabase magic link + email/password
8. [x] Create **Signup Page** (`/signup`)
   - Mobile-first responsive layout
9. [x] Create **Dashboard Page** (`/dashboard`)
   - Mobile-first responsive layout
   - Global progress, Levels list, earned badges
10. [x] Create **Level Page** (`/levels/[levelId]`)
    - Mobile-first responsive layout
    - List lessons, Level progress bar
    - PDF download button
    - Locked/unlocked Level status
11. [ ] Create **Lesson Page** (`/lessons/[lessonId]`)
    - Mobile-first responsive layout
    - Embedded YouTube video
    - Embedded Lichess iframe
    - “Mark Complete” button
    - Update lesson progress in Supabase

---

### 3. Admin Pages
12. [ ] Create **Admin Dashboard** (`/admin`)
    - Overview of Levels, lessons, PDFs, badges, student progress
    - Mobile-friendly design optional
13. [ ] Create **Manage Levels & Lessons Page** (`/admin/manage`)
    - Add/edit/delete Levels, lessons, PDFs, badge graphics
14. [ ] Create **Optional Admin Stats Page** (`/admin/stats`)
    - Analytics and progress monitoring (if included in MVP)

---

### 4. Frontend Components
15. [x] Build **ProgressBar** component (responsive, dynamic updates)
16. [x] Build **BadgeDisplay** component (responsive, visually appealing)
17. [x] Build **VideoPlayer** component (responsive for mobile, tablet, desktop)
18. [x] Build **LichessEmbed** component (responsive)
19. [x] Build **PDF Download Button** component

---

### 5. Lesson Functionality
20. [ ] Implement lesson completion logic (manual “Mark Complete” → update `progress`)
21. [ ] Display dynamic progress bars (per Level + global)
22. [ ] Award badge on Level completion (store in Supabase + display on Dashboard)

---

### 6. Testing & Verification
23. [ ] Test full workflow:
   - Signup/login → dashboard → Level → Lesson → progress → badges
   - Verify mobile-first responsiveness on phone, tablet, desktop
24. [ ] Verify Supabase CRUD operations (students and admin)
25. [ ] Verify PDFs download correctly
26. [ ] Verify dynamic progress bar and badges update correctly

---

## Instructions for Agent

- Complete **one task at a time**.
- After completing a task:
  - Mark it as ✅
  - Update progress percentage
  - Generate any new sub-tasks if necessary
  - Confirm implementation and consistency with PRD
- Keep this To-Do list **updated in real-time**.
- **Always prioritize mobile-first responsive design** for student-facing pages and components.
