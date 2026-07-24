# Project Context & Session History

Purpose: a durable technical record of what's been learned about and done to this codebase across sessions, so a new Claude Code session doesn't have to relearn any of it. Read this alongside `CLAUDE.md` (architecture/conventions), `TODO.md`, `FEATURE_GAPS.md`, and `PRODUCTION-PLAN.md`.

Last updated: 2026-07-24.

---

## 0. Environment — read this first

**The project now lives at `C:\Dev\Student Portal`.** It was moved here from `C:\Users\LENOVO\OneDrive\Documents\Student Portal` because OneDrive's file sync interferes with Next.js's fast-churning `.next` build cache — this caused repeated dev-server crashes (`ENOENT` pack-file rename errors, `EINVAL readlink` on `_buildManifest.js`, `TypeError: Cannot read properties of undefined (reading 'entryCSSFiles')`). The fix each time was killing the dev server, deleting `.next`, and restarting — but the real fix was getting the project off OneDrive entirely.

- The old OneDrive copy still exists on disk (not deleted) as a safety net. It should be safe to delete once the new location has been used for a while without issues — but double check nothing is uncommitted there that isn't already in the new copy.
- `.git`, `.env.local`, and all uncommitted changes were carried over intact during the move (verified: `git log`, `git status`, `git remote -v` all matched before/after).
- Run everything (`npm run dev`, git commands, editor) from `C:\Dev\Student Portal` going forward.
- **Important quirk of Claude Code itself**: its per-project memory/session identity is keyed to the absolute working directory path. This session is still "rooted" at the OneDrive path (that's where its own memory folder lives: `C:\Users\LENOVO\.claude\projects\C--Users-LENOVO-OneDrive-Documents-Student-Portal\memory\`), even though every command in it targets `C:\Dev\Student Portal`. Opening a *new* Claude Code session pointed at `C:\Dev\Student Portal` would be treated as a different project (fresh chat, empty memory) — that's the reason this document exists, so that new session can bootstrap quickly by reading it.

---

## 1. Project shape (condensed from CLAUDE.md)

College ERP, three portals (Admin `/admin`, Teacher `/teachers`, Student `/students`), single login at `/login` with JWT-cookie auth (`token`, httpOnly) and role-based middleware routing. Next.js 14 App Router, Tailwind, MongoDB/Mongoose, jose/jsonwebtoken, lucide-react icons. Full details and folder structure are in `CLAUDE.md` — don't duplicate them here, just note anything CLAUDE.md doesn't say.

**Test/dev accounts** (see `scripts/seed.ts`, `scripts/seed-students.ts`):
- Admin: `admin@college.edu` / `admin123`
- Teacher: `praful@college.edu` / `asdfghjkl` (not the seed.ts default `teacher@college.edu` — a real one was created separately)
- Student: bulk-seeded, 12,000 accounts, email pattern `{branch}{year}.section{n}.{roll}@college.edu` (e.g. `cse1.section1.1@college.edu`), password `student123` for all. The `seed:students` script **wipes and replaces all student users** every time it runs — don't assume a specific student account still exists without checking.
- Login page has "Quick login (dev)" buttons for all three — kept in sync with real seeded accounts (was broken once, see §3).

---

## 2. Chronological work log

### 2.1 Initial verification pass
Ran the whole app end-to-end (all three portals, login flows, admin student search/detail, teacher hierarchical nav) via the Chrome extension. Found the student "Quick login" button on `/login` was hardcoded to `student@college.edu`, which `seed:students` had wiped out — fixed to point at a real seeded account (`src/app/(auth)/login/page.tsx`).

### 2.2 Git history cleanup
Repo had messy early commits (`first commit` ×2, `initial commit`, `full backup commit`, all same day, plus a `pre-prod v1`). Squashed the four root commits into one (`Initial Next.js scaffold: auth login and admin dashboard skeleton`) and reworded `pre-prod v1` → `Add attendance tracking across portals and teacher class-assignment flow`, using `git commit-tree` + `git rebase --onto` + `git filter-branch` (never `rebase -i`, which requires interactive input this environment can't do). Verified the resulting working tree was byte-identical to before the rewrite, kept a local `backup-before-history-rewrite` branch (not pushed), then force-pushed to `origin/main`. Everything else in history was already well-named and left alone.

### 2.3 Notice board polluted by auto-generated notices
Scheduling a test or assignment auto-created a `Notice` document ("Test Scheduled: X" / "Assignment Scheduled: X"), burying real announcements. Removed that `Notice.create` call from `/api/tests` POST (`src/app/api/tests/route.ts`) — the "Upcoming deadlines" widget already surfaces tests/assignments correctly (and already excludes past-due ones via `?upcoming=true` → `date: { $gte: new Date() }`), so nothing was lost. Cleaned up the 2 stale auto-notices already in the DB. Notice board is now reserved for actual admin-posted announcements.

### 2.4 Admin dashboard branch-card sort order
"Manage Students" branch cards sorted alphabetically by branch code (`$sort: { _id: 1 }`). Changed to sort by student count descending with branch code as tiebreaker (`$sort: { count: -1, _id: 1 }`) in `src/app/api/admin/stats/route.ts`. Currently all branches are equal (2,400 each) so it still displays alphabetically as the tiebreak — will reorder automatically once real enrollment data differs.

### 2.5 Whole-site responsive/mobile design
None of the three portals hid their sidebar on small screens — always full-width (256px or 80px collapsed), crushing content on a phone. Implemented a consistent mobile-first pattern across all three:
- Sidebar: `w-64` base (mobile), `md:w-16`/`md:w-64` for the existing desktop collapse toggle; `-translate-x-full md:translate-x-0` so it's an off-canvas drawer below `md`, always visible at `md`+; backdrop overlay + close (X) button for mobile.
- Hamburger menu button added to each navbar (`AdminNavbar`, `TeacherNavbar`, student `Navbar`), visible only below `md`.
- `SidebarItem.tsx`: labels/centering now only respond to the desktop "collapsed" state at `md:` and above (previously hid on all screen sizes).
- Admin layout had to be split into a new `AdminShell.tsx` client component, because `admin/layout.tsx` exports `metadata` (server-component-only) but needed `useState` for the mobile-drawer toggle.
- Smoothed dashboard grid breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` instead of a hard `grid-cols-2 → lg:grid-cols-4` jump) for the admin dashboard's stat cards and branch cards.

**Verification note**: the Chrome extension's `resize_window` tool doesn't work in this sandbox (viewport stays locked at ~1536px no matter what's requested). Worked around it by navigating a tab to a page with a same-origin `<iframe>` of a fixed width injected via JS (`document.documentElement.innerHTML = ...`) and pointing its `src` at `localhost:3000` — iframes get their own real viewport, so actual CSS media queries fire correctly. Confirmed working at 390px width on the admin portal (sidebar hides, hamburger shows, drawer opens/closes correctly). Didn't get to explicitly re-verify teacher/student portals the same way, but they use the identical code pattern.

**User feedback mid-task**: stop using claude-in-chrome unless explicitly asked or truly necessary — user prefers to test manually. Respect this going forward.

### 2.6 Timetable / Schedule Tests section-matching bug
User reported: added a CSE Section 1 timetable in admin, confirmed saved to DB, but it didn't show on that student's dashboard.

Root cause: `TimetablePanel.tsx` (admin) saved `section` as a bare digit string (`"1"`), but the real `User.section` field format used everywhere else in the app is the full label `"Section 1"` (set by `scripts/seed-students.ts`: `section: \`Section ${sec}\``). The student-facing `/api/timetable` GET does an exact match on `user.section`, so `"1"` never matched `"Section 1"` — nothing showed up, for any section, not just section 1.

Fixed `TimetablePanel.tsx` to save/load as `Section ${section}`, and migrated the 4 existing CSE-Section-1 timetable rows already in the DB to the corrected format (no need to redo that work). Found the identical bug in `ScheduleTestsPanel.tsx` (same bare-number save) and fixed it the same way, including un-stripping the "Section " prefix back out when populating the edit-form's number input. No existing bad `Test.section` data needed migrating (none existed yet). Note: the Schedule Tests section field was actually cosmetic — the student-facing test feed only ever filtered by branch+year, never by section — so that particular fix corrects stored-data consistency but doesn't change what students see.

### 2.7 Security hardening pass
Triggered by the user wanting the site "impregnable." Findings and fixes, roughly in order of severity:

1. **[Critical] Plaintext passwords.** `/api/admin/seed-logins/route.ts` wrote `password: "student123"` directly with zero hashing. This is *why* `login` and `change-password` both had a `user.password.startsWith("$2") ? bcrypt-compare : plaintext ===` fallback. Fixed: seed-logins now hashes via `hashPassword()`; migrated the 2 existing plaintext-password accounts in the DB to bcrypt (scanned all 12,006 users); removed the plaintext fallback entirely from both routes (now pure `comparePassword()`); deleted the stale `// TODO: hash passwords before going to production` comment on the `User` model.
2. **[Medium] Unescaped regex in student search.** `/api/students` GET built `$regex: search` directly from raw user input (ReDoS + metacharacter-confusion risk). Added an `escapeRegex()` helper to `lib/utils.ts` and applied it. Endpoint is admin/teacher-only so exposure was already limited, but worth fixing regardless.
3. **[High] Hardcoded JWT fallback secret.** `src/middleware.ts` had `process.env.JWT_SECRET ?? "fallback-secret-change-in-production"` — if the env var were ever missing at runtime, it would silently accept a publicly-known string as the signing secret, letting anyone forge a valid admin JWT. Fixed to fail fast (`throw new Error("JWT_SECRET not set")`), matching the existing pattern in `lib/auth.ts`.
4. **[Medium] Dead auth-bypass routes.** `middleware.ts` explicitly whitelisted `/api/setup-initial-data` and `/api/debug-users` to skip authentication entirely — but neither route file actually exists anymore (probably removed in an earlier cleanup pass, bypass left behind as a landmine). Removed the dangling whitelist entries.
5. **[Low-Medium] No brute-force protection on login.** Added `failedLoginAttempts` (default 0) and `lockUntil` (default null) fields to the `User` model; login now locks an account for 15 minutes after 5 consecutive failed attempts, resets on success.
6. **[Medium] Unrestricted file uploads.** `/api/upload/route.ts` (teacher assignment attachments) accepted any file type/size. Added a 10MB cap and an extension allowlist (pdf/doc/docx/ppt/pptx/xls/xlsx/jpg/jpeg/png/gif/txt) — previously an `.html` or `.svg` upload could have enabled stored XSS served from the app's own origin.
7. **Security headers.** Added via `next.config.js`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation disabled), `Strict-Transport-Security`.
8. **`npm audit`**: found 12 vulnerabilities (1 low, 11 high). Ran plain `npm audit fix` (no breaking changes) → fixed 5; all were transitive dev/lint-tooling deps (brace-expansion, esbuild, fast-uri, flatted, js-yaml, minimatch, picomatch) that never run in production. The remaining 7 all require a Next.js 14→16 major-version jump (`npm audit fix --force`, which also bumps `postcss`/`glob`/`eslint-config-next`). Investigated whether the underlying CVEs actually apply: this app uses no `next/image`, no Server Actions (`'use server'`), no `rewrites`/`i18n` in `next.config.js`, and no custom server — which rules out the large majority of the 19 individual advisories. The two that could theoretically matter (middleware/proxy redirect cache-poisoning; generic App-Router/Server-Components DoS) are low practical risk for a plain self-hosted `next start` deployment with no caching CDN in front, and are availability risks rather than data-breach risks. **Decision: deferred the Next.js major upgrade as a separate, dedicated task** rather than bundling a risky 2-major-version framework jump into this pass.

