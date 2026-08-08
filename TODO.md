# Student Portal — TODO

## Web app — features still to finish
_(jot down anything you think is missing or half-done, per portal)_

### Admin
- At-risk students page: two tables (Low Attendance, Low CGPA), thresholds configurable by admin, filterable by branch/year/section. Pure code (aggregation over Attendance + Marks), no AI needed.
- Notices: add `audience` field (students/teachers/both) so admin announcements can also reach teachers, not just students.
- Messages panel: view + mark-as-read for messages sent in by teachers (see Teacher section below).

### Teacher
- "Message Admin" form + sent-message history (new `TeacherMessage` model: sender, body, read/unread) — pairs with the admin Messages panel above.

### Student
-

## Found while working — needs a dedicated look
- **Branches are hardcoded** (`src/lib/academics.ts` → `BRANCHES = ["CSE","ECE","ME","CE","EEE"]`). Should come from the database instead so admin can manage them.
- ~~"Add student" is broken/duplicated~~ — **fixed**: `/api/students` POST now sets `rollNumber`/`branch`/`year` on the User properly (auto-generated, scoped per branch+year) and hashes the password. Deleted the unused duplicate `/api/admin/create-student` route. Also swapped the form's own hardcoded branch list (`MECH/CIVIL/IT`, which didn't match branches used anywhere else) for the shared one.

## Architecture idea (pending decision) — convert to Server Components
Every single page in the app (`src/app/**/page.tsx`, 30 files) is a client component (`"use client"`) that fetches its own data via `useEffect` + `fetch("/api/...")` after the page loads — see `src/app/student/grades/page.tsx` for the pattern. Next.js 14 App Router supports Server Components, which query the database directly during server-side rendering and send the browser fully-built HTML instead.

- **Why consider it**: no loading-skeleton flash on first load, less JS shipped to the browser per page, one fewer network round trip for the initial read of every page.
- **Why it's a real lift, not a toggle**: any page with actual interactivity (forms, buttons, edit modals — most admin/teacher pages) still needs a client component for those interactive parts. Realistic end state is a server component wrapper doing the initial data fetch, with a smaller client component nested inside for just the interactive bits — not a blanket find/replace.
- **Scope if greenlit**: all 30 pages, one at a time; API routes stay (still needed for writes/mutations and any client-side interactivity), but most GET-on-page-load fetches would move into the server component itself.
- **Status**: not started — pending decision on whether to pitch/prioritize this.

## Up next: Android app
Once the web app feels done, build the Android app (Expo/React Native, same backend APIs).
See plan discussed in chat — short version:
1. Install Expo Go on phone
2. `npx create-expo-app student-portal-mobile`
3. Small tweak: login API returns token in response body (not just cookie)
4. Build screens calling existing `/api/...` routes
5. Preview live via `npx expo start` + Expo Go
6. `eas build` to produce a real installable APK later
