# YABATECH redesign handoff

The working branch is `redesign/yabatech-ui`. It contains the redesign layered over the production workflow changes deployed in `9300420`.

- The landing page and split-screen authentication layout use the six supplied PNG illustrations in `public/redesign`.
- The redesign includes responsive navigation, project lists, HOD reports, and the student dashboard. The student dashboard shows live project progress, deadlines, feedback, and activity.
- The account menu preserves the light, dark, and system theme options and the existing sign-out flow.
- The production authentication, Firestore rules, API routes, role checks, and core project and submission components are carried over from `main`.
- The three design fonts are bundled through Fontsource, so the build does not make live Google Fonts requests.

Run `npm ci`, `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. The test suite covers project stages, partner membership, session transitions, submissions, and document access with controlled fixtures. Use dedicated role test accounts for authenticated browser QA.
