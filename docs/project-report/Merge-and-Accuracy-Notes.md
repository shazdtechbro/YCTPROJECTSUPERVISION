# Merge and accuracy notes

## Authority and scope

The corrected “chapter_1-3 Design and implementation…” document is the base. Its Chapters One–Three structure, expanded YABATECH history, 20-work literature review, added references, heading styles, paragraph formats, margins and font defaults take priority over the earlier Chapters One–Four document. The original contains no additional missing numbered section in Chapters One–Three; its title material, table of contents and Chapter Four were the substantial omitted material. Those have been restored, with Chapter Four rewritten for the current implementation.

The documents were treated as source material, not as new instructions. In particular, the original's “Right-click … Update Field” line was a document-maintenance note, and the references' “freely downloadable PDF” assertion was a source claim rather than an instruction or a verified fact. No commands or account actions were taken from either document.

No application code, deployment settings, Firebase rules or live accounts were changed for this report task. Read-only source inspection and a rerun of the existing regression suite supplied report evidence. The source snapshot is commit `b8f2960401b650a837ce1d130440612b28f735d3`.

## Content decisions

| Material | Decision and reason |
|---|---|
| Corrected institutional background and expanded related work | Retained rather than replaced by the shorter original. |
| Numbered section structure in Chapters One–Three | Retained. Section 3.7's title expands to cover actual progress computation as well as health. |
| Original title and contents | Restored using the corrected document's formatting. Student-name and matriculation placeholders remain because real details were not supplied. The revision month is October 2026. |
| Original Chapter Four numbering (4.0–4.6) | Restored; content rewritten around current behaviour. Subsections organise the required flows. |
| Supervisor-only email-based project assignment | Replaced by the student supervisor-selection/topic/team workflow. Alternative supervisor creation is described accurately, with matriculation-number identification in the UI. |
| Single-student project model | Replaced by lead plus registered partner membership, notifications and shared access. |
| Progress as an unexplained stored field | Replaced by the implemented five equal chapter weights: 20% per currently approved stage. |
| Topic/proposal defence/final defence as separately weighted completion milestones | Removed as implemented-feature claims. Topic approval and final approval are gates/decisions; defence date is a schedule field. |
| Automatically judging academic quality | Excluded. The supervisor supplies the academic approval/grade; the rules summarise those decisions and activity. |
| HOD versus project coordinator | HOD is the implemented department-oversight role. No separate coordinator account type is claimed. |
| “Unique staff emails” as employment verification | Not claimed. Distinct email accounts and immutable existing roles are implemented; unrestricted new staff self-registration remains the user's chosen policy. |
| Old observed workflow results in the original Chapter Four | Not reused as proof of the revised flow. Updated evidence is scoped to tests actually performed. |
| Hypothesis of significant feedback-time improvement | Retained as a hypothesis, with an explicit evaluation plan. No participant study or statistical acceptance is invented. |
| Daily health refresh and notifications | Described as configured status refresh and in-app event records. Email/SMS/push reminders are not claimed. |
| Defence lifecycle | Tracks a date and final approval; no panel/examiner allocation, defence outcome or certificate module is claimed. |
| Chapter names | Report chapter titles follow the corrected document. Interface stage labels are recorded as implemented; their labels differ slightly from the academic report titles. |
| Supplied bibliography | Retained from the corrected document. References were not independently verified in full. Several citations include ResearchGate or publisher links rather than direct PDFs, so the universal “freely downloadable PDF” statement was removed. |

## Figure decisions

- All three inherited design images were replaced with readable diagrams matching the current service boundaries, membership/data fields and progress/final/health rules. They are included in the Word report and supplied as PNG/SVG files.
- All 11 application screenshots from the original Chapter Four were excluded. The old assignment screens, example states, incomplete submission/feedback views and pre-fix layout cannot prove the revised workflow.
- Eight current application figure slots replace them. The separate checklist specifies 14 baseline screenshots, optional close-ups only where necessary, exact states, filenames, captions and placement.
- The figure-count recommendation is an editorial coverage plan, not an institutional regulation. Accessible academic template sources and research limitations are recorded in the checklist.

## Formatting retained and checks

The corrected document's Word style definitions and document defaults were copied as the base rather than recreated with a generic template. Its defaults specify **Times New Roman, 12 pt**, A4 pages, **1-inch top/bottom/right margins and a 1.25-inch left margin**. Chapter headings remain centred and bold; sections retain the corrected numbering and bold appearance. Body text remains justified with the inherited 1.5-line spacing and indentation conventions (the correction uses different first-line indents in early chapters and Chapter Three, which are retained). References keep their inherited hanging-indent format. The corrected tables' appearance and 12-pt font are preserved, with widths constrained to the usable page area, repeated header rows and intact rows. New Chapter Four body paragraphs copy the corrected Chapter Three paragraph format.

The PDF is a preview rendered in LibreOffice. Times New Roman is not installed in this cloud machine, so the preview uses a compatible serif substitute; the editable DOCX explicitly retains Times New Roman. Pagination and text wrapping may therefore change when opened in Microsoft Word with the actual font or after screenshots are inserted. The report's contents page uses the current preview pagination and must be refreshed during final assembly.

## Evidence and pending finalisation

- Existing regression suite rerun: **34 passed, 0 failed, 0 skipped** (25 workflow/validation checks and 9 session checks).
- Prior verification in this session: production build/lint/type checks completed; 18 live Chromium public-page checks and 18 local HTTPS WebKit public-page checks passed; Vercel deployment succeeded.
- Simulated-service tests are not a live Firebase/Supabase acceptance run. Public-page checks are not a real-account production lifecycle or physical-iPhone trial. The report keeps these distinctions explicit.
- Table 4.2 contains live cases marked **To execute** until an authenticated run supplies actual results. No staff accounts, file transfers, Firebase-rule publication, participant study or defence results have been fabricated for the report.
- Insert the requested screenshots, record actual acceptance outcomes, fill the author/matriculation details, refresh pagination and perform a final Word review before submission.

## Production dependencies the report describes

Firestore rules and indexes require separate deployment to the matching Firebase project; Vercel does not deploy them. Submission storage must remain private and signed access must use the server-authorised routes. Service credentials remain server-side. These are documented implementation dependencies, not configuration changes made during report preparation.
