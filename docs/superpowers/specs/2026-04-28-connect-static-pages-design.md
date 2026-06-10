# Connect Static Pages to Real APIs — Design Spec
Date: 2026-04-28

## Goal
Replace every hardcoded/placeholder page with live data fetched from existing MongoDB-backed API routes. Skip attendance entirely (Attendance model excluded from scope).

---

## Pages in Scope

### 1. Admin Branches (`/admin/branches`)
**Problem:** `DEFAULT_BRANCHES` is a hardcoded JS array. The "Add Branch" modal only updates React state — data is lost on refresh.

**Fix:**
- On mount, `GET /api/departments` → replace hardcoded list with DB data
- "Add Branch" button calls the existing `DepartmentFormModal` (already simplified to single name field) → on save, `POST /api/departments` → refetch list
- Show a loading skeleton while fetching
- Show an empty state if no departments in DB yet

**Data shape expected from API:**
```ts
{ _id, name, slug, label, color }[]
```

**Card rendering:** Use `slug` as the URL segment (links to `/admin/[branch]`). Color from the `color` field (cycle through COLORS array by index if needed).

---

### 2. Teacher Timetable (`/teachers/timetable`)
**Problem:** Placeholder empty state. The `/api/timetable` route exists.

**Fix:**
- On mount, `GET /api/timetable` (server reads teacher identity from JWT cookie)
- If no timetable assigned → show existing empty state ("No timetable assigned")
- If data exists → render a day-by-day grid (Mon–Sat rows, period columns)

**Data shape expected from API:**
```ts
{ day: string, period: number, subject: string, section: string, time: string }[]
```

---

### 3. Teacher Assignments (`/teachers/assignments`)
**Problem:** Placeholder empty state. The `/api/tests` route exists.

**Fix:**
- On mount, `GET /api/tests` (server reads teacher from JWT)
- If no tests → show existing empty state ("No assignments yet")
- If data exists → render a list of cards showing: title, subject, due date, section

**Data shape expected from API:**
```ts
{ _id, title, subject, dueDate, section, totalMarks }[]
```

---

### 4. Student Grades (`/student/grades`)
**Problem:** Page already fetches `/api/student/marks` — but the API or data may be returning empty. No code changes needed on the frontend; verify the API endpoint works correctly and returns data for seeded students.

**Fix:** Audit the `/api/student/marks` route to confirm it reads from the JWT cookie, queries the Marks model by studentId, and returns the right shape. Fix any bugs found there. No frontend changes.

---

## Dead Code to Delete

| Path | Reason |
|------|--------|
| `src/app/admin/student/[rollNumber]/page.tsx` | Orphaned route, zero references, replaced by `[studentId]` route |
| `src/app/api/debug-users/route.ts` | Debug-only route, should not ship |
| `src/app/api/setup-initial-data/route.ts` | One-time seed route, should not ship |

---

## Out of Scope
- **Teacher Attendance** — skipped entirely, Attendance model excluded
- **Student Attendance** — skipped, uses Attendance model
- **Admin Audit Logs** — no logging infrastructure exists; leave as empty state
- **Admin Feature panels** (announcements, marks, timetable, students, settings) — placeholder shells, not in this sprint

---

## Error Handling Pattern
All pages follow the same pattern:
1. `loading` state → show a skeleton or spinner
2. `error` state → show a generic "Could not load data" message
3. Empty data → show existing dashed-border empty state UI

No new packages. No inline styles. Tailwind only.
