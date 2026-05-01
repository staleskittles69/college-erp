# College ERP — Claude Guide

## Who I'm working with
The user is brand new to coding (knows basic HTML/CSS only). They vibe code and learn by reverse engineering the output. Keep explanations short, plain English, and jargon-free. Make decisions for them — don't present 5 options and ask which they prefer.

## What this project is
A college ERP system with three user roles, each with their own portal:

| Role | Portal URL | Status |
|------|-----------|--------|
| Admin | `/admin` | Built ✅ |
| Teacher | `/teachers` | Built ✅ (redesigned with hierarchical student nav) |
| Student | `/students` | Built ✅ (modern blue UI) |

Single login at `/login` → middleware auto-routes each role to their portal.

## Tech stack
- **Next.js 14** (App Router) — the framework
- **React 18** — UI
- **Tailwind CSS** — all styling, utility classes only
- **MongoDB + Mongoose** — database
- **JWT (jose)** — auth via HTTP-only cookie named `token`
- **lucide-react** — icons

## Project phases
- **Phase 1 (complete): UI only** — all pages built as placeholders with mock data
- **Phase 2 (current): Backend** — connecting pages to real MongoDB APIs, feature by feature

> Phase 2 is active. Add real API calls and database connections when working on any feature.

## Folder structure
```
src/
├── app/
│   ├── (auth)/login/       ← login page
│   ├── admin/              ← admin portal
│   │   └── teachers/       ← teacher management (dept → teacher list → detail)
│   ├── teachers/           ← teacher portal (dashboard, attendance, notices, timetable, assignments)
│   │   └── students/       ← hierarchical student nav (branch → year → section)
│   ├── students/           ← student portal (dashboard at root)
│   ├── student/            ← student sub-pages (attendance, grades, timetable, etc.)
│   ├── dashboard/          ← LEGACY — middleware redirects here to role portal; do not use
│   └── api/                ← backend API routes
├── components/
│   ├── admin/              ← admin components + FeaturePanels/ + teachers/
│   ├── teacher/            ← TeacherSidebar, TeacherNavbar
│   ├── sidebar/            ← modern student sidebar
│   ├── navbar/             ← modern student navbar
│   ├── student/            ← student widget components
│   ├── layout/             ← DashboardLayout + Sidebar (legacy, used by /dashboard only)
│   └── ui/                 ← Button, Card, Input, Table
├── contexts/               ← React context providers (teacher state, etc.)
├── lib/                    ← auth.ts, db.ts, api-auth.ts, utils.ts, teachersData.ts
├── models/                 ← Mongoose schemas (User, Student, Attendance, etc.)
└── middleware.ts           ← JWT auth + role-based routing
```

## Key rules
- **No unsolicited edits** — only change code when explicitly asked
- **Tailwind only** — no inline styles, no CSS modules, no new CSS files
- **No new packages** — lucide-react for icons, everything else already installed
- **Keep components isolated** — admin, student, and teacher code must not mix
- **Don't touch** `src/app/dashboard/` — legacy routes kept for redirect fallback only

## Auth flow
1. User logs in → `/api/auth/login` sets JWT cookie
2. Client redirects to `/dashboard`
3. `middleware.ts` reads cookie → redirects to role's portal
4. Logout: POST to `/api/auth/logout` → clears cookie → redirect to `/login`

## Design system
- **Admin portal**: dark slate sidebar (`bg-slate-900`), indigo accents (`indigo-600`)
- **Teacher portal**: dark slate sidebar (`bg-slate-800`), teal/slate accents
- **Student portal**: white sidebar, blue accents (`blue-600`), supports dark mode
- **Spacing**: `p-6` for page padding, `gap-4` or `gap-6` for grids
- **Cards**: `rounded-xl border border-gray-200 bg-white`
- **Placeholder empty states**: `rounded-xl border border-dashed border-gray-300`
