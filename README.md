# College ERP

A full-stack College ERP (Enterprise Resource Planning) system with three role-based portals — **Admin**, **Teacher**, and **Student** — sharing a single login and a single live database. Built with Next.js (App Router), MongoDB (Mongoose), and JWT authentication.

**Live demo:** [college-erp-olive.vercel.app](https://college-erp-olive.vercel.app)

Every feature in this app is wired end-to-end to the real database — there are no mock endpoints or placeholder screens. Data a teacher enters (a mark, an attendance record, a notice) is what a student sees, immediately.

---

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Features by portal](#features-by-portal)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Seeding sample data](#seeding-sample-data)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

A college's administration, teaching staff, and students typically work off disconnected systems — a register for attendance, a spreadsheet for marks, a notice board for announcements. This project puts all three on one system with one login and one live source of truth:

- **Single login, three destinations.** Everyone signs in at `/login`. Middleware reads their role from a signed JWT and routes them to their portal — `/admin`, `/teachers`, or `/student` — and keeps them locked out of the other two.
- **One database, three readers.** A timetable built by an admin is the timetable a teacher and a student both see. There's no per-portal copy of the same data to keep in sync.
- **Nothing is a placeholder.** Every screen in every portal reads and writes real MongoDB documents through real API routes.

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) | Pages and API routes in one codebase |
| Language | TypeScript | Strict types across API responses and components |
| Database | MongoDB + [Mongoose](https://mongoosejs.com/) | 13 models covering the full academic record |
| Styling | Tailwind CSS | Each portal is themed distinctly |
| Auth | JWT — `jsonwebtoken` (sign) + `jose` (verify) | `jose` runs inside Edge Middleware, which can't use Node's `jsonwebtoken` |
| Passwords | `bcryptjs` | Salted hashing |
| File storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Teacher-uploaded resources and assignment attachments |
| Testing | [Vitest](https://vitest.dev/) | Unit tests over auth, grading, and academic-year logic |
| Hosting | [Vercel](https://vercel.com/) | Auto-deploys on every push to `main` |

## Architecture

```
Browser
  │
  ▼
middleware.ts  ── verifies the JWT cookie (jose, runs at the Edge)
  │
  ├── no/invalid token ──────────────────► /login
  │
  ├── role = admin   ────► /admin/*     ┐
  ├── role = teacher ────► /teachers/*  ├──► shared /api/* routes ──► MongoDB
  └── role = student ────► /student/*   ┘        (re-checks the token
                                                    on every request)
```

**Auth flow, end to end:**

1. Client `POST`s `{ email, password }` to `/api/auth/login`.
2. `src/lib/auth.ts` compares the password against the stored bcrypt hash.
3. On success, it signs a JWT containing `{ userId, role, studentId | teacherId }` and sets it as an `httpOnly` cookie.
4. The client redirects to `/dashboard`; the cookie now travels with every request.
5. `src/middleware.ts` verifies that cookie on the Edge runtime and redirects to whichever portal (`/admin`, `/teachers`, `/student`) matches the token's role.
6. Every subsequent page and API request re-runs the same check — a student cookie hitting `/admin/*` is redirected to `/student`, not shown an error page; API routes reject unauthenticated requests with `401` independently of the page-level redirect.

## Features by portal

### Admin — runs the institution
- Define branches, departments, years, and sections
- Add and manage teachers, assign them to subjects/departments
- Browse students hierarchically (branch → year → section)
- Build and edit the master timetable
- Institution-wide attendance oversight
- Schedule tests and oversee marks entry
- Post announcements that surface on the student feed
- Resolve escalated student/teacher queries
- Audit log of admin actions

### Teacher — runs the classroom
- Hierarchical student navigation (branch → year → section → student)
- Mark attendance per class period
- Post and track assignments for assigned subjects
- Personal timetable (one class per day/period cell)
- Post notices scoped to their own classes
- Respond to student queries
- Upload notes/materials as downloadable resources
- Manage their own account settings

### Student — tracks their own record
- Dashboard summarizing attendance, grades, and upcoming items
- Enrolled courses for the current term
- Grades per subject, rolled up into a computed CGPA
- Per-subject attendance percentage
- Personal class timetable
- View assignments posted by teachers
- Live announcements feed (admin + teacher notices)
- Download resources uploaded by teachers
- Raise queries and track responses
- Profile and account settings

## Data model

| Model | Represents |
|---|---|
| `User` | Base account — email, hashed password, role |
| `Student` / `Teacher` | Role-specific profile, linked to a `User` |
| `Department` | Branch structure students and teachers belong to |
| `Subject` | A course offered within a branch/year |
| `Timetable` | Period-by-day schedule, read by both teacher and student portals |
| `Attendance` | Per-student, per-subject, per-period attendance record |
| `Marks` / `Test` | Scored assessments and the tests they belong to |
| `Notice` | Announcements, scoped by author role |
| `Query` | Student-raised questions and their responses |
| `Resource` | Uploaded files (notes, materials) stored via Vercel Blob |
| `AuditLog` | Recorded trail of admin actions |

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB connection — local, or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier is enough)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local` — see [Environment variables](#environment-variables) below.

### 3. Seed sample data (optional but recommended)

```bash
npm run seed             # creates a default admin, teacher, and student login
npm run seed:subjects    # seeds departments, subjects, and per-department teachers
npm run seed:students    # bulk-seeds a class of students per department/section
npm run seed:timetable   # generates a timetable for every department
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`. Sign in with a seeded account (see below).

## Environment variables

Set these in `.env.local` for local development, and in your hosting provider's project settings for deployment.

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string, e.g. `mongodb://localhost:27017/college-erp` or an Atlas URI |
| `JWT_SECRET` | Yes | A long random string (32+ characters) used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | No | Token lifetime, e.g. `1d`, `7d`. Defaults to `1d` |
| `NODE_ENV` | No | `development` / `production` |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Vercel Blob token, needed for teacher-uploaded resources and assignment attachments. Auto-injected on Vercel once a Blob store is connected (Storage tab); for local dev, copy it from that store's `.env.local` tab in the Vercel dashboard |

Optional overrides for the base seed script (`npm run seed`):

`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_TEACHER_EMAIL`, `SEED_TEACHER_PASSWORD`, `SEED_STUDENT_EMAIL`, `SEED_STUDENT_PASSWORD`

## Seeding sample data

Running `npm run seed` with no overrides creates:

- **Admin** — `admin@college.edu` / `admin123`
- **Teacher** — `teacher@college.edu` / `teacher123`
- **Student** — a CSE, year 2 student with an auto-generated roll-number email / `student123`

For a fuller dataset (multiple departments, sections, and a real timetable), also run `seed:subjects`, `seed:students`, and `seed:timetable` in that order — each depends on data the previous script creates.

> The login page also ships with a **quick-login panel** for convenience during this early, no-real-users phase of the project — it will be removed before onboarding real users.

## Project structure

```
src/
├── app/
│   ├── (auth)/login/     # Public login page
│   ├── admin/            # Admin portal pages
│   ├── teachers/         # Teacher portal pages
│   ├── student/          # Student portal pages
│   ├── api/              # API routes (auth, admin, teachers, students, ...)
│   └── dashboard/        # Legacy routes, kept for redirect fallback only
├── components/
│   ├── admin/ teacher/ student/   # Portal-specific components
│   ├── navbar/ sidebar/           # Shared navigation shells
│   ├── shared/                    # Cross-portal components (PageHeader, EmptyState, ...)
│   └── ui/                        # Low-level UI primitives
├── hooks/                # Shared hooks (useFetch, etc.)
├── lib/                  # DB connection, auth, grading/academic logic, utils
├── models/                # Mongoose schemas (13 models)
├── types/                 # Shared TypeScript types
└── middleware.ts          # Auth verification and route protection

scripts/                   # One-off seed scripts (npm run seed:*)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest test suite |
| `npm run seed` | Seed a default admin, teacher, and student |
| `npm run seed:students` | Bulk-seed students across departments/sections |
| `npm run seed:subjects` | Seed departments, subjects, and teachers |
| `npm run seed:timetable` | Generate a timetable for every department |

## Testing

```bash
npm test
```

Vitest covers the logic most worth protecting against regressions: password rule validation, grade/CGPA calculation, and academic-year/roll-number logic (`src/lib/*.test.ts`).

> Note: don't run `npm run build` while `npm run dev` is running against the same `.next` folder — the two build outputs aren't compatible and will corrupt the dev server's build. Use `tsc --noEmit`, `eslint`, and `npm test` for day-to-day verification instead; reserve `npm run build` for a full production check.

## Deployment

The project auto-deploys to [Vercel](https://vercel.com/) on every push to `main`.

To deploy your own instance:

1. Push the project to GitHub and import it into Vercel.
2. Add the environment variables from [above](#environment-variables) in the Vercel project settings.
3. Connect a Vercel Blob store (Storage tab) if you need file uploads to work.
4. In MongoDB Atlas, add `0.0.0.0/0` under Network Access (or restrict to Vercel's IP ranges) so the deployed app can reach the database.
5. Deploy — API routes run on Node.js.
