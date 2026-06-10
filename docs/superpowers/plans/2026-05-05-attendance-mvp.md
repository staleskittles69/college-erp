# Attendance MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three concrete bugs and add two missing features to complete the attendance MVP.

**Architecture:** The Attendance, Student, and User models are already correct. The API structure (GET/POST/PATCH) is already in place. Only targeted fixes are needed — no new files, no schema changes.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, MongoDB/Mongoose, TypeScript

---

## File Map

| File | Change |
|------|--------|
| `src/app/api/attendance/route.ts` | Fix GET: resolve branch/semester/section via Student model |
| `src/app/teachers/attendance/page.tsx` | Fix rollNo bug; add date picker; add mark-all buttons |
| `src/app/student/attendance/page.tsx` | Add explicit below-75% warning section |

**No changes needed:** models, admin attendance page, AttendancePanel component, AdminSidebar (all already correct).

---

## Task 1: Fix API GET — branch/semester/section filter

**Problem:** Lines 38–40 in `route.ts` add `branch`, `semester`, `section` directly to the Attendance query filter. But those fields are not stored on Attendance documents — they live on Student documents. So these filters silently return wrong results.

**Fix:** When any of those three params are present, first query Student for matching `_id`s, then use `{ $in: [...ids] }` on `filter.studentId`.

**Files:**
- Modify: `src/app/api/attendance/route.ts:29-48`

- [ ] **Step 1: Replace the broken filter block**

Find this block (approximately lines 30–48):

```typescript
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");

    const filter: Record<string, unknown> = {};
    if (studentId) filter.studentId = studentId;
    if (subject) filter.subject = subject;
    if (branch) filter.branch = branch;
    if (semester) filter.semester = Number(semester);
    if (section) filter.section = section;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
      if (to) (filter.date as Record<string, Date>).$lte = new Date(to);
    }
```

Replace with:

```typescript
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");

    const filter: Record<string, unknown> = {};
    if (studentId) filter.studentId = studentId;
    if (subject) filter.subject = subject;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, Date>).$gte = new Date(from);
      if (to) (filter.date as Record<string, Date>).$lte = new Date(to);
    }

    // branch/semester/section are not stored on Attendance — resolve via Student
    if ((branch || semester || section) && !filter.studentId) {
      const StudentModel = (await import("@/models/Student")).default;
      const sFilter: Record<string, unknown> = {};
      if (branch) sFilter.branch = branch;
      if (semester) sFilter.semester = Number(semester);
      if (section) sFilter.section = section;
      const matching = await StudentModel.find(sFilter).select("_id").lean();
      filter.studentId = { $in: matching.map((s) => (s._id as { toString(): string }).toString()) };
    }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/attendance/route.ts
git commit -m "fix: resolve branch/semester/section via Student in attendance GET"
```

---

## Task 2: Fix teacher attendance page — rollNo bug + date picker + mark-all

