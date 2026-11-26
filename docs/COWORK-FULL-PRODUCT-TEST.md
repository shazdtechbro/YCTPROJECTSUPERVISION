You are my browser-based product QA and deployment assistant. Use my authenticated browser to access Vercel, Firebase, Supabase and GitHub where available. Work autonomously through the entire plan; do not stop after inspecting the homepage. Test the real deployed product, not mock screens.

Site: https://project-supervision-system.vercel.app/
Repository: https://github.com/shazdtechbro/YCTPROJECTSUPERVISION
Branch: main
Required application version: latest main containing commit 97cf7aa and the subsequent public-logo middleware fix. Resolve and record the latest full main SHA from GitHub before testing.

The coding assistant has pushed fixes and verified a production build, 25 API/middleware regression tests with simulated Firebase services, and 12 local browser checks across 320/375/768/1440px. Those checks do NOT establish production account, database, storage, rules or environment readiness. Verify those independently. The deployment before this fix failed and the public URL was serving an older successful deployment.

AUTHORIZATION AND DATA HANDLING
I authorize you to create clearly labelled QA accounts, projects, submissions, comments, grades, extensions and defense dates; inspect deployment logs; and correct necessary Firebase/Supabase configuration and Vercel environment bindings for this application. Use only your own QA records for mutations. Do not edit real student records, broaden database/storage access, delete production data, rotate existing credentials, or change billing without asking. Never reveal passwords, keys, service-account JSON, tokens, cookies or secret environment values in chat, screenshots or reports. Enter existing credentials directly in the relevant secure settings fields. Do not email or message people. If access or approval is genuinely missing, finish independent tests and report the exact blocked operation.

1. VERIFY THE DEPLOYMENT AND CONFIGURATION FIRST
- In Vercel, locate shaz-d-techbros-projects / project-supervision-system. Verify that the latest Production deployment is built from main at the required commit (or a newer commit containing it). Record deployment ID, Git SHA, status and production alias. An HTTP 200 homepage alone is insufficient.
- If that deployment failed, read and retain a redacted build log, identify the precise failure, repair configuration if appropriate and redeploy the correct commit. Do not promote an older successful deployment as the fix. Report code failures with file/line details rather than hiding build/type errors.
- Verify Production and Preview environment scopes for the Firebase client variables: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID. Confirm the Firebase project matches the application; public Firebase identifiers are not authorization controls.
- Verify server-only FIREBASE_SERVICE_ACCOUNT_KEY is valid service-account JSON for that project. Do not expose it or prefix it NEXT_PUBLIC_. Check Firebase Admin operations through actual workflows.
- Verify NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and server-only SUPABASE_SERVICE_ROLE_KEY point to the same Supabase project. Never expose the service-role key in a browser bundle.
- Configure any missing values securely using the existing project settings. Redeploy after changing NEXT_PUBLIC_* values, because they are compiled into the client bundle. Check the subsequent deployment's status and SHA.
- In Firebase Authentication, confirm Email/Password is enabled. Confirm the production site and intended authentication domains are authorized. Google sign-in, if enabled, must not confer a staff role on an unprovisioned account.
- Check browser console, network failures, Vercel runtime logs, Firebase errors and Supabase errors throughout the tests. Distinguish application defects from missing permissions/configuration.

2. FIREBASE AND SUPABASE RULES THAT MUST BE FOLLOWED
Use the repository's exact main-branch rules as the source of truth:
https://github.com/shazdtechbro/YCTPROJECTSUPERVISION/blob/main/firestore.rules
Indexes:
https://github.com/shazdtechbro/YCTPROJECTSUPERVISION/blob/main/firestore.indexes.json
Firebase deployment configuration:
https://github.com/shazdtechbro/YCTPROJECTSUPERVISION/blob/main/firebase.json

Vercel deployments do NOT publish Firestore rules or indexes. Compare the deployed Firebase rules against these files. If they differ, publish the reviewed repository rules/indexes to the matching Firebase project using authenticated Firebase tooling, e.g. `firebase deploy --only firestore:rules,firestore:indexes --project <verified-project-id>`, or the console for rules and equivalent index configuration. Wait for required indexes to become ready and retry affected queries. Never replace rules with `allow read, write: if true` or weaken them to make tests pass.

