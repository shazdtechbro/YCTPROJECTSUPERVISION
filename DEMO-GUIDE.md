# Digital Project Supervision & Progress Tracking System — Tester's Guide

**Live app:** https://project-supervision-system.vercel.app

This walk-through touches every feature in the order a real project runs:
the lecturer sets up a project, the student works on it, feedback goes
back and forth, milestone status updates itself, and the HOD watches the
whole department. Budget about **15–20 minutes**.

---

## Test accounts

| Role | Email | Password |
| --- | --- | --- |
| **Lecturer / Supervisor** | `shazilysanni@gmail.com` | `#Shazily1` |
| **Student** | `sannishazily@gmail.com` | `#Shazily1` |
| **HOD** (pre-loaded demo dept) | `hod@demo.test` | `demo1234` |

All three are in the **Computer Science** department, so they see the
same projects.

**Tip:** to see the **real-time** parts properly, open the student in a
normal window and the lecturer in a **private/incognito** window (or a
second browser) side by side. Actions in one appear in the other within a
second — no refresh.

---

## Part 0 — Landing page (no login)

1. Open the live URL. You land on the marketing page.
2. Click **Get started** → you reach the sign-up screen. (You don't need
   to sign up — use the accounts above. Sign-up is covered in Part 6.)

---

## Part 1 — Lecturer creates the project

1. Go to **/login**, sign in as the **Lecturer**.
   - You should land straight on the **Supervisor Dashboard** (no
     stuck/loading screen).
2. Left nav → **Projects** → click **New project** (top right).
3. Fill in:
   - **Student email:** `sannishazily@gmail.com`
   - **Title:** e.g. *Automated timetable generator for HND programmes*
   - **Abstract:** any 2–3 sentences (min 20 characters)
   - **Defense date:** pick a date **about 3 weeks from today** (this
     matters for Part 4)
4. Click **Create project**. You get a toast, and the project appears in
   the table.
5. Open the project from the table → you're in the **project workspace**
   with 4 tabs. On the **Overview** tab you can also **set / change the
   defense date** at the bottom.

---

## Part 2 — Student works on the project

Switch to the **Student** account (other window).

1. **Dashboard** now shows a project card with a **milestone banner**
   (green / amber / red), a progress bar, supervisor name and defense
   date, plus a **Recent activity** timeline.
2. Open **My project** (or click the card) → same 4-tab workspace.

### Tickets tab

3. Click **New ticket**. Try submitting with a 1-word title — it's
   **blocked with a validation message**. Fill it properly (title 4+
   chars, details 10+), set a priority, create it.
4. The ticket appears **instantly in the lecturer's window** too (open
   the same project there). Change its status with the dropdown
   (Open → In progress → Done) and watch it sync.
5. Check the **lecturer's notification bell** (top right) — there's a new
   unread dot for "New ticket".

### Submissions tab

6. Click **Upload**. Choose a **PDF or Word file** (drag-drop onto the
   zone also works). Give it a title, pick a type (Chapter draft), upload.
   - You'll see a **real progress bar** while it uploads.
   - It appears in the list as **v1 · Pending review**.
7. Click the **download icon** on the row → the file opens (via a
   short-lived secure link).
8. Upload a second file → it becomes **v2** (version history).
9. The lecturer gets a **"submitted…" notification**.

### Feedback tab

10. Pick a submission from the dropdown → a **comment thread** opens.
    Post a comment. (⌘/Ctrl + Enter also sends.)

---

## Part 3 — Lecturer reviews

Back in the **Lecturer** window, same project:

1. **Submissions tab** → on the student's v1 row, use the status
   dropdown → **Changes requested** (or **Approved**). The student gets a
   **notification** and the badge updates live.
2. **Feedback tab** → pick that submission → reply in the thread. Your
   reply shows up instantly on the student side.
3. **Dashboard** → your **stat cards** now show *Pending reviews*,
   *Open tickets*, etc. — these update in the same write, no waiting.
   The **"Avg response"** card starts showing hours once you've replied
   to a student submission (time from their upload to your first comment).

---

## Part 4 — Watch the milestone engine

The status (On track / Behind / Stalled) is **computed**, not set by hand.

1. As the **Lecturer**, open the project → **Overview** tab → **set
   defense date** to **10 days from today** → Save.
2. The toast tells you the new milestone reason, and the badge flips to
   **Behind** ("Defense in N days, final not approved").
3. The **student's dashboard** and the **supervisor's "Needs attention"**
   list both reflect it.
4. (There's also a nightly job that re-checks every project, and a
   per-project on-the-fly recompute — you don't need to trigger those.)

---

## Part 5 — HOD / department view

Sign in as **`hod@demo.test` / `demo1234`** (there's pre-loaded demo data
so this view is already populated with other supervisors and students).

1. **Department dashboard:**
   - Totals across the department, a **per-supervisor table** with an
     **avg-response** column, and a **30-day activity chart**.
2. **Projects** → toggle between **table and card** views (top right),
   and filter by **On track / Behind / Stalled**.
3. Click a supervisor's name (dashboard table or **Supervisors** page) →
   **drill-down**: their load, responsiveness, and every project with a
   link to its full history (tickets + submissions + feedback = the audit
   trail).
4. **Reports** → 60-day activity chart + milestone distribution bar.

---

## Part 6 — Sign-up & roles (optional)

1. Sign out (avatar menu, top right → Sign out).
2. On **/signup**, create a brand-new account, pick a **role**
   (Student / Supervisor / HOD) and a department.
3. You're taken straight to the matching dashboard. A student with no
   project sees a proper **empty state**, not a blank page.

---

## Things to look for throughout

- **No stuck screens** after login/sign-up — it goes straight to your
  dashboard.
- **Loading skeletons** shaped like the real content (no spinners, no
  layout jump), **retry buttons** on errors, **real empty-state copy** on
  every screen.
- **Toasts** on every create / upload / status change.
- **Light / dark theme** — avatar menu → the sun / moon / monitor row.
  Light is the default.
- **Mobile** — narrow the window: the sidebar collapses into a menu
  button.
- **Access control** — a student can't reach supervisor/HOD pages (and
  vice-versa); the URL just redirects you back to your own dashboard.

---

## Reset

The demo data can be regenerated at any time by the project owner
(`node scripts/seed.mjs`). The two accounts above persist.
