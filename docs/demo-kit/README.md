# Ready-to-populate demonstration kit

Start with **COWORK-PROMPT.md**. It instructs an assistant with live-site access to create and verify two new demo accounts and populate a shared project with six PDFs, reviews, feedback, a pending revision and activity.

The current cloud session was blocked by the outbound network policy before creating any account. **No working demo credentials are supplied yet.** The six PDFs are generated and readable. The optional Python setup script is syntax-checked but not production-executed.

Files:
- `COWORK-PROMPT.md`: complete browser-first handover.
- `pdfs/`: six sample PDFs for the demonstration.
- `seed_live.py`: optional resumable setup using normal authenticated application APIs; Python standard library only.
- `prepare_pdfs.py`: optional PDF regeneration; requires ReportLab.

To automate, download the kit into `/workspace/demo-setup` with `pdfs/` beside `seed_live.py`, or adjust each script's ROOT path. Run `python seed_live.py`. Never publish generated `demo-state.json`, session tokens or account passwords. Return the newly verified demo credentials privately to the project owner.

The target state is deliberately 60% completion, three approved chapters, Chapter Four revised and pending lecturer review, and Chapter Five not started. Approving Chapter Four during the actual recording provides a clear 60%-to-80% demonstration.

## Continuation for the accounts already created

The owner's Cowork handoff reports that both accounts and project `XleeJC3EGAIg5gNmbrHL` exist, but no PDFs were uploaded because its file chooser was unavailable. Use **RESUME-COWORK-PROMPT.md** for that existing project, rather than the original new-account instructions.

- `resume_existing.py`: API-only continuation; no file chooser, new account or new project.
- `resume_existing.browser.js`: embedded-PDF browser continuation for a browser tool with JavaScript execution; no local files required.

Both preserve the existing activities, extension and proposal date. Real production execution remains outstanding. The browser version has passed controlled-service tests, including byte-for-byte PDF verification and a resumable rerun without duplicate submissions.