**Problems:**
1. `interface Student` declares `rollNumber` but `/api/students` returns `rollNo` → roll numbers show blank
2. No date input → attendance always saved for today, can't mark past sessions
3. No "Mark All Present/Absent" buttons (admin page has them, teacher doesn't)

**Files:**
- Modify: `src/app/teachers/attendance/page.tsx`

- [ ] **Step 1: Fix the Student interface and rollNo display**

Find:
```typescript
interface Student { _id: string; name: string; rollNumber: string; }
```
Replace with:
```typescript
interface Student { _id: string; name: string; rollNo: string; }
```

Find (in the student list JSX, ~line 194):
```tsx
                    <p className="text-xs text-gray-400">{student.rollNumber}</p>
```
Replace with:
```tsx
                    <p className="text-xs text-gray-400">{student.rollNo}</p>
```

- [ ] **Step 2: Replace todayISO const with date state**

Find:
```typescript
  const todayISO = new Date().toISOString().split("T")[0];
```
Replace with:
```typescript
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
```

- [ ] **Step 3: Add markAll function**

Find:
```typescript
  function handleBranchChange(v: string) { setBranch(v); setYear(""); setSection(""); setStudents([]); setSubmitted(false); }
```
After it, add:
```typescript
  function markAll(status: Status) {
    const next: Record<string, Status> = {};
    students.forEach((s) => { next[s._id] = status; });
    setAttendance(next);
  }
```

- [ ] **Step 4: Add date field to the selector grid**

The selector grid currently has 4 columns: Branch, Year, Section, Subject. Change the grid to 5 columns and add a Date column.

Find:
```tsx
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
```
Replace with:
```tsx
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
```

Find (the subject dropdown `<div>` — last item in the grid):
```tsx
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
```
Replace with:
```tsx
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setSubmitted(false); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
```

- [ ] **Step 5: Update handleSubmit to use date state**

Find:
```typescript
      body: JSON.stringify({ bulk, subject, date: todayISO }),
```
Replace with:
```typescript
      body: JSON.stringify({ bulk, subject, date }),
```

- [ ] **Step 6: Add mark-all buttons to the student list header**

Find:
```tsx
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">{students.length} students</span>
            <span className="text-xs text-gray-500">
              {presentCount} present · {students.length - presentCount} absent
            </span>
          </div>
```
Replace with:
```tsx
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {students.length} students &nbsp;·&nbsp; {presentCount} present &nbsp;·&nbsp; {students.length - presentCount} absent
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => markAll("present")}
                className="text-xs px-3 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium"
              >
                All Present
              </button>
              <button
                onClick={() => markAll("absent")}
                className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-medium"
              >
                All Absent
              </button>
            </div>
          </div>
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: no new errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/teachers/attendance/page.tsx
git commit -m "fix: rollNo typo, add date picker and mark-all to teacher attendance"
```

---

## Task 3: Add below-75% warning to student attendance page

**Problem:** The student page color-codes subjects below 75% in amber/red, but the spec requires an explicit warning section listing affected subjects and how many classes are needed.

**Files:**
- Modify: `src/app/student/attendance/page.tsx`

- [ ] **Step 1: Compute lowSubjects before the return**

Find this line (just before the `return`):
```typescript
  const bySubject: Record<string, { present: number; total: number }> = {};
  records.forEach((r) => {
    if (!bySubject[r.subject]) bySubject[r.subject] = { present: 0, total: 0 };
    bySubject[r.subject].total += 1;
    if (r.status === "present") bySubject[r.subject].present += 1;
  });
```
After that block, add:
```typescript
  const lowSubjects = Object.entries(bySubject).filter(
    ([, { present: p, total: t }]) => Math.round((p / t) * 100) < 75
  );
```

- [ ] **Step 2: Insert the warning section in JSX**

Find the comment and summary grid:
```tsx
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
```

After the closing `</div>` of that summary grid (the one containing Present/Absent/Overall cards), add:

```tsx
          {/* Below-75% warning */}
          {lowSubjects.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">Attendance Warning</p>
              <ul className="space-y-1">
                {lowSubjects.map(([subject, { present: p, total: t }]) => {
                  const subPct = Math.round((p / t) * 100);
                  const needed = Math.ceil(t * 0.75 - p);
                  return (
                    <li key={subject} className="flex items-center gap-2 text-xs text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <span>
                        <strong>{subject}</strong>: {subPct}% — attend {needed} more class{needed !== 1 ? "es" : ""} to reach 75%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/student/attendance/page.tsx
git commit -m "feat: add below-75% warning section to student attendance page"
```

---

## Task 4: Final verification

- [ ] **Step 1: Run lint**

```bash
npx next lint
```

Report any warnings. Do not hide pre-existing ones.

- [ ] **Step 2: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Report any warnings or errors.

- [ ] **Step 3: Summary report**

Report:
- Files changed and what each change does
- Any pre-existing warnings that were NOT introduced by this work
- Confirmation that existing admin/student/teacher routing is untouched
