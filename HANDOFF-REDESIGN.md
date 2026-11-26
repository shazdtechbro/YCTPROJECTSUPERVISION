# Redesign handoff (branch `redesign/yabatech-ui`)

Front-end only. No routes, API routes, Firestore schema, auth, storage, milestone engine or cron were touched.

## Done (committed)
1. **Foundation**: brand tokens in `tailwind.config.ts` + `app/globals.css` (green/yellow/cream/ink, soft shadows, 12/20px radii, grain), fonts via next/font (Plus Jakarta Sans, Inter, JetBrains Mono), all `components/ui/*` primitives restyled (no brutalist borders/shadows, 44-48px tap targets, dialogs become bottom sheets on phones). Light theme forced (cream design has no dark variant; the old theme toggle was removed).
2. **App shell** `components/shared/app-shell.tsx`: 264px grouped sidebar, department card, defence-season card, user card + logout; top bar with breadcrumbs, search / ⌘K command menu (`command-menu.tsx`), notification bell (same live data). Below 1024px: drawer + bottom tab bar. Nav groups in `lib/nav.ts`.
3. **Illustrations** `components/illustrations/index.tsx`: code-drawn SVG people/scenes (hero, roles, auth panel, defence day, empty states, 404). No raster assets needed.
4. **Shared**: `components/app/motion.tsx` (Reveal, Stagger, CountUp, PageTransition, reduced-motion aware), `components/app/stats.tsx` (StatCard, ProgressRing, ProgressBar, Initials, SectionCard), `components/app/stage-timeline.tsx` (review journey derived from real submissions + "next step").
5. **Student dashboard** and **project workspace** (`project-tabs.tsx`), submissions with Approve / Request changes / Mark as pending buttons (same API), tickets, feedback, comments, dialogs, skeletons.

6. **Supervisor** dashboard (stat cards, filtered queue, health donut), projects + roster (`components/app/project-list.tsx`: cards, table on desktop / stacked rows on phones).
7. **HOD** overview (monotone Recharts line chart, needs attention, workload bars, "No replies yet"), projects (filter chips + grid/list toggle), supervisors cards, drill-down, reports.
8. **Auth** split screen (`app/(auth)/layout.tsx`) and **landing** (`app/page.tsx`, `components/app/hero-art.tsx`).

## Remaining
- Run `npm run lint` and `npm run build` (only `tsc --noEmit` was run; it passes).
- Visual QA at 360 / 768 / 1024 / 1440 in a browser (not done yet), before/after screenshots.
- Optional: `app/not-found.tsx` using `NotFoundIllustration`; Lighthouse pass.
- Deploy a Vercel preview (`vercel` CLI) once build passes.

## Notes
- Repo has **no tests** (no Node test runner or Playwright files), so verification is typecheck/lint/build.
- Brief mentions features not in this codebase (topic submission, partners, 5 chapters x 20%, extensions, grading, matric numbers). They were not invented; reference components were mapped onto existing data.
