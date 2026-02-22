# College ERP

A production-ready College ERP web application with role-based access (student, admin), built with Next.js (App Router), MongoDB (Mongoose), and JWT authentication.

## Features

- **Student**: Login, dashboard with overall and subject-wise attendance, weekly timetable, upcoming tests, notice board.
- **Admin**: Dashboard, manage students, add/edit attendance, timetable, tests, and post notices.

## Tech stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API routes, Mongoose, MongoDB
- **Auth**: JWT (HTTP-only cookie), bcrypt password hashing

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example env file and set values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

- `MONGODB_URI` – MongoDB connection string (e.g. `mongodb://localhost:27017/college-erp` or your Atlas URI).
- `JWT_SECRET` – A long random string (min 32 characters) for signing JWTs.
- `JWT_EXPIRES_IN` – Optional; default `1d`.

### 3. Seed (optional)

Create a default admin and student for local testing:

```bash
npm run seed
```

Defaults:

- **Admin**: `admin@college.edu` / `admin123`
- **Student**: `student@college.edu` / `student123`

Override with env vars: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_STUDENT_EMAIL`, `SEED_STUDENT_PASSWORD`.

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`. Sign in with the seeded admin or student.

## Deployment

### Build

```bash
npm run build
```

### Run production

```bash
npm start
```

### Deploy to Vercel

1. Push the project to GitHub and import it in Vercel.
2. Add environment variables in the Vercel project:
   - `MONGODB_URI` (e.g. Atlas connection string; allow your Vercel IP or use `0.0.0.0/0` for Atlas network access).
   - `JWT_SECRET` (strong random string).
3. Deploy. API routes run on Node.js; ensure MongoDB is reachable from Vercel.

### MongoDB Atlas

- Create a cluster and get the connection string.
- In Network Access, add `0.0.0.0/0` (or restrict to your deploy host IPs).
- Use the connection string as `MONGODB_URI` (replace `<password>` with your DB user password).

## Project structure

```
src/
├── app/              # App Router pages and API routes
├── components/       # UI and feature components
├── lib/              # DB, auth, utils
├── models/           # Mongoose models
├── types/            # Shared TypeScript types
└── middleware.ts     # Auth and route protection
```

## Scripts

- `npm run dev` – Development server
- `npm run build` – Production build
- `npm start` – Run production server
- `npm run lint` – Run ESLint
- `npm run seed` – Seed admin and student users
"# college-erp" 
