`# Fix-First List
Things that are broken, faked, or half-built. Fix these before adding anything new.

---

## 🔴 Broken (will crash or do nothing)

- **`/admin/student/[rollNumber]`** — old route the navbar used to navigate to. Now the navbar
  navigates to the correct `[studentId]` URL, but this old page still exists and is never reached.
  Either wire it up or delete it.

- **Teacher section student list** (`/teachers/students/[branch]/[year]/[section]`) — unknown
  if it fetches from the real API or uses mock data like the admin version did before the fix.

---

## 🟡 Hardcoded data pretending to be real

- **Admin navbar** — profile shows "Admin" / "admin@college.edu" hardcoded. Should read the
  logged-in user's real name and email from `/api/auth/me`.

- **Admin dashboard** (`/admin`) — stats cards (total students, teachers, etc.) are hardcoded
  numbers, not pulled from the database.

- **Admin audit logs** (`/admin/audit-logs`) — shows fake log entries, no real logging exists.

- **Student detail page** (`/admin/[branch]/[year]/[section]/[studentId]`) — shows hardcoded
  student info or placeholder fields. Needs to fetch from `/api/students/[id]`.

- **Teacher dashboard** (`/teachers`) — reverted to static mock stats. No real data shown.

- **Teacher timetable** (`/teachers/timetable`) — hardcoded timetable grid.

- **Teacher assignments** (`/teachers/assignments`) — hardcoded assignment list.

- **Teacher attendance** (`/teachers/attendance`) — hardcoded student list and attendance state.

- **Teacher notices** (`/teachers/notices`) — hardcoded notice list, not connected to
  `/api/notices`.

- **Student attendance** (`/student/attendance`) — hardcoded attendance percentages and records.

- **Student grades** (`/student/grades`) — hardcoded marks, not from `/api/student/marks`.

---

## 🔵 Placeholder pages (UI shell with no functionality)

- **Admin Features → Announcements** (`/admin/features/announcements`) — FeaturePanel shell only.
- **Admin Features → Attendance** (`/admin/features/attendance`) — FeaturePanel shell only.
- **Admin Features → Marks** (`/admin/features/marks`) — FeaturePanel shell only.
- **Admin Features → Students** (`/admin/features/students`) — FeaturePanel shell only.
- **Admin Features → Timetable** (`/admin/features/timetable`) — FeaturePanel shell only.
- **Admin Settings** (`/admin/settings`) — placeholder page, no real settings.

---

## ⚠️ Works but incomplete

- **Add Department modal** (`/admin/branches`) — can create a department but the branches page
  still shows a hardcoded list instead of reading from the departments API.

- **Teacher timetable modal** (admin teacher detail) — modal opens but saving the timetable
  may not persist correctly to the database.

- **Admin navbar search** — just fixed to use the real API, but clicking a result navigates to
  the student detail page which is still hardcoded (see above).

- **Section page search bar** — just added, works, but the footer still shows total enrolled
  count even when search is active (should show filtered count vs total).

---

## 🗑️ Dead code to clean up

- **`/app/dashboard/`** — legacy redirect folder, kept alive only for middleware fallback.
  Nothing inside should be touched but it's wasted space.

- **`/api/debug-users`** — debug route, should be removed before going live.

- **`/api/setup-initial-data`** — one-time seed route, should be removed or protected.
