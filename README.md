# Digital Project Supervision & Progress Tracking System

YABATECH HND project. Supervisors run final-year projects, students submit work and
track milestones, the HOD sees the whole department.

**Stack:** Next.js 14 (App Router) · TypeScript (strict) · Tailwind + shadcn/ui ·
lucide-react · recharts · Firebase (Auth / Firestore) · Supabase (Storage) · Vercel (+ Cron).

---

## Getting started

```bash
cp .env.local.example .env.local   # then fill it in (see below)
npm install
npm run dev
```

Optional — local Firebase emulators:

```bash
firebase emulators:start
```

---

## Environment variables

Copy `.env.local.example` → `.env.local`. On **Vercel**, add every key under
**Project Settings → Environment Variables** for **both** the `Preview` and
`Production` environments (Development too if you use `vercel dev`).

### Public — Firebase client SDK (safe to expose)

These ship in the browser bundle by design. They only *identify* the Firebase
project; they are **not secrets**. Security is enforced by
`firestore.rules` and by verified custom claims — never by
hiding these values.

| Key | Notes |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |

### Server-only — Firebase Admin SDK (secret)

| Key | Notes |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **Full service-account JSON, one line.** Never prefix `NEXT_PUBLIC_`. Never commit. On Vercel it lives only in the server environment. Used by `lib/firebase-admin.ts` for session-cookie verification, custom-claims provisioning and privileged reads. |

Generate it at **Firebase console → Project settings → Service accounts →
Generate new private key** and paste the file contents as a single-quoted value.

### Supabase — file Storage

The project is on the Firebase **Spark** plan, so Firebase Storage (Blaze-only)
is not used. Submission files go to a **private** Supabase Storage bucket named
`submissions`; downloads are short-lived signed URLs minted server-side after
the caller is verified.

| Key | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | guarded by Storage RLS, not by hiding |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only, secret** | bypasses RLS; used only to sign download URLs / delete objects |

Setup: Supabase dashboard → **Storage → New bucket** → name `submissions`,
**Private**. **No custom RLS policies are needed** — auth is Firebase, so the
browser has no Supabase identity (`auth.uid()` is always null). Instead every
transfer goes through a one-time, server-minted signed URL:

- upload: `POST /api/submissions/sign-upload` verifies the Firebase session +
  that the caller is the project's student, returns a signed upload URL, and the
  browser PUTs the file straight to Supabase (bytes skip the Vercel function).
- download: `POST /api/submissions/sign-download` verifies read access and
  returns a ~5-minute signed URL.

Keep the bucket Private with RLS **enabled and zero policies** (deny-all for
direct `anon`/`authenticated` access); the service-role key used by
`lib/supabase-admin.ts` bypasses RLS to sign. Client helper:
`lib/storage/submissions.ts`.

---

## Auth & roles

- Students can sign in with matric number and password; email/password remains
  available. Supervisors and HODs create accounts with their own email and
  password and select their role at sign-up.
- On every ID-token change the client POSTs the token to
  `app/api/session/route.ts`, which **verifies it server-side** and mints an
  `HttpOnly` session cookie. The browser never sets an auth cookie itself.
