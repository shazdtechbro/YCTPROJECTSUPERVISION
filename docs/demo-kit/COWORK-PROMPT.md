# Paste this prompt into ChatGPT Cowork

Prepare my already deployed application for a job-application demo. Complete the setup and return actual working credentials; a plan alone is not enough.

Live application: https://project-supervision-system.vercel.app/

Demo files and optional automation: https://github.com/shazdtechbro/YCTPROJECTSUPERVISION/tree/doc/docs/demo-kit

The video is 90 seconds total: approximately 30 seconds introducing myself, then 60 seconds showing the app. I need convincing, populated workspaces, not empty dashboards.

## Outcome

Create exactly TWO new demo accounts, both in Computer Science:

1. Student: Shazily Sanni (Demo). Use an unused valid matriculation number such as F/HD/26/9991102. If that number is already taken, choose another unused seven-digit identifier; do not reset another person's account. Student signup/login uses matriculation number and password, not an email inbox. Full name and department are project-profile details.
2. Lecturer: Dr. Amina Bello (Demo), with Role set to Supervisor. Use a unique demo email such as lecturer.demo.<random-suffix>@yct-demo.invalid if accepted by the application. It is a password account, not Google sign-in. Generate a distinct, strong password for each account and return both privately in your final response. No access to an email inbox is required for the current password-signup flow.

Give these accounts a single shared project:

Topic: CampusFlow: Digital Project Supervision and Progress Tracking
Description: A role-based workspace for student project supervision, private document uploads, chapter approvals, revision feedback, activity history and progress tracking.

Use the existing live app's normal registration and supervision flows. Creating these demo records is authorised. No source-code change, new deployment or admin account is needed. Use isolated browser sessions for student and lecturer when possible; otherwise sign out completely between roles.

## Provided sample PDFs

Download the six PDFs from the kit's `pdfs` directory. Direct download base:
https://raw.githubusercontent.com/shazdtechbro/YCTPROJECTSUPERVISION/doc/docs/demo-kit/pdfs/

- proposal.pdf
- chapter-1.pdf
- chapter-2.pdf
- chapter-3.pdf
- chapter-4-v1.pdf
- chapter-4-v2.pdf

They contain readable demonstration material, not empty or fake file links. Use these actual PDFs for submissions. Their contents are explicitly sample material and do not invent research participants or measured institutional results.

## Populate the workflow

1. Register the lecturer, then the student. Sign in to both and confirm their assigned roles and department.
2. As the student, select Dr. Amina Bello (Demo) from departmental supervisors and propose the topic and description above. Do not add partners; only two accounts are needed.
3. As the lecturer, approve the topic with feedback: “The scope is clear and suitable. Proceed with the chapter-by-chapter implementation and document the review workflow.” Set the proposal presentation date to 14 days from the actual setup date.
4. As the student, upload proposal.pdf with Document category Proposal. The app supplies the project topic; do not invent another title field.
5. As lecturer, approve the proposal and write: “Good project focus. The expected user roles and workflow are clearly defined.” Do not award a numeric grade.
6. Upload chapter-1.pdf, chapter-2.pdf and chapter-3.pdf to Chapter One, Two and Three respectively. Approve each as lecturer with meaningful comments on the problem/scope, literature-review themes and architecture/milestone rules. The project should now show 60%, with three of five chapters approved.
7. Upload chapter-4-v1.pdf to Chapter Four. As lecturer, choose Changes requested, write “Please explain the version-history interface and how private document access is authorised. Upload a revised Chapter Four before the revision date.” Set the revision due date seven days from setup. Save the review. No numeric grade belongs at this stage.
8. In that submission's feedback discussion, add a student reply: “Thank you. I have added the version-history explanation and the access-control details in the revised draft.” Add a lecturer reply: “That addresses the requested scope. Please submit the revised PDF so I can review the current version.”
9. As the student, use Upload revision beside the requested changes and upload chapter-4-v2.pdf to Chapter Four. Leave this newest revision Pending review. Keep Chapter Five Not started. Do not approve Chapter Four's latest revision or grant final approval; the pending revision is the live action I will show while recording.
10. Record an open activity titled “Prepare Chapter Five and final demonstration,” with a description about drafting conclusions and preparing the walkthrough; Medium priority, due in ten days.
11. Record another activity titled “Confirm project scope and chapter plan,” with a short meaningful description, and mark it Done. The UI calls these Activity log / New activity; the underlying endpoint names may still say tickets.
12. As student, request a deadline extension to ten days from setup. As lecturer, approve it with “Extension granted to complete the final documentation and demonstration preparation.” Proposal date and revision date remain separate values.

Do not manufacture old timestamps. Let real registration, uploads, reviews and comments create the activity and notifications naturally.

## Verify the finished demo

- Sign out and back in using the actual student matriculation number/password and lecturer email/password. Do not return merely proposed credentials.
- Student dashboard: correct linked lecturer/topic, 60% completion, Chapters One–Three approved, Chapter Four In review, Chapter Five Not started, meaningful activity and notifications.
- Student Feedback tab: lecturer comments and the Chapter Four revision date are visible; select the appropriate submission/version when necessary.
- Files and version history: both Chapter Four PDFs can be found. Actually open/download a PDF as lecturer and verify its contents, not just the presence of a download icon.
- Lecturer dashboard: the project is present, one newest revision awaits review, and workload/activity are populated. Open that revision's review workspace and confirm the actions are available without saving an approval.
- Deadline extension is approved; at least one manual activity is open and one is Done.
- No numeric grade or final approval is awarded before all five chapters are approved.

Capture useful screenshots of the student dashboard, Feedback tab, Chapter Four file history and lecturer review screen. Do not show passwords in screenshots. Leave the demo at 60% with the revised Chapter Four pending.

## Optional automation

The kit includes `seed_live.py`, which performs these steps through the deployed application's ordinary authenticated APIs and the public Firebase password-auth API. It does not need Firebase admin credentials, a Vercel token or a service-role key. The script has been syntax-checked but has NOT been executed against production because the originating cloud session could not reach the live site.

If you can execute Python with outbound HTTPS, download the kit, put it in `/workspace/demo-setup` (or change its ROOT constant), and run `python /workspace/demo-setup/seed_live.py`. Keep the `pdfs` subdirectory alongside it. It obtains the public browser configuration, creates two accounts, uploads the PDFs and records the workflow. It stores resumable state and the new credentials privately in `demo-state.json`; do not publish this file. If requests fail, inspect their actual response and resume using the same state rather than creating more accounts. If automation is unavailable, complete the browser steps above. Verify actual browser logins and file downloads either way.

## Final handover to me

Return:

1. Site URL.
2. Student full name, matriculation number, password and dashboard/project URL.
3. Lecturer full name, email, password and dashboard/project URL.
4. The seeded project state, PDF count, pending review, progress percentage, feedback, activities and extension status.
5. Which checks you actually completed, any real failure remaining, and the captured screenshots. Do not call unexecuted checks successful.
6. A 60-second walkthrough: student dashboard and 60% progress; feedback and document versions; lecturer opens the pending Chapter Four PDF and approves it; student refreshes to 80%. Keep approval for my recording rather than performing it during setup.

Then give me this short report to paste back to the coding assistant:
“Demo setup completed on [date]. Student: [matriculation number]. Lecturer: [email]. Project: [ID and URL]. Six PDFs uploaded. Progress: [value]. Chapter Four latest revision: [state]. Activities: [open/done]. Extension: [state]. Verified checks: [list]. Remaining issues: [actual issues or none].”
