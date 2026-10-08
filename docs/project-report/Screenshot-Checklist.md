# Screenshots to complete the updated report

The updated Word report already contains the three revised design diagrams. Supply **14 raw screenshots**, which will be assembled into **eight application figures**. The report will therefore contain **11 numbered figures: three design diagrams and eight application figures**. This is a focused editorial choice, not a YABATECH-mandated image quota.

The figure slots and captions are already placed in Section 4.2. Do not use the older screenshots: they show the superseded workflow and do not establish current operation.

## Capture setup

Use https://project-supervision-system.vercel.app/ and one synthetic project in Computer Science. Use separate browser sessions for the lead student, partner, assigned supervisor and HOD. Create accounts through the actual application using email addresses you control. Do not use another person's identity or mailbox. Examples of suitably formatted synthetic matriculation numbers are F/HD/24/3999001 and P/HD/24/3999002, provided they are unused and do not identify real students. Use a clearly labelled topic such as “Demonstration: Digital Library Request Tracking”.

Use a desktop viewport around 1440 × 900 for Figures 4.1–4.7 and your iPhone portrait view for Figure 4.8. Capture PNG files, at normal browser zoom. Keep the relevant labels, statuses, matriculation numbers and feedback legible. Avoid whole-page captures that make a small form unreadable when printed. Capture paired panels separately; they will be combined and labelled (a) and (b) during insertion. Keep the same project/topic across the screenshots.

Do not show passwords, tokens, service keys, Firebase/Vercel settings containing secrets, signed download links, unrelated notifications or real students' personal data. Do not edit the interface text or fabricate a status to make a screenshot. Reload after saved actions before capturing persistence evidence. A screenshot documents the displayed state; the acceptance log must record whether the action and reload actually succeeded.

## Exact capture list

| File | Account, page and required state | What must be visible | Report placement |
|---|---|---|---|
| `4-1a-supervisor-directory.png` | Lead student, `/student/dashboard`, before project creation. | The departmental supervisor choices and the selected supervisor; department context where shown. | §4.2.1, Figure 4.1(a). |
| `4-1b-topic-team-form.png` | Lead student, same dashboard, after selecting the supervisor and filling the topic form, before submission. | Topic, project description, selected supervisor and partner matriculation number. No password fields. | §4.2.1, Figure 4.1(b). |
| `4-2a-topic-review.png` | Assigned supervisor, `/supervisor/projects/<projectId>`, while the topic is pending and a useful decision note is entered. | Current topic state, Approve topic / Decline / Mark pending controls, topic and note. | §4.2.2, Figure 4.2(a). |
| `4-2b-topic-decision-history.png` | Lead student, `/student/project/<projectId>`, after the supervisor declines, the lead revises/resubmits, and the supervisor approves. | Current Approved topic, correction note if retained, and activity entries for decline, revised submission and approval with actors/timestamps. | §4.2.2, Figure 4.2(b). |
| `4-3a-partner-notification.png` | Partner, `/student/dashboard`, with notifications open after the lead adds the account. | The actual “added you to project” notification and a recognisable project title. | §4.2.2, Figure 4.3(a). |
| `4-3b-partner-shared-project.png` | Partner, `/student/project/<projectId>`, after opening the notification and reloading. | The same project, supervisor, team and student matriculation numbers. | §4.2.2, Figure 4.3(b). |
| `4-4a-chapter-progress.png` | Lead or partner, project workflow panel, after Chapter One is approved and Chapter Two is submitted for review. | Five stage labels; Chapter One Approved, Chapter Two In review, remaining stages Not started; 20% progress or 1/5 approved. | §4.2.3, Figure 4.4(a). |
| `4-4b-saved-review-grade.png` | Assigned supervisor, project Submissions workspace, after saving a review for Chapter Two. | Selected file/title and chapter, Changes requested or Approved state, saved feedback, a grade such as 72/100, and version where displayed. Use meaningful feedback such as “Compare the reviewed systems and state the research gap.” | §4.2.3, Figure 4.4(b). |
| `4-5a-pending-extension.png` | Assigned supervisor, project workflow panel, after a student requests a later deadline. | Requested date, Pending state, decision-note field and Grant extension / Decline extension controls. | §4.2.4, Figure 4.5(a). |
| `4-5b-extension-history.png` | Lead student, project workflow panel, after one request is declined and a later request is approved. | Current approved extension, updated next deadline where shown, and activity entries for both decline and approval. Defence date must not be presented as automatically extended. | §4.2.4, Figure 4.5(b). |
| `4-6-final-approval-defense.png` | Lead or partner, project overview/workflow, after all five chapters and the final submission have been approved. | Five Approved stages, explicit “Final project approval granted”, 100%/5 of 5 approval indication and a stored defence date. If these are in separate panels, send one additional close-up instead of an unreadable long screenshot. | §4.2.5, Figure 4.6. |
| `4-7-hod-analytics.png` | Computer Science HOD, `/hod/dashboard`, after the demonstration has generated activity. | Department context, useful project/health summary and readable activity or response chart. If a metric is blank or unavailable, record that actual result; do not invent data. | §4.2.6, Figure 4.7. |
| `4-8a-iphone-matric-login.png` | Signed-out iPhone, `/login`, student matriculation login mode. | Matriculation-number label/example, password input with no secret shown, sign-in control and non-overlapping mobile layout. | §4.2.7, Figure 4.8(a). |
| `4-8b-iphone-after-logout.png` | Your iPhone, immediately after logging out of an authenticated student or staff account and allowing the landing page to finish loading. | YABATECH branding and signed-out Sign in/Get started controls; no Go to dashboard button. Also test back navigation and direct protected URLs, recording the actual result in the acceptance log. | §4.2.7, Figure 4.8(b). |