**Verified clean and left alone**: JWT secret is a proper random 37-char string; cookies are `httpOnly` + `secure` (prod) + `sameSite: lax`; `.env.local` is correctly gitignored (only `.env.example` is tracked); every mutating API route has an explicit role check except the three legitimate exceptions (login, logout, change-password); `change-password` is correctly scoped to `payload.userId` from the verified JWT (no way to change someone else's password).

All of the above was verified live after each change (test logins for admin/student, authenticated `/api/admin/stats` calls, clean dev-server compiles) — not just assumed from reading the diff.

---

## 3. Current uncommitted state

As of last check, nothing from §2.4 onward has been committed. Modified/added files:

```
next.config.js
src/app/admin/layout.tsx
src/app/admin/page.tsx
src/app/api/admin/seed-logins/route.ts
src/app/api/admin/stats/route.ts
src/app/api/auth/change-password/route.ts
src/app/api/auth/login/route.ts
src/app/api/students/route.ts
src/app/api/upload/route.ts
src/app/students/layout.tsx
src/app/teachers/layout.tsx
src/components/admin/AdminNavbar.tsx
src/components/admin/AdminSidebar.tsx
src/components/admin/FeaturePanels/ScheduleTestsPanel.tsx
src/components/admin/FeaturePanels/TimetablePanel.tsx
src/components/navbar/Navbar.tsx
src/components/sidebar/Sidebar.tsx
src/components/sidebar/SidebarItem.tsx
src/components/teacher/TeacherNavbar.tsx
src/components/teacher/TeacherSidebar.tsx
src/lib/utils.ts
src/models/User.ts
src/middleware.ts
src/components/admin/AdminShell.tsx   (new file)
```

Before touching any of this further: run `git status` to confirm it still matches — the user may have committed or changed things independently since this document was written.

Already committed and pushed to `origin/main` (github.com/staleskittles69/college-erp) from earlier in this same work session: the git-history rewrite (§2.2), the notice-board fix (§2.3, commit `794f11c`), the JWT-in-body / student-quick-login / FEATURE_GAPS.md commits, and the section-format fixes (§2.6) — **only §2.5 (responsive design) and §2.7 (security) are still uncommitted.**

---

## 4. Outstanding / pending items

- **NRI branding**: user wants the login page's placeholder "EduPortal" branding replaced with the real Dr. RVR Institute of Technology / NRI University logo (orange wave motif + "RI" + serif "UNIVERSITY" text). Blocked — the reference image was pasted into chat, not saved as a file I can read. Waiting on the user to save the actual logo file as `public/logo-nri.png` (or `.svg`) in the project.
- **Commit the pending responsive + security work** (§3) — not yet done.
- **Next.js 14→16 major upgrade** — explicitly deferred, not started. Do as its own dedicated task with a full regression pass, not bundled into anything else.
- **Old OneDrive folder** (`C:\Users\LENOVO\OneDrive\Documents\Student Portal`) still exists, untouched. Safe to delete once the user's confident the new location is solid.
- **Mobile app** (separate repo/folder at `Documents/student-portal-mobile`, Expo/React Native, SDK 54): only the admin portal exists so far (login, dashboard, student search, notices, pull-to-refresh). Teacher and student portal screens for mobile are still unbuilt.
- **`FEATURE_GAPS.md`** strategic recommendations (fee/payment system, parent portal — identified as the highest-value gaps versus commercial ERPs) are purely planning at this point, no implementation started.

---

## 5. User working preferences (established, don't relitigate)

- Push to `origin/main` immediately after every commit.
- Don't use claude-in-chrome browser automation unless the user explicitly asks for it by name or it's truly unavoidable — they test manually themselves. Prefer dev-server logs, direct API checks (PowerShell `Invoke-WebRequest`), and reading compiled output instead.
- User is non-technical and vibe-codes; they're also learning JavaScript on their own alongside this project. Keep explanations short and plain-English, make decisions rather than presenting option menus, and don't over-engineer beyond what's asked.
- Only change code when explicitly asked (no unsolicited refactors/features) — but security/bug findings surfaced during requested work are worth flagging even if not directly asked about.
