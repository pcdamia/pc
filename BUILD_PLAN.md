PORTFOLIO APP BUILD PLAN (Angular + Firebase)

“Implement Milestone 0 only. Do not start Milestone 1. Provide the updated file list and confirm npm start works.”

Do not build everything at once.
Complete milestones in order.
After each milestone, ensure the app runs (npm start) with no console errors.
Keep code minimal and CEO/board-facing (no fancy UI libraries).
All content should come from Firestore (except where explicitly stated).
Use Tailwind for styling.
Use CSS variables for company theme (accent only).
Milestone 0 — Project Scaffolding (Must pass before anything else)
Goal
A running Angular app with Tailwind working and routes created.
Tasks
Create Angular app (standalone + routing).
Install Tailwind and confirm classes work.
Create routes for:
/ Home
/experience
/projects
/skills
Create a shared LayoutComponent with top navigation.
Files
src/app/app.routes.ts
src/app/shared/layout/layout.component.ts|html
src/app/pages/home/home.component.*
src/app/pages/experience/experience.component.*
src/app/pages/projects/projects.component.*
src/app/pages/skills/skills.component.*
src/styles.css
tailwind.config.js
Acceptance Criteria
npm start works.
Navigation links switch pages.
Tailwind utility classes visibly apply (e.g., background color changes).
Milestone 1 — Firebase Connection Layer (No UI yet)
Goal
Firebase is configured and Firestore reads work.
Tasks
Install Firebase SDK.
Add environment.ts Firebase config.
Create FirebaseService that exposes:
Firestore instance
Storage instance
Create RepoService that reads collections:
companies
experiences
projects
skills
Add a quick test read in Home page: show number of companies.
Files
src/environments/environment.ts
src/app/core/firebase.service.ts
src/app/core/repo.service.ts
src/app/core/models.ts
Acceptance Criteria
Home page displays counts fetched from Firestore.
No Firebase permission errors.
No keys hardcoded outside environment.
Milestone 2 — Theme Engine (CSS variables + company accent)
Goal
Theme can switch based on active section, but keeps navy base.
Tasks
Add CSS variables to :root:
--company-primary
--company-secondary
Add ThemeService with:
setCompanyTheme(primary, secondary)
Add a visible accent element (a bar) that reflects company primary color.
Files
src/styles.css
src/app/core/theme.service.ts
src/app/shared/theme-accent/theme-accent.component.* (optional)
Acceptance Criteria
Calling setCompanyTheme('#ff0000', '#ffffff') changes accent bar to red.
Site still uses navy as the base background.
Milestone 3 — SnapSection Component (UI building block)
Goal
Build reusable “full-viewport snap section” layout component.
Layout
Full screen height
CSS scroll snap support
Left: logo container
Right: title + summary + bullets + chips
Tasks
Create SnapSectionComponent with Inputs:
id
logoUrl
title
subtitle
summary
bullets
chipsA (technologies)
chipsB (software/projects)
Add subtle animation only (hover lift on chips, smooth transitions).
Files
src/app/shared/snap-section/snap-section.component.ts|html|css
Acceptance Criteria
Component renders with dummy data.
Looks executive (clean, restrained).
Works at mobile + desktop widths.
Milestone 4 — Experience Page v1 (Real Firestore data + snap scroll)
Goal
Experience page renders all experiences from Firestore using SnapSection.
Tasks
Fetch companies + experiences.
Join company data (by companyId).
Resolve logos:
If using Storage: call getDownloadURL
If using assets: map to /assets/logos/...
Render scroll container:
h-screen overflow-y-scroll snap-y snap-mandatory
Add IntersectionObserver:
When a section becomes active, call ThemeService.setCompanyTheme(...)
Files
src/app/pages/experience/experience.component.ts|html
src/app/core/repo.service.ts
src/app/core/theme.service.ts
Acceptance Criteria
Scroll snaps between roles.
Accent bar changes when section changes.
No flicker / no lag.
Works without authentication.
Milestone 5 — Projects Page v1 (Same as Experience)
Goal
Projects page uses same snap layout.
Tasks
Fetch projects + companies.
Render each project section with:
Title
Description
Goal
Stakeholders
Outcomes bullets
Technology chips
Acceptance Criteria
Scroll-snap works.
Theme switch works.
Milestone 6 — Home Page v1 (CEO-facing hero + metrics)
Goal
Home page sells executive identity in 8 seconds.
Tasks
Hero section:
Name
Title
2-line executive statement
CTA buttons
Metrics strip:
Years leadership
99% uptime
30% cost reduction
80% efficiency
Download CV button:
pulls from Storage path documents/... using download URL
must work without auth
Acceptance Criteria
Hero looks polished.
CV download works.
Milestone 7 — Skills Page v1 (search + bubbles + anchors)
Goal
Interactive skills without being gimmicky.
Tasks
Fetch skills + joins.
Search input filters skills.
Bubble grid:
hover = slight lift
click = reveal label + label links to anchor
Detail section below:
Used at: company list
Learned at: company list
Related projects list
Acceptance Criteria
Search works instantly.
Clicking a bubble scrolls to skill anchor.
Milestone 8 — Cover Letter Generator v1 (client-side PDF)
Goal
Generate basic and advanced cover letters with qualification alert.
Tasks
Create modal form:
Basic download
Advanced: job title + job description
Keyword match scoring:
compare extracted keywords to stored skills
Alert if score below threshold
Generate PDF client-side
Acceptance Criteria
PDF downloads successfully.
Alert appears when mismatch is low.
Still allows generic download.