Required policy:
- Roles and departments originate in Firebase Admin custom claims; students cannot modify role/department/assignment/matric/email through client Firestore writes.
- Project reads are restricted to its lead and partners, its assigned supervisor, and its own department HOD.
- Project and submission creates/updates/deletes go through authenticated server APIs. Direct client writes must be denied, especially topic approval, chapter status, grades, final approval and member assignment.
- Audit activity is server-written and readable only by authorized project participants/HOD.
- Users can read their own notifications and mark only their `read` field; clients cannot create or rewrite notification content.
- The matric index is server-only and enforces one matric number per account.
- The supervisor directory API returns supervisors only for the caller's department.
- Supabase `submissions` bucket stays PRIVATE, RLS enabled, with no public/anon/authenticated direct-access policies. Firebase users do not have a Supabase auth identity. Upload/download must use server-authorized signed URLs. Service-role access stays server-only. Never make the bucket public.
Verify allowed operations AND denial cases. Record rule publication/version evidence without secrets.

3. CREATE AN ISOLATED QA COHORT
Create identifiable accounts such as `QA <run timestamp> Lead`, `Partner`, `Outsider`, `Supervisor A`, `Supervisor B`, `HOD A`, `HOD B`. Use email addresses I control or an approved QA mailbox domain; do not claim unrelated real email addresses. Use unique strong passwords, retained securely outside the report. Choose two real department options from the application's dropdown.
- Lead and Partner: Department A. Outsider: Department B.
- Supervisor A / HOD A: Department A. Supervisor B / HOD B: Department B.
- Add another Department A student if needed for duplicate-assignment and partner tests.
Use unused matric numbers matching F/HD/24/3211001. Verify F, D and P (full time, distance learning and part time), ND/HD, two-digit year, seven-digit identifier, lowercase normalization, and rejection of malformed numbers. Record only non-secret test account labels/UIDs/matric numbers in the report.
IMPORTANT: Staff self-signup is intentionally allowed. Do NOT add hardcoded staff emails, email-domain allowlists, invitations or institutional verification. A student account's existing role must remain immutable; signing in does not allow choosing another role. Firebase must reject reuse of an already registered email. An entirely new account may choose Supervisor or HOD at signup under the owner's explicit product policy. Report that policy accurately; do not silently change it.
Use separate browser profiles/incognito contexts for each role to avoid shared-cookie confusion.

4. TEST THE FULL PRODUCT LIFECYCLE
For every numbered scenario record the account, inputs, expected result, actual result, screenshot(s), browser/network errors and PASS/FAIL/BLOCKED status. Reload or log out/in after important writes to prove persistence.

A. Registration and login
- Create students with matric numbers, staff with unique emails, and correct departments. Validate required fields, duplicate email/matric, malformed matric, wrong password and unprovisioned accounts.
- Sign a student in by matric + password and again by email + password; verify the same UID/project/role. Wrong credentials must not create a session.
- Verify a student cannot enter supervisor/HOD routes or grant themselves staff privileges. Verify sign-out invalidates access. If a legacy student lacks matric data, test the dashboard matric registration form and lecturer identifier update.

B. Supervisor selection and project creation
- Lead's dashboard shows every registered Department A supervisor, including additional Department A supervisors if created; Department B supervisors must be absent.
- Select Supervisor A, enter a topic and description, add Partner by matric, submit.
- Expected: one pending-topic project, membership on both students' profiles, Supervisor A notified, Partner notified, supervisor dashboard counts updated, and a pending-topic activity entry. Reload all accounts.
- Partner sees the same project on their own dashboard and the notification that Lead added them. Their project access is real, not merely a notification link.
- Test duplicate partner entries, self-addition, nonexistent matric, more than four partners, partner already assigned to another project, and cross-department partner/supervisor. No partial projects or assignments should remain after rejection.
- Lecturer dashboards, project lists and roster identify students by matric number rather than student email. The project workspace shows the team.

C. Topic review cycle
- Supervisor A can mark Pending, Decline with feedback, and Approve. Check persistence, activity log and notifications for both Lead and Partner.
- Decline first. Lead revises/resubmits; expected Pending and supervisor notification. Test the UI's lead/partner permissions and document any mismatch between visible actions and server authorization.
- Pending/declined topics cannot submit chapter work. Approve, then verify chapter submission becomes available.
- Outsider and unrelated supervisor/HOD cannot make a decision or access the project.

