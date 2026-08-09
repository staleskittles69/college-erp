# College ERP — Claude Guide

## Who I'm working with
The user is brand new to coding (knows basic HTML/CSS only). They vibe code and learn by reverse engineering the output. Keep explanations short, plain English, and jargon-free.

## What this project is
A college ERP system with three user roles, each with their own portal:

| Role | Portal URL | Status |
|------|-----------|--------|
| Admin | `/admin` | Built ✅ |
| Teacher | `/teachers` | Built ✅ (redesigned with hierarchical student nav) |
| Student | `/students` | Built ✅ (orange/white theme) |

Single login at `/login` → middleware auto-routes each role to their portal.

## How we build
Every feature is built full-stack from the start — UI and API together. No placeholder pages, no mock data. When adding anything new, wire it to the real database immediately.

## Key rules
- **No unsolicited edits** — only change code when explicitly asked
- **Keep components isolated** — admin, student, and teacher code must not mix
- **Don't touch** `src/app/dashboard/` — legacy routes kept for redirect fallback only
- **New features get discussed first** — before building anything new (not bug fixes, not tweaks to existing features), talk it through back and forth: what it should do, edge cases, whether there's room to make it better. Don't jump straight to implementation off the first description.

## Building things well
When asked to build or improve a feature, prioritize making it good over sticking to a fixed toolkit. Default to Tailwind and existing packages since they're already proven in this codebase, but if a new package or a different approach genuinely makes the requested feature better, use it — just say what you added and why. Don't let a style preference get in the way of the right solution.

## Verification workflow
Running `npm run build` while the dev server (`npm run dev`) is up corrupts `.next` for that dev server (dev and prod builds aren't compatible in the same folder) — that's what caused the `__webpack_modules__ is not a function` crash. So:
- Day-to-day, verify changes with `npx tsc --noEmit`, `npx eslint <files>`, and `npm test` — none of these touch `.next`, so they're always safe to run alongside the dev server.
- Only run `npm run build` when the user says they're done for the day / logging off. After it, clear `.next` (`rm -rf .next`) and tell them to restart `npm run dev` next time they start working.

## Deployment workflow
Project is hosted on Vercel at `college-erp-olive.vercel.app` (GitHub repo `staleskittles69/college-erp`, auto-deploys from `main`). User is building solo with zero real users right now, and hosted specifically so they don't have to keep running `npm run dev` locally to check work. Because of that:
- After a change is verified (`tsc`/`eslint`/`test` clean), commit and push to `main` by default so it deploys — don't assume the user wants to review locally first unless they ask to.
- Local dev server checks are still useful mid-task (e.g. testing a UI change before it's finished), but the live Vercel URL is the primary place the user actually looks at the result.
- This is a "solo builder, deploy freely" phase — revisit this default once real users are on the system (see security/hardening notes from the production scan, e.g. the quick-login panel on `/login`, which is intentionally left in for now).

## Auth flow
1. User logs in → `/api/auth/login` sets JWT cookie
2. Client redirects to `/dashboard`
3. `middleware.ts` reads cookie → redirects to role's portal
4. Logout: POST to `/api/auth/logout` → clears cookie → redirect to `/login`

## Skills policy

Do not invoke any skills unless explicitly asked. No automatic skill loading.  