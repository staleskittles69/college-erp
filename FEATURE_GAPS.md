# Feature Gaps — College ERP

_Audit from 2026-07-19. Combines a scan of the current codebase with a comparison against popular commercial college ERPs (Fedena, Ellucian, Creatrix Campus, TCS iON)._

## Already logged in TODO.md
- At-risk students page (low attendance / low CGPA tables) — not built
- Notices missing an `audience` field so admin announcements can also target teachers
- Admin Messages panel (view teacher-sent messages) — not built
- Teacher "Message Admin" form + sent-message history — not built
- Branches hardcoded in `src/lib/academics.ts` instead of DB-driven

## Found in codebase audit

**Admin**
- `src/app/admin/settings/page.tsx` — Account/Notifications/College-Info sections are static, non-functional ("Save Changes" has no onClick/API). Only password change actually works.
- `src/app/admin/audit-logs/page.tsx` — has an empty/placeholder state, worth checking if logs are actually being recorded anywhere yet.

**Teacher**
- `src/app/teachers/page.tsx` (dashboard) — "Today's Classes" and "Recent Activity" are permanently-empty placeholder boxes, not wired to data.
- `src/app/teachers/settings/page.tsx` — only password change; no profile/notification settings.

**Student**
- `src/app/student/messages/page.tsx` — full stub: "Messaging coming soon," no form or API.
- `src/app/student/resources/page.tsx` — full stub: "Resources coming soon." No matching upload UI on teacher/admin side either — a whole unbuilt feature (course materials/file sharing).
- `src/app/student/settings/page.tsx` — password-only, no profile/notification settings.

**Security (real risk, not just a stub)**
- `src/models/User.ts:26` — lingering `// TODO: hash passwords before going to production`. New accounts via `/api/students` and `/api/teachers` POST are bcrypt-hashed, and login (`src/app/api/auth/login/route.ts`) checks for a `$2` bcrypt prefix before falling back to plaintext comparison — meaning any account created via seed scripts with a plaintext password still logs in via plaintext comparison. Worth auditing `scripts/seed.ts` / `scripts/seed-students.ts`.

**Mobile app**
- Only Login + a 3-tab Admin shell (Dashboard/Students/Notices) exist so far. Not built: teacher portal, student portal, rest of admin (marks, attendance, teacher management, timetable, tests).

**Previously discussed, not started**
- Payment portal (manual UPI + admin verification) — design-decided, no implementation yet.

## Comparison against popular ERPs (Fedena, Ellucian, Creatrix Campus, TCS iON)

**Already covers the academic core well:** attendance, marks/grades, CGPA, timetable, assignments/tests, notices — the heart of what these platforms do for day-to-day teaching.

**Bigger structural gaps vs. all of them:**
- **Fees/Finance** — every platform treats fee collection as a core module (invoicing, payment tracking, financial aid). Only a manual-UPI approach has been discussed here; nothing built.
- **Admissions/CRM** — Ellucian and TCS iON lead with online applicant registration and admissions pipelines. This system has admin manually creating accounts; no "prospective student applies" flow. Probably fine if not handling live admissions cycles.
- **Parent portal** — self-service login for parents (attendance/grades visibility) is standard on Fedena and TCS iON. None exists here.
- **Library management** — checkouts, catalog, due dates. All four platforms have it; nothing here.
- **Communication beyond in-app notices** — SMS/email/push alerts are standard (especially Fedena). This system is web-notices-only.

**Present in theirs, genuinely niche here — worth confirming need before building:**
- Hostel/dorm management, transport/bus routing, HR & payroll for staff, biometric attendance hardware integration, ID card generation, multi-campus support, accreditation/assessment tooling.
- Full LMS (video lectures, course content, online proctored exams) — assignments/tests exist but no course-content delivery; the `student/resources` stub is exactly this gap.

## Recommendation
Chasing full parity with these platforms would be years of work aimed at a much bigger institution. Of the ERP-comparison list, **fee/payment management** and a **parent portal** are the two most commonly expected by actual users and would close the biggest credibility gap. Library and external communication channels are worth it only if the college currently does those manually and wants to digitize. Separately, the plaintext-password fallback is worth fixing regardless of what feature work comes next — it's a real risk, not a missing convenience.

### Sources
- [Fedena feature tour](https://fedena.com/feature-tour)
- [Ellucian](https://www.ellucian.com/)
- [Creatrix Campus — Capterra](https://www.capterra.com/p/141268/Creatrix-Campus/)
- [TCS iON in Higher Education](https://www.tcsion.com/international/segments/higher-education/)
