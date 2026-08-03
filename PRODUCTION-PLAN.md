# Production Readiness Plan
_Last updated: 2026-06-10_

---

## Verdict

The foundation is solid — auth works, DB is connected on Atlas, portal structure is right.
The gap between "looks done" and "is done" is almost entirely **wiring existing APIs to pages
that still show hardcoded data**. That's mechanical work, not architecture work.
2 weeks is realistic.

---

## Blockers by Severity

### 🔴 Critical Security (fix before real users touch this)

- [ ] **Weak JWT secret** — `manish1234supersecretlongstringforjwt` is guessable. Replace with a random 64-char string before deployment.
- [ ] **`.env.local` not in `.gitignore`** — if this file gets committed, MongoDB credentials and JWT secret are exposed publicly.
- [ ] **`/api/admin/seed-logins` is dangerous** — any logged-in user can overwrite all passwords. Delete or lock it behind a secret header before real users exist.
- [ ] **Middleware fallback secret** — `"fallback-secret-change-in-production"` in `middleware.ts` means tokens become forgeable if `JWT_SECRET` is ever missing from env.
- [ ] **No login rate limiting** — `/api/auth/login` accepts unlimited attempts. Anyone can brute-force passwords.

### 🟡 Hardcoded Data Pretending to Be Real

**Audit result (2026-06-10): Nearly everything was already wired. The only remaining items were on the admin dashboard.**

| Page | Status | Notes |
|------|--------|-------|
| Admin dashboard stats | ✅ Fixed | Fetches from `/api/admin/stats` |
| Admin dashboard welcome name | ✅ Fixed | Now fetches real name from `/api/auth/me` |
| Admin dashboard "Tests Scheduled" | ✅ Fixed | Now fetches count from `/api/tests` |
| Admin navbar user info | ✅ Already done | Fetches from `/api/auth/me` |
| Admin student detail | ✅ Already done | Fetches from `/api/students/[id]` |
| Admin branches page | ✅ Already done | Fetches from `/api/departments` |
| Teacher dashboard stats | ✅ Already done | Fetches from `/api/teachers/me/stats` |
| Teacher attendance | ✅ Already done | Fetches real students + submits to `/api/attendance` |
| Teacher timetable | ✅ Already done | Fetches from `/api/timetable` |
| Teacher assignments | ✅ Already done | Fetches from `/api/tests`, create works |
| Teacher notices | ✅ Already done | Fetches from `/api/notices`, create works |
| Student attendance | ✅ Already done | Fetches from `/api/attendance` |
| Student grades | ✅ Already done | Fetches from `/api/student/marks` |

### 🔵 Placeholder Pages (UI shell, zero functionality)

- `/admin/features/announcements`
- `/admin/features/attendance`
- `/admin/features/marks`
- `/admin/features/students`
- `/admin/features/timetable`
- `/admin/settings`
- `/admin/audit-logs` (shows fake log entries — no real logging exists)

### ⚠️ Works But Incomplete

- **Admin branches page** — can create a department but list is still hardcoded
- **Admin navbar search** — wired to real API but result navigates to hardcoded student detail page
- **Teacher timetable save** — modal opens but saving may not persist correctly to DB
- **Section page footer** — shows total enrolled count even when search is active (should show filtered count)

### 🗑️ Dead Code to Delete

_Re-audited 2026-08-03: `/api/setup-initial-data` and `/api/debug-users` are already gone.
`/api/admin/seed-logins` is not dead code — it's admin-gated (`requireAdmin`) and is the live
"create logins for section" action on `/admin/branches`. Left in place._

- `/admin/student/[rollNumber]` — also already removed, confirmed gone.

---

## 2-Week Action Plan

### Week 1 — Wire Real Data

| Day | Task | Files to touch |
|-----|------|----------------|
| 1 | Admin dashboard stats → real API | `src/app/admin/page.tsx` |
| 1 | Admin navbar real user info | `src/components/admin/AdminSidebar.tsx` (or navbar) |
| 2 | Admin student detail page → real fetch | `src/app/admin/[branch]/[year]/[section]/[studentId]/page.tsx` |
| 2 | Branches page → read from `/api/departments` | `src/app/admin/branches/page.tsx` |
| 3 | Teacher dashboard → real stats | `src/app/teachers/page.tsx` (or dashboard) |
| 3 | Teacher attendance → real student list + submit | `src/app/teachers/attendance/page.tsx` |
| 4 | Teacher notices → `/api/notices` (read + create) | `src/app/teachers/notices/page.tsx` |
| 4 | Student attendance → real percentages + records | `src/app/student/attendance/page.tsx` |
| 5 | Student grades → `/api/student/marks` | `src/app/student/grades/page.tsx` |
| 5 | Teacher assignments → `/api/tests` | `src/app/teachers/assignments/page.tsx` |

### Week 2 — Security, Cleanup, Deploy

| Day | Task |
|-----|------|
| 6 | Teacher timetable → `/api/timetable`. Fix save bug in admin teacher detail modal. |
| 7 | Add `.env.local` to `.gitignore`. Rotate JWT secret to a real random string. |
| 8 | Add login rate limiting (track attempts per IP or email in DB). |
| 8 | Delete dead routes: old `[rollNumber]` page, seed/debug endpoints. |
| 9 | Decide on Admin feature panels: build a basic working version or hide from sidebar nav entirely. |
| 9 | Fix section page footer count to reflect active search filter. |
| 10 | Deploy to Vercel. Set all env vars in Vercel dashboard (never commit `.env.local`). |
| 10 | End-to-end test all 3 portals: login → use features → logout, for each role. |

---

## Intentionally Skipped for v1

These are real features but none block a working first version:

- Password reset / forgot password flow
- Email notifications
- Real audit logging
- File uploads (`/api/upload` exists but unused)
- Admin feature panels (announcements, timetable, marks overview) — hide from nav if not built

---

## Deploy Checklist (Day 10)

- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] `JWT_SECRET` is a random 64-char string (not the current one)
- [ ] `NODE_ENV=production` in Vercel env vars
- [x] Debug/setup API routes deleted (`seed-logins`/`seed-departments` are legitimate, admin-gated features — kept)
- [ ] `MONGODB_URI` points to Atlas (already does — just verify in Vercel)
- [ ] Cookie `secure: true` is working (it reads from `NODE_ENV` already — just needs prod env set)
- [ ] Test login for all 3 roles on the deployed URL
- [ ] Confirm middleware correctly blocks cross-role access
