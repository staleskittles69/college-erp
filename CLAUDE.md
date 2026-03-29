# College ERP — Claude Guide

## Who I'm working with
The user is brand new to coding (knows basic HTML/CSS only). They vibe code and learn by reverse engineering the output. Keep explanations short, plain English, and jargon-free. Make decisions for them — don't present 5 options and ask which they prefer.

## What this project is
A college ERP system with three user roles, each with their own portal:

| Role | Portal URL | Status |
|------|-----------|--------|
| Admin | `/admin` | Built ✅ |
| Teacher | `/dashboard/admin` | Old UI — needs redesign |
| Student | `/student/dashboard` | Built ✅ (modern blue UI) |

Single login at `/login` → middleware auto-routes each role to their portal.

## Tech stack
- **Next.js 14** (App Router) — the framework
- **React 18** — UI
- **Tailwind CSS** — all styling, utility classes only
- **MongoDB + Mongoose** — database
- **JWT (jose)** — auth via HTTP-only cookie named `token`
- **lucide-react** — icons

## Project phases
- **Phase 1 (current): UI only** — build all pages as placeholders, no real data, no API calls
- **Phase 2 (not started): Backend** — connect APIs to real MongoDB data, sync everything

> Do NOT add API calls, database queries, or real data to any page until the user explicitly says Phase 2 has started.

## Folder structure
```
src/
├── app/
│   ├── (auth)/login/       ← login page
│   ├── admin/              ← admin portal (new)
│   ├── student/            ← student portal (new modern UI)
│   ├── dashboard/
│   │   ├── admin/          ← teacher portal (old UI, needs redesign)
│   │   ├── student/        ← OLD student portal (replaced, ignore)
│   │   └── teacher/        ← unused
│   └── api/                ← backend API routes
├── components/
│   ├── admin/              ← admin components + FeaturePanels/
│   ├── sidebar/            ← modern student sidebar
│   ├── navbar/             ← modern student navbar
│   ├── student/            ← student widget components
│   ├── layout/             ← DashboardLayout (old), Sidebar (old)
│   └── ui/                 ← Button, Card, Input, Table
├── lib/                    ← auth.ts, db.ts, api-auth.ts, utils.ts
├── models/                 ← Mongoose schemas (User, Student, Attendance, etc.)
└── middleware.ts           ← JWT auth + role-based routing
```

## Key rules
- **No unsolicited edits** — only change code when explicitly asked
- **Tailwind only** — no inline styles, no CSS modules, no new CSS files
- **No new packages** — lucide-react for icons, everything else already installed
- **Keep components isolated** — admin, student, and teacher code must not mix
- **Don't touch** `src/app/dashboard/student/` — replaced by `/student/`, leave it alone

## Auth flow
1. User logs in → `/api/auth/login` sets JWT cookie
2. Client redirects to `/dashboard`
3. `middleware.ts` reads cookie → redirects to role's portal
4. Logout: POST to `/api/auth/logout` → clears cookie → redirect to `/login`

## Design system
- **Admin portal**: dark slate sidebar (`bg-slate-900`), indigo accents (`indigo-600`)
- **Student portal**: white sidebar, blue accents (`blue-600`), supports dark mode
- **Spacing**: `p-6` for page padding, `gap-4` or `gap-6` for grids
- **Cards**: `rounded-xl border border-gray-200 bg-white`
- **Placeholder empty states**: `rounded-xl border border-dashed border-gray-300`