## Final captions

- Figure 4.1: Departmental Supervisor Selection and Student Topic/Team Setup.
- Figure 4.2: Topic Review Controls and Student Decision History.
- Figure 4.3: Partner Notification and Shared Project Access.
- Figure 4.4: Chapter Progress and Submission Review with Feedback and Grade.
- Figure 4.5: Deadline-Extension Request, Supervisor Decision and Activity Record.
- Figure 4.6: Five Approved Chapters, Final Project Approval and Scheduled Defence Date.
- Figure 4.7: HOD Departmental Project-Health and Supervision-Activity Overview.
- Figure 4.8: Mobile Matriculation Login and Landing Page after Logout.

## Efficient capture order

1. Register the four roles; capture the mobile matric login screen when convenient.
2. As the lead, capture the directory and filled form, then submit the topic/team.
3. As the partner, capture the real addition notification and shared workspace.
4. As supervisor and lead, complete Pending → Declined → Revised/Pending → Approved; capture the decision controls and resulting activity history.
5. Upload/review Chapter One, then upload Chapter Two; capture the stage breakdown. Save feedback and a grade on Chapter Two and capture the saved review. Continue revisions and approvals for all chapters.
6. Request/decline an extension; request another, capture its pending controls, grant it and capture the resulting history.
7. Set a defence date, approve all five chapters, submit/approve the final, then capture final approval and date. Approve the final last: new chapter submissions and extension requests are blocked after final approval.
8. Capture the HOD overview. Log out on the iPhone, capture the signed-out landing, and test back/protected navigation.

## Figure research and recommendation

Two accessible academic-report template examples were inspected on 8 October 2026:

1. **UiTM-oriented thesis/final-year-project template**, maintained by Rizauddin. Its README states that it is based on the IPSis UiTM formatting handbook. Its sample PDF lists five numbered figures, including multi-panel examples; its class file configures figure captions and a list of figures. The five figures are a template demonstration, not a recommended count for every project. Sources: [repository and provenance](https://github.com/rizauddin/uitmthesis), [sample PDF](https://github.com/rizauddin/uitmthesis/blob/main/main.pdf), [caption configuration](https://github.com/rizauddin/uitmthesis/blob/main/uitmthesis.cls).
2. **Informatics Engineering ITB thesis template**, maintained by Petra Novandi. Its README identifies the intended programme and personal use; its style defines chapter/section-based figure counters. It supplies figure structure rather than a numeric quota. Sources: [repository and provenance](https://github.com/petrabarus/if-itb-latex), [style source](https://github.com/petrabarus/if-itb-latex/blob/master/src/config/if-itb-thesis.sty).

These are community-maintained academic examples, not authoritative YABATECH regulations. The inspected examples do not establish a universal required image count. Direct access to additional university writing-guidance pages was blocked by this session's network policy, so no claim is made that a YABATECH departmental image quota has been verified. The network-domain additions were saved as a configuration draft; saving that draft did not unblock the current requests.

For this report, three design figures explain architecture, records and rules, while eight application figures demonstrate the revised lifecycle. Grouping related before/after or actor/recipient states avoids repeating nearly identical dashboards. Use readable figures with explicit captions and references in the prose. Detailed negative-test screenshots and supplementary ticket/comment examples can stay in a test-evidence folder or appendix if later required; they do not need to inflate Chapters One–Four.

The corrected document remains the authority for font, heading appearance and section structure. Another institution's template is not used to overwrite its formatting.

## Complete the evidence record as well as the figures

The Word report includes 17 live acceptance cases in Table 4.2. For each executed case, record: case ID; account label; action and input; expected result; actual result after reload; evidence filename; Pass, Fail or Blocked; date/browser; and any error. Test failures should be reported, not disguised with screenshots of unrelated successful states.

The Chapter Four figure slots currently describe captures to be supplied. After receiving the screenshots and results, the final edit will insert the figures, remove the capture instructions, update the acceptance outcomes and contents pagination, and fill the student-name/matriculation placeholders. A supplied screenshot alone will not be used to mark unexecuted cases as passed.
