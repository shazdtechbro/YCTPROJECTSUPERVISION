# Resume the existing demo — no file chooser needed

Continue the partially completed demo using the two accounts whose credentials are already in our conversation. Do NOT create accounts or another project. The only missing work is PDFs, chapter reviews, feedback discussions and the pending Chapter Four revision.

App: https://project-supervision-system.vercel.app/
Project ID: XleeJC3EGAIg5gNmbrHL
Student: F/HD/26/9991102
Lecturer: lecturer.demo.7k4q9m@yct-demo.invalid
Use their existing passwords from the earlier setup. Keep them private.

Preserve the approved topic, proposal date 16 November 2026, approved extension to 12 November 2026, existing Open activity and Done activity.

The file chooser is unnecessary. The app already exposes authenticated APIs for signed uploads, submission records, reviews and comments. Use ONE of these prepared continuations:

## Option A: Python terminal (preferred when execution tools have network access)

Download these files into one directory:
- https://raw.githubusercontent.com/shazdtechbro/YCTPROJECTSUPERVISION/doc/docs/demo-kit/resume_existing.py
- The six PDFs under https://raw.githubusercontent.com/shazdtechbro/YCTPROJECTSUPERVISION/doc/docs/demo-kit/pdfs/ (put them in a `pdfs` subdirectory).

Set `YCT_DEMO_STUDENT_PASSWORD` and `YCT_DEMO_LECTURER_PASSWORD` for the process using the credentials already provided, then run `python resume_existing.py`. It uses only Python's standard library and accepts passwords through environment variables or private prompts. It logs in to the existing accounts, verifies their ownership of this exact project and performs normal application API requests. It uses a private `resume-state.json` for resuming, and does not save passwords in that state.

## Option B: Browser JavaScript when the terminal has no network access

If your browser tools support executing JavaScript in a page, use that capability rather than the operating-system file chooser:

1. Sign in as the EXISTING student in the app and let the page finish loading.
2. Load the source of:
https://raw.githubusercontent.com/shazdtechbro/YCTPROJECTSUPERVISION/doc/docs/demo-kit/resume_existing.browser.js
3. Execute that source in the deployed app's page context. It defines `window.resumeCampusFlowDemo`. It embeds all six PDFs, so there is no local file picker or Downloads page to access.
4. Await:

```js
await window.resumeCampusFlowDemo({
  studentPassword: /* the existing student's password from this conversation */,
  lecturerPassword: /* the existing lecturer's password from this conversation */
});
```

Supply actual string values privately through your execution tool. The script signs in through the normal Firebase password-auth API, mints the app's normal sessions, uploads real PDF bytes directly using the app-issued signed storage links, and saves the normal submission and review records. It does not create accounts or modify source/configuration. Progress markers contain submission IDs, not passwords. A successful return reports `progress: 60`, `verifiedPDFs: 6` and `chapter4: "pending_review"`.

Use the browser's supported JavaScript capability only if available. If neither execution route is supported, state that specific limitation; do not repeatedly click the unusable file control or pretend uploads succeeded.

## Expected populated state

The continuation:
- uploads proposal.pdf and approves it;
- uploads Chapters One–Three and approves them with written feedback;
- uploads Chapter Four version 1 and requests changes with comments and a revision date;
- posts student and lecturer discussion replies;
- uploads Chapter Four version 2 as a revision and leaves it Pending review;
- does NOT submit Chapter Five, assign an early numeric grade or grant final approval;
- preserves the existing activities, proposal date and extension;
- checks for 60% progress and verifies lecturer access to all six PDFs.

Run it once, resume with the same progress state if needed, then verify using the actual browser interface. Do not approve the pending Chapter Four revision during setup; that approval is the action reserved for my recording.

Capture the populated student dashboard, Feedback tab, Chapter Four history and lecturer review page. Confirm both existing logins still work. Report the actual PDF count, progress, latest revision state and download checks. Do not call a check successful until it has actually run.

The browser script has passed controlled-service tests covering six PDF transfers, byte-for-byte download verification, 60% progress, a pending revision, comments and a rerun without duplicate submissions or new accounts. The Python script is syntax-checked. Neither continuation has yet been executed against production by the coding assistant because its cloud network still blocks this site's hostname.

Final report to return:
“Existing demo project XleeJC3EGAIg5gNmbrHL completed on [date]. Six PDFs uploaded and [number] verified downloadable as lecturer. Progress [value]. Chapters One–Three [state]. Chapter Four newest revision [state]. Chapter Five [state]. Existing activities and 12 November extension preserved [yes/no]. Both logins verified [yes/no]. Screenshots [list]. Actual remaining issues [list or none].”
