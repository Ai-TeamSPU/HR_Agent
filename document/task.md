# HR AI Agent — Task List

## Phase 1: Project Setup
- [ ] Initialize Next.js 15 project with TypeScript + Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up fonts (Inter + Noto Sans Thai)
- [ ] Configure design system (globals.css, CSS variables, animations)

## Phase 2: Types & Mock Data
- [ ] Create TypeScript types (Vacancy, Candidate, Application, Interview, AI)
- [ ] Create State Machine types and logic
- [ ] Create mock data (vacancies, candidates, applications, interviews, AI responses)

## Phase 3: Layout & Shared Components
- [ ] Root layout with dark/light mode
- [ ] HR Dashboard sidebar navigation
- [ ] Candidate Portal layout
- [ ] Shared UI components (StateBadge, KPICard, MatchScore, Timeline, etc.)

## Phase 4: HR Dashboard Pages
- [ ] `/dashboard` — Overview with KPIs, Pipeline, Activity
- [ ] `/dashboard/vacancies` — Vacancy list
- [ ] `/dashboard/vacancies/[id]` — Vacancy detail + JD
- [ ] `/dashboard/candidates` — Candidate list
- [ ] `/dashboard/candidates/[id]` — Candidate profile
- [ ] `/dashboard/applications` — Application pipeline
- [ ] `/dashboard/applications/[id]` — Application detail
- [ ] `/dashboard/interviews` — Interview calendar
- [ ] `/dashboard/ai-agent` — AI Agent Console

## Phase 5: Candidate Portal
- [ ] `/jobs` — Public job listing
- [ ] `/jobs/[id]` — Job detail
- [ ] `/apply/[jobId]` — Application form
- [ ] `/candidate/dashboard` — Candidate dashboard

## Phase 6: Authentication
- [ ] `/login` — Login page (Mock auth)

## Phase 7: Verification
- [ ] Build passes without errors
- [ ] All pages render correctly
- [ ] Navigation works
- [ ] Responsive design verified