- `middleware.ts` is a presence gate only (the Admin SDK can't run on the edge).
- Real enforcement is `requireRole()` in each route group's server layout
  (`lib/auth/session.ts`) **and** the Firestore rules + Supabase Storage RLS.
- `role` and `department` are **custom claims**, provisioned by the Admin SDK.
  An account with no claims cannot obtain a session (see the 403 in the session
  route).

Roles: `student` · `supervisor` · `hod`.

Public sign-up lets people select Student, Supervisor or HOD. Role and
department are recorded at provisioning and checked on each session. This
self-selected role does not verify that a registrant is employed by the school;
an institutional verification process would be needed to prevent impersonation.
Student matric numbers follow `F/HD/24/3211001` (`F`, `D` or `P`; `ND` or
`HD`; two-digit year; seven-digit identifier).

Students submit a topic to a supervisor in their department and may add up to
four project partners by matric number. Topic decisions, chapter stages,
submission grades and written feedback, deadline extension decisions and
project activity are stored and served through authenticated API routes.

---

## Folder structure

```
app/
  (auth)/login            shared sign-in
  (student)/student/...    role-gated: dashboard, project/[projectId]
  (supervisor)/supervisor/...  dashboard, projects, projects/[id], roster
  (hod)/hod/...            dashboard, projects, supervisors, reports
  api/session             session-cookie mint / clear
components/
  ui/                     shadcn primitives
  shared/                 cross-role: app-shell, notification-bell, status-badge,
                          project-tabs, ticket/submission lists, comment-thread,
                          file-upload, activity-chart, query-state, skeletons
hooks/                    use-paginated-query, use-live-collection, use-async-data
lib/
  firebase.ts             client SDK — Auth + Firestore (NEXT_PUBLIC_*)
  firebase-admin.ts       admin SDK (server-only)
  supabase.ts             client — Storage uploads
  supabase-admin.ts       server — signed URLs / object delete
  storage/submissions.ts  submission upload helper
  auth/                   session (server) + auth-context (client)
  firestore/              typed READ queries — one function per query
  api.ts                  client wrappers for the /api/* mutation routes
  milestone.ts            pure status function (cron + on-the-fly)
  server/                 admin-side batch helpers (stats, notify, activity)
  types.ts                domain model
activity_daily/{id}                per-department daily buckets (HOD chart)
users/{uid}/notifications/{id}     bell feed (API-route-written)
firestore.rules  firestore.indexes.json  firebase.json
```

Route-group folders (`(student)` …) carry the auth + shell layout; the inner
segment (`/student`, `/supervisor`, `/hod`) gives the URL namespace so the three
`dashboard` routes never collide.

---

## Data model (Firestore)

```
users/{uid}                         role, department, (students) supervisorId, projectId
dashboard_stats/{supervisorId}      denormalised counters (API-route-written, in-batch)
projects/{projectId}
  tickets/{ticketId}
  submissions/{submissionId}
    comments/{commentId}
```

- `supervisorId` on student `users` docs → fast roster queries.
- `dashboard_stats` → supervisor & HOD dashboards do **one read**, never a
  fan-out across projects.
- Composite indexes are declared up front in `firestore.indexes.json`
  (supervisorId+status+lastActivityAt, department+milestoneStatus+…,
  role+supervisorId+displayName, collection-group projectId+createdAt and
  status+createdAt for tickets/submissions).

---

## Query performance rules (enforced by `lib/firestore`)

- One exported function per query; every query carries a typed converter
  (`lib/firestore/converters.ts`) — components never touch raw snapshot data.
- List views are cursor-paginated (`startAfter`, `Page<T>` / `PageParams`) —
  **no `offset`**.
- No query inside `.map()` — denormalised fields cover list rendering.
- `onSnapshot` lives only in `lib/firestore/listeners.ts`, is attached from the
  single active view via `useLiveCollection`, and is unsubscribed on unmount.
- Every mutation goes through an `/api/*` route that updates `dashboard_stats`
  and `activity_daily` **in the same batch** as the ticket/submission/comment
  write. Milestone status is recomputed there and by `/api/cron/update-status`
  (Vercel Cron, daily) — never on the client.

## Loading / error / empty

Every data-fetching view renders three explicit states via `<QueryState>`:
layout-matched `Skeleton` (no layout shift), `<ErrorState>` with a **retry**
button, `<EmptyState>` with real copy. Write actions fire a `sonner` toast.

---

## Deploy

### Vercel

- Framework preset: **Next.js** (`vercel.json` pins it). Region `fra1`.
- Add all env vars for **Preview** and **Production** (table above). The service
  account key goes in the **server** scope only.
- Push → Preview deploy per branch; merge to `main` → Production.

### Firebase (rules / indexes / functions)

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Converting Stitch screens

Stitch HTML is a design reference, not code to paste. For each screen: create the
route under the matching role group and rebuild it with `components/ui` +
`components/shared` + the `lib/firestore` query functions and the three
loading/error/empty states. The scaffolded pages already follow this pattern.
