# CLAUDE.md

# Kickoff – Development Guidelines

## 1. Project Overview

Kickoff is a football booking management system designed to manage weekly football matches.

The system allows players to register for the upcoming match, automatically manages confirmed and waitlisted players, and provides an admin dashboard for managing bookings.

The application is being built as a lightweight web application using React and Supabase, without a separate Node.js/Express backend.

**Important:** `docs/PROJECT_SPEC.md` is the main source of truth for all project requirements, business rules, and technical decisions.

Before starting any task, read and understand the relevant sections of `docs/PROJECT_SPEC.md`.

---

## 2. Technology Stack

Use the following technologies:

- React
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui when appropriate
- Lucide React for icons
- React Router
- Supabase:
  - PostgreSQL
  - Supabase Auth
  - Supabase Realtime
  - PostgreSQL Functions (PL/pgSQL)
  - Row Level Security (RLS)
  - Supabase Cron when needed
- Vercel for deployment

Do not introduce additional libraries or technologies without a clear reason.

If a new dependency is needed, explain why it is necessary before adding it.

---

## 3. General Development Principles

Follow these principles throughout the project:

- Write clean, readable, maintainable, and reusable code.
- Use TypeScript properly. Avoid `any` unless there is a strong justification.
- Prefer simple solutions over unnecessary abstractions.
- Follow separation of concerns.
- Keep components focused on a single responsibility.
- Extract reusable logic into custom hooks or utility functions when appropriate.
- Avoid duplicated code.
- Use meaningful and consistent naming conventions.
- Handle loading, error, empty, and success states.
- Avoid unnecessary re-renders.
- Do not over-engineer the MVP.
- Do not implement features that are not included in the project specification unless approved.

---

## 4. Project Structure

Keep the project organized by feature and responsibility.

Suggested structure:

```text
src/
├── assets/
├── components/
│   ├── ui/
│   └── shared/
├── features/
│   ├── booking/
│   ├── players/
│   └── admin/
├── hooks/
├── lib/
│   └── supabase.ts
├── pages/
├── routes/
├── types/
├── utils/
├── App.tsx
├── main.tsx
└── index.css

docs/
└── PROJECT_SPEC.md
```

This is a suggested structure, not a requirement to create every folder immediately.

Create files and folders only when they are needed.

Keep feature-specific components, hooks, types, and utilities close to their related feature whenever practical.

---

## 5. React and TypeScript Guidelines

- Use functional components and React Hooks.
- Use TypeScript interfaces and types to define application data.
- Keep business logic out of presentation components.
- Avoid unnecessarily large components.
- Use controlled inputs when appropriate.
- Validate user input before submitting it.
- Use clear and consistent prop types.
- Avoid unnecessary `useEffect` usage.
- Do not use `useEffect` for values that can be calculated during rendering.
- Extract complex logic into custom hooks or separate functions.
- Keep API and database communication outside UI components.

---

## 6. Supabase and Database Guidelines

Supabase is the primary backend for this project.

Follow these rules carefully:

- Use the existing Supabase client from `src/lib/supabase.ts`.
- Never create multiple Supabase clients unnecessarily.
- Never expose the Supabase `service_role` key or any secret key in frontend code.
- Only use the publishable key in the frontend.
- Use environment variables for project configuration.
- Never commit `.env.local` or other files containing secrets.
- Keep database operations organized and reusable.
- Use generated or accurately maintained TypeScript database types whenever practical.
- Handle Supabase errors explicitly.
- Do not assume a database operation succeeded without checking its result.

### Database Security

Security must be enforced at the database level, not only in the frontend.

- Enable and configure Row Level Security (RLS) on relevant tables.
- Do not expose private player information through public queries.
- Public users must never be able to read phone numbers or cancellation token hashes.
- Do not rely on frontend checks to protect admin functionality.
- Admin permissions must be verified securely on the backend/database side.
- Public write operations must use explicitly designed secure database functions or server-side operations.
- Never trust user-provided IDs, roles, statuses, or booking capacity without server-side validation.

---

## 7. Business Logic and Data Integrity

The booking system contains important business rules.

Do not implement booking logic directly in React if it affects data integrity.

In particular:

- The maximum confirmed player capacity is 12.
- The first 12 eligible registrations should become confirmed.
- Additional registrations should enter the waiting list.
- Waiting list order must follow FIFO.
- When a confirmed player cancels, the first eligible waitlisted player should be promoted automatically.
- Capacity checks and registration updates must be atomic.
- Prevent race conditions when multiple users register simultaneously.
- Use database transactions, appropriate row locking, constraints, or other reliable database mechanisms.
- Do not depend on frontend sorting or frontend capacity checks to enforce these rules.

All business rules must remain consistent with `docs/PROJECT_SPEC.md`.

If a requirement is unclear or contradictory, stop and ask for clarification instead of making assumptions.

---

## 8. Date and Time Handling

The application uses the `Africa/Cairo` timezone.