D. Five-chapter submission, feedback and grading cycle
- Verify the chapter breakdown: Introduction; Literature Review; Methodology; System Design and Implementation; Summary, Conclusion and Recommendations.
- Upload a small real QA PDF/Word file for Chapter One. Test a permitted image if useful; test disallowed file type and >25MB file. Verify progress indicator, durable submission metadata and private storage.
- Supervisor downloads the authorized file, adds written feedback and a grade from 0–100, and requests changes. Students see saved feedback, grade and review status after reload.
- Student responds through the Feedback comment form, uploads a revision and receives approval. Both project students must have authorized upload/download access and feedback notifications.
- Repeat for chapters Two through Five. Expected stage progression: Not started -> In review -> Changes requested or Approved; each approved chapter contributes 20%.
- Validate grades below 0/above 100 and invalid feedback payloads are rejected. An old/superseded chapter review must not overwrite the newer chapter's status. Check concurrent submissions/reviews where feasible.
- Test audit entries for submissions/reviews and persistence after session changes. A file link or direct Storage API request without authorization must not expose private objects.

E. Extension decisions
- Student requests a sensible future deadline extension. Supervisor gets notified; both students see Pending in the activity/workflow UI.
- Decline one request with a note. Verify the existing deadline is unchanged and decision visible to the team.
- Request another extension and Approve with a note. Verify the new deadline persists and approval is logged/notified.
- Test malformed/past dates, a date not later than the current deadline, duplicate pending requests, and attempts by students/unrelated supervisors to grant an extension. Report any discrepancy; do not hide it by using only valid inputs.

F. Final submission and approval
- Attempt final submission/approval before all five chapter stages are approved: expected rejection, no partial approval, no incorrect counters.
- With all five approved, upload a final project and approve it as Supervisor A. Expected finalApproved=true, completed/approved status, 100% progress, team notification and review/activity history.
- Verify ordinary chapter edits cannot silently invalidate a finalized project. If reopening final approval is supported, test the authorized flow and dashboard count adjustments.

G. Defense date and HOD oversight
- Supervisor sets a future defense date through the workspace. Verify both students and Department A HOD see the same date after reload; test unauthorized changes.
- Test no defense date, upcoming defense, past defense without final approval, and completed project. Use only QA projects and documented date overrides; do not change the production server clock.
- Verify HOD A's department project/supervisor/report views reflect the QA data and HOD B cannot see it.
- The current product schedules a defense date and tracks final approval; it does not promise a defense-result/attendance/certificate module. Do not pretend such a feature exists. Report the actual supported lifecycle and any requested product gap separately.

5. MOBILE, BRANDING AND EXPERIENCE
- Repeat critical account, topic, partner, upload, review/feedback, extension and defense screens at 320, 375/390, 768 and 1440px. Capture screenshots at meaningful before/after states, not just the homepage.
- Check horizontal overflow, wrapped topic/team text, notification menu bounds, sidebar opening/closing, tabs, dialogs, table scrolling, touch controls, validation/toasts, keyboard obstruction and scrolling to action buttons. Phone inputs should render at least 16px and avoid iOS zoom; no clipped labels/actions.
- Confirm YABATECH branding against https://www.yabatech.edu.ng/style.css: Roboto, green #006600, gold #fdc800; the app uses locally bundled Roboto and logo. Check font requests load successfully and contrast/readability on phones.
- Capture network/console evidence for broken links, missing routes, failed uploads, permission denials, empty-state/loading errors and unexpected crashes. Expected denials are PASS only when the authorized counterpart works too.

6. EVIDENCE AND REPORT BACK TO THE CODING ASSISTANT
Create an evidence folder with a screenshot index, deployment evidence, redacted error logs and a scenario-results table. Use filenames like `C03-supervisor-declines-topic-375px.png`; never capture visible credentials or token-bearing URLs. Retain QA records for debugging unless I request cleanup, and list the IDs so cleanup can be done safely later.

Return a report I can paste into the original coding-assistant chat containing:
- Exact tested production URL, full Git SHA, deployment ID/status and test time (Africa/Lagos).
- Which environment/config/rule changes you made; whether each was actually published/applied/redeployed.
- Per-scenario PASS/FAIL/BLOCKED/NOT TESTED results and evidence links.
- Test accounts/QA record IDs without passwords or secrets.
- Each defect's severity, account role, exact reproduction steps, expected vs actual result, affected URL/API, sanitized request/response status, console/runtime error and screenshot.
- Any code-location hints from GitHub; preserve observations instead of inventing a diagnosis.
- Whether Firebase rules/indexes were verified and deployed, private Storage denials passed, staff self-signup remained as requested, and mobile/branding checks passed.
- Outstanding decisions/credentials/access and precise next actions.

Do not say "fully tested" or "all working" if scenarios are blocked or skipped. A successful Vercel build, public-page screenshot or mocked test is not evidence that live authenticated product workflows passed. Continue until the entire checklist is completed or a concrete access/decision blocker leaves no useful independent work.
