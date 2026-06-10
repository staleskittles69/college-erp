# Master Prompts — Antigravity Drop-Ins

Two self-contained prompts. Open Antigravity, paste the WHOLE block (including the context section) — don't trim anything. Let it work, test the result in your browser, then move to the next prompt.

**Order:** Run Admin first, then Teacher. The teacher prompt assumes the admin APIs exist.

---

# 🟦 PROMPT 1 — NAIL THE ADMIN CONTROLS

```
You are working on a College ERP built with Next.js 14 (App Router), React 18, Tailwind CSS, MongoDB + Mongoose, and JWT auth via the `token` HTTP-only cookie. The project lives at the repo root. Read CLAUDE.md and FIXLIST.md before you start — they contain rules and known issues.

## Your mission
Make the Admin portal fully functional end-to-end. Every page, button, and number must hit the real database via API routes. No hardcoded data anywhere in the admin portal after you're done.

## Hard rules (do not violate)
- Tailwind utility classes only. No inline styles, no CSS modules, no new CSS files.
- Do NOT add any new npm packages. Use what's already in package.json.
- Do NOT touch /src/app/dashboard/ (legacy redirect folder).
- Do NOT touch the teacher or student portals or their components.
- Use lucide-react for any new icons.
- Keep the existing visual style: dark slate sidebar (bg-slate-900), indigo accents (indigo-600), rounded-xl cards with border border-gray-200.
- Every API route you create MUST check auth via getAuth() from @/lib/api-auth and reject if role !== "admin" (return 403).
- Use existing Mongoose models in /src/models. Add a new model file only if I haven't named one for the feature.

## Tasks (do them in this order)

### 1. Admin navbar — show real logged-in user
File: src/components/admin/AdminNavbar.tsx (or wherever the admin navbar lives — find it).
Currently shows "Admin" / "admin@college.edu" hardcoded. Fetch from /api/auth/me on mount and show the real name + email. Show a small skeleton (gray rounded blocks) while loading.

### 2. Admin dashboard — fix the "Tests Scheduled" stat card
File: src/app/admin/page.tsx and src/app/api/admin/stats/route.ts.
The stats route already returns totalStudents, totalBranches, noticeCount. Add `testsScheduled` to the response by counting Test documents. Wire the dashboard's "Tests Scheduled" card to display it instead of "—".

### 3. Branches page — read real departments
File: src/app/admin/branches/page.tsx.
Currently shows a hardcoded branch list. Fetch from /api/departments on mount. The Add Department modal already works — just make the page re-fetch after a successful add so the new department appears immediately. Use a loading spinner (Loader2 from lucide-react) while fetching.

### 4. Student detail page — fetch real student
File: src/app/admin/[branch]/[year]/[section]/[studentId]/page.tsx.
Currently shows hardcoded student info. Fetch from /api/students/[id] on mount using the studentId param. Show all fields the model has: name, rollNumber, email, branch, year, section, attendance %, marks summary. Empty state if not found. Loading skeleton while fetching.

### 5. Section page search — fix the footer count
File: src/app/admin/[branch]/[year]/[section]/page.tsx.
Search bar already filters the list. Footer currently shows total enrolled even when search is active. Change it to "Showing X of Y students" where X is filtered count and Y is total.

### 6. Build out the Admin Features pages (currently placeholder shells)

**6a. /admin/features/students/page.tsx — Add Student**
A form (single page, not a modal): name, roll number, email, branch dropdown (fetched from /api/departments), year (1-4), section (A/B/C). On submit, POST to /api/admin/create-student (already exists). Show success toast (just a green banner that auto-hides after 3s) and reset the form. Show errors clearly.

**6b. /admin/features/attendance/page.tsx — Mark Attendance**
Cascading selects: branch → year → section → date. After section is picked, fetch students from /api/students?branch=X&year=Y&section=Z. Show a list with Present/Absent toggle per student (default Present). Submit POSTs to /api/attendance with array of {studentId, status, date}. Success toast.

**6c. /admin/features/marks/page.tsx — Enter Marks**
Cascading selects: branch → year → section → subject → exam type (Mid/Sem/Quiz). Then student list with a number input per student (0–100). Submit POSTs to /api/admin/marks (already exists). Validate 0–100 range. Success toast.

**6d. /admin/features/announcements/page.tsx — Post Notice**
Form: title, body (textarea), audience (All / Specific Branch / Specific Year), expiresAt (date input). On submit, POST to /api/notices. Below the form, show a table of recent notices (last 10 from GET /api/notices) with delete buttons (DELETE /api/notices/[id], confirm dialog before delete).

**6e. /admin/features/timetable/page.tsx — Edit Timetable**
Cascading selects: branch → year → section. After section picked, fetch from /api/timetable?branch=X&year=Y&section=Z. Show a 5-day × 6-period grid (Mon–Fri, periods 1–6). Each cell is editable (subject + teacher dropdown). On Save, PUT to /api/timetable. Success toast.

### 7. Admin settings page
File: src/app/admin/settings/page.tsx.
Replace the placeholder with three actual sections (each a card):
- **Profile** — name, email (read-only from /api/auth/me), change password form (POST to a new /api/auth/change-password route — create it; verify old password, hash new with bcryptjs, update User doc).
- **College info** — name, address, contact email, principal name. Save to a new `Settings` model (single doc, upsert). Create /api/admin/settings (GET + PUT).
- **Danger zone** — "Reset all attendance for current semester" button with a triple-confirm dialog (type the word DELETE to enable). Skip implementation, just show the button — wire it later.

### 8. Real audit logs
File: src/app/admin/audit-logs/page.tsx + new model + new API.
- Create src/models/AuditLog.ts with: actor (User ref), action (string), target (string, optional), metadata (mixed), createdAt.
- Create /api/admin/audit-logs (GET, paginated, latest first).
- Add a helper src/lib/audit.ts with `logAction(actorId, action, target?, metadata?)`.
- In every admin-write API route (create-student, marks, notices POST/DELETE, settings PUT, timetable PUT, departments POST), call logAction after the successful DB write.
- The page fetches and shows logs in a table: Time | Actor | Action | Target. Pagination at the bottom (20 per page).

### 9. Cleanup
- Delete /src/app/admin/student/[rollNumber]/ folder (legacy route, never reached).
- Delete /src/app/api/debug-users/ if it exists.
- /src/app/api/setup-initial-data/ — wrap the handler so it returns 403 in production (process.env.NODE_ENV === "production").

## Done criteria — verify all of these manually after you finish
- [ ] Admin navbar shows my real name & email
- [ ] Dashboard shows 4 real numbers (students, branches, notices, tests)
- [ ] Branches page lists real departments and updates after add
- [ ] Student detail page loads real data from URL studentId
- [ ] Section page search shows "X of Y"
- [ ] All 5 Features pages save to DB and show success toasts
- [ ] Settings page has Profile, College Info, Danger Zone — first two save & persist
- [ ] Audit logs page shows real entries after I do any admin action
- [ ] Legacy /admin/student/[rollNumber] folder is gone
- [ ] No new npm packages were installed
- [ ] No teacher or student files were touched

If you find something I haven't named (a hardcoded list somewhere, a button that does nothing), list it at the end of your response — DO NOT fix it without asking.
```