- Do not assume the browser's timezone is always correct.
- Do not rely on the database server's local timezone.
- Store timestamps using appropriate PostgreSQL timestamp types.
- Handle daylight saving time correctly.
- Keep registration opening and closing rules consistent with the project specification.
- Validate booking availability on the backend, even if the frontend already checks it.

Do not hardcode date calculations in multiple components.

Centralize date and time logic where appropriate.

---

## 9. UI and UX Guidelines

The application should have a clean, modern, responsive, and easy-to-use interface.

Follow these rules:

- Use Tailwind CSS v4 for styling.
- Use shadcn/ui components when they provide a clear benefit.
- Use Lucide React for icons.
- Build reusable UI components when appropriate.
- Ensure responsive behavior across mobile, tablet, and desktop.
- Maintain consistent spacing, typography, colors, and component styles.
- Provide clear feedback for user actions.
- Include loading indicators and disabled states when needed.
- Display understandable validation and error messages.
- Avoid unnecessary animations and visual complexity.

**Important:** All visible UI text must be in English.

Do not add Arabic labels, buttons, messages, or placeholder text.

---

## 10. Authentication and Authorization

The public booking experience should not require users to create accounts.

Supabase Auth is intended for admin authentication.

Follow these rules:

- Public users can view publicly available booking information.
- Public users can register and manage their own bookings only through the approved secure flow.
- Admin pages must be protected.
- Admin authorization must be enforced beyond client-side route protection.
- Never assume that hiding an admin button or route provides security.

Do not introduce player authentication or OTP verification unless the project specification is explicitly changed.

---

## 11. Error Handling and Validation

Every important operation must handle possible failures.

Examples include:

- Registration submission.
- Booking cancellation.
- Waiting list promotion.
- Admin actions.
- Supabase requests.
- Authentication.
- Data loading.

Follow these rules:

- Validate inputs before sending requests.
- Handle expected errors gracefully.
- Do not expose internal database errors or sensitive information to public users.
- Show useful and understandable messages.
- Log useful debugging information during development without exposing secrets.
- Avoid silently ignoring errors.

---

## 12. Development Workflow

Work incrementally and follow these steps for every task:

### Step 1: Understand

- Read `CLAUDE.md`.
- Read `docs/PROJECT_SPEC.md`.
- Inspect the existing codebase.
- Understand the current implementation before modifying anything.

### Step 2: Plan

Before implementation:

- Explain what needs to be done.
- Identify the files that will be created or modified.
- Explain important technical decisions.
- Identify potential risks or dependencies.
- Keep the plan focused on the requested task.

For tasks involving significant architectural or database changes, present the plan and wait for approval.

### Step 3: Implement

- Implement only the approved scope.
- Follow the existing project conventions.
- Avoid unrelated modifications.
- Do not overwrite working code without understanding its purpose.
- Keep changes small and focused.

### Step 4: Verify

After implementation:

- Run the relevant ESLint checks.
- Run TypeScript/build checks when applicable.
- Fix errors introduced by your changes.
- Review the modified files.
- Verify that existing functionality has not been unintentionally broken.

### Step 5: Report

At the end of each task, provide:

1. What was implemented.
2. Which files were created or modified.
3. Important technical decisions.
4. Commands or checks executed and their results.
5. Any remaining issues or next steps.

Never claim that something was tested successfully if you did not actually run the relevant checks.

---

## 13. Database Changes and Migrations

Database changes must be treated carefully.

- Use Supabase SQL migrations for schema changes.
- Keep migrations organized and version-controlled.
- Do not make undocumented manual database changes.
- Do not modify production data.
- Do not drop tables, columns, constraints, or existing data without explicit approval.
- Review RLS policies whenever changing tables or database functions.
- Ensure migrations are safe and consistent with the existing schema.

When creating or modifying database functions, consider:

- Input validation.
- Authorization.
- Atomicity.
- Concurrency.
- Error handling.
- Data exposure.
- Correct transaction behavior.

---

## 14. Git and Code Quality

- Do not run destructive Git commands.
- Do not reset, revert, or discard user changes.
- Do not commit or push unless explicitly requested.
- Avoid modifying unrelated files.
- Keep code consistent with the existing formatting and linting rules.
- Do not introduce unnecessary dependencies.

---

## 15. Important Restrictions

Never do the following without approval:

- Change the approved technology stack.
- Change business requirements.
- Change the database architecture.
- Introduce a separate backend server.
- Add OTP or SMS verification.
- Expose private user information.
- Bypass RLS or database security.
- Change booking capacity or registration rules.
- Add features outside the MVP scope.
- Delete existing project files or data.

If you discover a better architectural approach, explain the advantages and disadvantages and ask before changing the agreed design.

---

## 16. Final Rule

**Understand first. Plan second. Implement third. Verify last.**

The goal is not just to make the application work.

The goal is to build Kickoff with reliable business logic, secure database operations, clean architecture, maintainable code, and a good user experience.

Always prioritize correctness, security, and simplicity.