---

# 🟩 PROMPT 2 — NAIL THE TEACHER CONTROLS

```
You are working on a College ERP built with Next.js 14 (App Router), React 18, Tailwind CSS, MongoDB + Mongoose, and JWT auth via the `token` HTTP-only cookie. Read CLAUDE.md and FIXLIST.md before you start — they contain rules and known issues.

## Your mission
Make the Teacher portal fully functional end-to-end. Every page must hit real APIs. The teacher should be able to do their entire daily job from this portal: take attendance, post notices, enter marks, manage assignments, see their timetable. No hardcoded data anywhere.

## Hard rules (do not violate)
- Tailwind utility classes only. No inline styles, no CSS modules, no new CSS files.
- Do NOT add any new npm packages.
- Do NOT touch /src/app/dashboard/ (legacy).
- Do NOT touch the admin or student portals.
- Use lucide-react for any new icons.
- Keep the existing visual style: dark slate sidebar (bg-slate-800), teal/slate accents, rounded-xl cards.
- Every API route you create MUST check auth via getAuth() from @/lib/api-auth and reject if role !== "teacher" (return 403). Teachers should ONLY ever see/modify data for sections they're assigned to — enforce this on the server, not just the UI.
- Use existing Mongoose models in /src/models.

## Important context
A teacher's "teaching assignments" are stored on the Teacher doc (look at the model). They teach specific (branch, year, section) combos and specific subjects. Every teacher action must be scoped to their own assignments. /api/teachers/me/classes already returns this — use it.

## Tasks (do them in this order)

### 1. Teacher dashboard — fill in the gaps
File: src/app/teachers/page.tsx and src/app/api/teachers/me/stats/route.ts.
The dashboard already pulls studentCount and sectionCount. Add `pendingAssignments` (count of Assignments created by this teacher where dueDate > now and not all submissions graded). Wire the "Pending Assignments" card to it.
Also fill in the two empty cards:
- **Today's Classes** — fetch from /api/teachers/me/classes/today (create this route — return today's periods from the Timetable for this teacher's sections, sorted by period number). Show as a list: time, subject, branch-year-section, room.
- **Recent Activity** — last 5 actions by this teacher (notices posted, attendance taken, assignments created, marks entered). Pull from a teacher-scoped /api/teachers/me/activity (create it — query AuditLog if it exists, otherwise just merge recent records from Notice/Attendance/Assignment/Marks where actor === this teacher).

### 2. Teacher timetable
File: src/app/teachers/timetable/page.tsx.
Currently a hardcoded grid. Fetch from /api/teachers/me/timetable (create this route — return all timetable entries where teacher field === this teacher's id). Render as a 5-day × 6-period grid. Each filled cell shows subject + branch-year-section + room. Empty cells show "Free". Add a "Today" highlight (entire today column has a soft background like bg-blue-50).

### 3. Teacher notices
File: src/app/teachers/notices/page.tsx.
Currently hardcoded list. Two parts:
- **Compose form** at top: title, body, audience dropdown (only the sections this teacher teaches). On submit, POST to /api/notices (already exists). Set audience accordingly.
- **List** below: fetch GET /api/notices?author=me (extend the route to support filtering by author from token). Show last 20 notices by this teacher. Each row has Edit + Delete. Edit opens an inline form, Delete confirms then DELETE /api/notices/[id].

### 4. Teacher attendance — already mostly working, audit and harden
File: src/app/teachers/attendance/page.tsx.
The page already fetches /api/teachers/me/classes and lets the teacher pick branch/year/section/subject. Verify:
- The "Load students" button actually fetches from /api/students?branch=X&year=Y&section=Z and renders them.
- Toggling Present/Absent updates state.
- Submit POSTs to /api/attendance with {studentId, status, date, subject, teacherId} for each student.
- After submit: success banner, button to take attendance for another class, lock the form so it can't be double-submitted.
- Add a "View past attendance" tab at the top — pick a date, see what was already submitted (GET /api/attendance?branch=X&year=Y&section=Z&date=YYYY-MM-DD).
- Server-side: in /api/attendance POST, verify the teacher actually teaches this section before saving (cross-check against their Teacher doc).

### 5. Teacher assignments — build the real flow
File: src/app/teachers/assignments/page.tsx + new model + new APIs.
Currently hardcoded. Build it properly:

**5a. Create model** src/models/Assignment.ts
Fields: title, description, branch, year, section, subject, dueDate, attachmentUrl (optional), createdBy (Teacher ref), submissions (array of {studentId, submittedAt, fileUrl, grade?, feedback?}), createdAt.

**5b. Create API** /api/assignments
- GET (filter by ?teacher=me OR ?student=me OR ?branch=X&year=Y&section=Z based on role)
- POST (teacher only, must own the section)
- PATCH (teacher only, edit own)
- DELETE (teacher only, own)

**5c. Create API** /api/assignments/[id]/grade
- POST: teacher grades a student's submission. Body: {studentId, grade, feedback}. Updates the matching submission in the array.

**5d. Build the page UI**
- Top section: "Create Assignment" form (collapsed by default, expand button). Fields: title, description, section (cascading from teacher's classes), subject, dueDate, optional file URL. Submit creates via /api/assignments.
- Below: tabs — "Active" (dueDate > now), "Past" (dueDate < now), "Drafts".
- Each assignment card shows: title, section, due date countdown ("Due in 3 days"), submission count ("12 / 45 submitted"), Edit + Delete + "Grade Submissions" button.
- "Grade Submissions" opens a side panel listing each student's submission. For graded ones, show grade + feedback. For ungraded, show grade input (0–100) + feedback textarea + Save button.

### 6. Add a Marks Entry page for teachers
NEW file: src/app/teachers/marks/page.tsx and add the link to the teacher sidebar (src/components/teacher/TeacherSidebar.tsx).
Cascading: branch → year → section → subject → exam type. After section picked, fetch students. Number input per student (0–100). Submit POSTs to /api/admin/marks — but RENAME that route to /api/marks and update the auth check to allow both admin AND the teacher who teaches that subject for that section. Update any callers of the old path.

### 7. Add a "My Classes" overview to teacher dashboard sidebar
File: src/components/teacher/TeacherSidebar.tsx.
Below the existing nav, add a section "My Classes" listing each (branch, year, section) the teacher teaches as a clickable link to /teachers/students/[branch]/[year]/[section]. Use a small icon, smaller text.

### 8. Verify the existing student-list nav
Path: src/app/teachers/students/[branch]/[year]/[section]/page.tsx.
FIXLIST says "unknown if it fetches real data". Verify it calls /api/students with the correct filter and renders real students. If it's hardcoded, fix it. Add server-side check in /api/students that if requester is a teacher, the filter must match a section they teach.

## Done criteria — verify all of these manually after you finish
- [ ] Teacher dashboard shows 4 real numbers + today's classes + recent activity
- [ ] Timetable page shows my real timetable, today's column highlighted
- [ ] I can compose a notice and see it appear in the list immediately
- [ ] I can take attendance, submit it, and see it on /api/attendance for that section/date
- [ ] I cannot take attendance for a section I don't teach (server returns 403)
- [ ] I can create an assignment, see it as Active, students would see it in their portal
- [ ] I can grade a submission and the student would see the grade
- [ ] Marks page works and saves to DB
- [ ] My Classes section in sidebar links to my real sections
- [ ] No new npm packages installed
- [ ] No admin or student files were touched

If you find something I haven't named, list it at the end — DO NOT fix it without asking.
```

---

## How to use these

1. Open Antigravity in this repo.
2. Copy **PROMPT 1** (everything between the triple backticks). Paste. Let it run.
3. After it finishes, run `npm run dev` and walk through the "Done criteria" checklist yourself. Click every button.
4. Anything broken → tell Antigravity "Fix X — it's still doing Y instead of Z" with the exact path.
5. Once admin is solid, repeat with **PROMPT 2**.
6. Then move to Tier 1 of PITCH-AUDIT.md (fee management, etc.).

## Why these prompts work
- **Hard rules section up front** — agentic IDEs love adding new packages and rewriting things. The constraints stop that.
- **Numbered, file-pathed tasks** — no ambiguity, no scope creep.
- **Done criteria at the end** — gives both you and the agent a checklist to grade against.
- **"List things I haven't named, don't fix them"** — surfaces hidden issues without the agent going off the rails.
- **Auth/scoping rules baked in** — the teacher prompt explicitly says "verify the teacher teaches this section before saving" so Antigravity doesn't ship insecure endpoints.
