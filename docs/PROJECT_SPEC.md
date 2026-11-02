# Kickoff – Football Booking Management System
## Project Specification & Implementation Instructions

Act as a Senior Full-Stack Software Engineer and Software Architect. Your responsibility is to help me design and implement a production-ready football booking management web application called **Kickoff**.

You must understand the business requirements, inspect the existing codebase, make sound technical decisions, and implement the application incrementally using clean, maintainable, and scalable code.

Do not treat this as a simple demo or tutorial project. It is a real application that will be used every week by a group of football players.

---

# 1. Project Overview

Kickoff is a football match booking management system designed to solve a recurring problem.

We organize a football match every Friday with exactly 12 players (two teams, 6 players per team).

Currently, managing attendance manually through WhatsApp is inconvenient:
- Sometimes more than 12 people want to participate.
- Sometimes fewer than 12 players confirm.
- People cancel at the last minute.
- There is no reliable waiting list.
- Managing the final attendance list is time-consuming.

Kickoff will automate this entire process.

Players will access a public website, register for the upcoming Friday match using their name and phone number, and receive a registration status.

The system must guarantee that no more than 12 players can have confirmed reservations at any given time.

---

# 2. Business Requirements

## Weekly Booking Schedule

The system operates on a recurring weekly schedule.

- Match day: Every Friday.
- Registration opens: Thursday at 12:00 AM (midnight).
- Registration closes: Friday at 12:00 PM (noon).
- Maximum confirmed players: 12.
- Timezone: Africa/Cairo.

Important:
- All scheduling and date calculations must respect the Africa/Cairo timezone.
- Do not assume the server timezone is Cairo.
- Handle daylight saving time changes correctly.
- Previous bookings must remain stored and accessible as historical records.

## Registration Process

Players can access the public booking page without creating an account.

Registration requires:
- Full name.
- Phone number.

Phone verification via SMS OTP is NOT required in the initial MVP.

Phone numbers must be normalized consistently before storage to avoid duplicate registrations caused by different formatting.

A player should be represented by one unique phone number across the application.

If a player has already registered for the same booking, the system must prevent duplicate registration.

## Booking Capacity

The maximum confirmed capacity is 12 players.

Registration behavior:

- Players 1–12: Confirmed.
- Player 13 and subsequent players: Added to the waiting list.
- Waiting list order must follow registration timestamps (FIFO).

The system must never allow more than 12 confirmed players, even when multiple users register simultaneously.

## Cancellation

Players must be able to cancel their reservations at any time.

When a confirmed player cancels:
1. Mark their registration as cancelled.
2. Automatically promote the first player in the waiting list.
3. Update the waiting list positions.
4. Broadcast the changes to connected users.

When a waitlisted player cancels, remove them from the waiting list without affecting confirmed players.

Cancellation and waiting-list promotion must be performed atomically.

Since players do not have accounts or OTP verification in the MVP, implement a secure cancellation mechanism.

Recommended approach:
- Generate a cryptographically secure random cancellation token on the server.
- Store only its hash in the database.
- Return the raw token only once to the registering client.
- Require the token to cancel the associated registration.
- Never use the phone number alone as authorization to cancel a booking.

The player should be able to retrieve their cancellation link or token after successful registration.

## Booking Closure

Registration is allowed only between Thursday 00:00 and Friday 12:00 Cairo time.

After the closing time:
- New registrations must be rejected.
- Existing confirmed and waitlisted registrations remain visible.
- Players can no longer cancel through the normal public flow.
- The admin can still manage registrations.

The backend must enforce opening and closing times. Do not rely only on frontend checks.

## Public Visibility

Anyone with the website link can access the booking page.

Public users can see:
- Match date.
- Booking status.
- Number of confirmed players.
- Available slots.
- Confirmed players' names.
- Waiting list names and positions.
- Registration status.

Phone numbers and cancellation tokens must NEVER be exposed publicly.

---

# 3. Admin Dashboard

Implement a protected admin dashboard.

Admin capabilities:

1. View current and upcoming bookings.
2. View confirmed players.
3. View waitlisted players.
4. View previous bookings.
5. Manually add a player.
6. Remove a player.
7. Change a player's registration status when appropriate.
8. Open or close registration manually.
9. Configure the maximum number of players.
10. View booking statistics.

The admin dashboard must require authentication.

Use Supabase Auth for admin authentication.

Regular players must not have admin privileges.

Do not expose admin functionality through publicly accessible database operations.

Admin actions must be validated and authorized on the server/database side.

---

# 4. Technology Stack

Use the following stack:

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui for reusable UI components where appropriate
- Lucide React for icons
- React Router for routing

## Backend and Database
- Supabase
- PostgreSQL
- Supabase Auth (admin authentication)
- Supabase Realtime
- PostgreSQL Functions (PL/pgSQL)
- PostgreSQL Row Level Security (RLS)
- Supabase Cron for recurring scheduled operations

## Deployment
- Vercel for frontend hosting.
- Supabase hosted project for backend and database.

Do not introduce unnecessary libraries or infrastructure.

Do not create a separate Node.js/Express backend unless there is a strong technical justification.

---

# 5. Database Architecture

Design a relational PostgreSQL database.

The initial core entities should include:

## players

Stores player information.

Suggested columns:
- id: UUID, primary key.
- full_name: TEXT, not null.
- phone: TEXT, unique, not null.
- created_at: TIMESTAMPTZ.

## bookings

Represents a weekly Friday match.

Suggested columns:
- id: UUID, primary key.
- match_date: DATE, unique, not null.
- max_players: INTEGER, default 12.
- status: booking status enum.
- opens_at: TIMESTAMPTZ.
- closes_at: TIMESTAMPTZ.
- created_at: TIMESTAMPTZ.

Possible booking statuses:
- scheduled
- open
- closed
- completed
- cancelled

## booking_registrations

Connects players with bookings.

Suggested columns:
- id: UUID, primary key.
- booking_id: UUID, foreign key.
- player_id: UUID, foreign key.
- status: registration status enum.
- cancellation_token_hash: TEXT.
- created_at: TIMESTAMPTZ.
- cancelled_at: TIMESTAMPTZ, nullable.

Possible registration statuses:
- confirmed
- waitlisted
- cancelled

Constraints:
- A player cannot have multiple active registrations for the same booking.
- Add appropriate indexes for booking lookups and FIFO waiting-list operations.
- Prevent duplicate weekly bookings.
- Use database constraints wherever possible.

You may improve this schema if you identify a better design, but explain the reasoning before making major architectural changes.

---

# 6. Critical Backend Business Logic

This is one of the most important parts of the application.

Do not implement booking capacity checks exclusively in React.

Implement secure PostgreSQL functions for operations such as:

- register_player
- cancel_registration
- admin_add_player
- admin_remove_player
- create_weekly_booking
- get_public_booking_details

## Concurrency Requirements

Two or more users may attempt to register at exactly the same time.

The system must guarantee:
- Maximum 12 confirmed players.
- No duplicate active registrations.
- Correct FIFO waiting-list ordering.
- Atomic cancellation and waiting-list promotion.

Use PostgreSQL transactions and appropriate row-level locking.

Consider locking the relevant booking row with SELECT ... FOR UPDATE before modifying registrations.

Do not rely on frontend state or client-side player counts for enforcing capacity.

## Database Security

Implement RLS policies carefully.

Important security requirements:
- Public users can read only approved public booking information.
- Phone numbers must remain private.
- Cancellation token hashes must never be exposed through public queries.
- Public users cannot directly modify player or registration records.
- Registration and cancellation must happen through controlled database functions or secure server-side operations.
- Admin-only operations must validate authenticated admin privileges.
- Never expose Supabase service-role or secret keys in frontend code.

Consider using a restricted public database view or dedicated RPC functions for displaying booking information.

---

# 7. Weekly Automation

The system must automatically create a new booking for every upcoming Friday.

Requirements:
- One booking per Friday.
- Registration opens Thursday at 00:00 Cairo time.
- Registration closes Friday at 12:00 Cairo time.
- Previous bookings must remain untouched.
- Do not create duplicate bookings.

Use Supabase Cron or another appropriate Supabase-native scheduling mechanism.

Important:
Supabase scheduled jobs may execute according to UTC or configured database scheduling behavior.

Design the automation to correctly handle Cairo's timezone and daylight saving changes.

Prefer an idempotent scheduling implementation that can safely run more than once without creating duplicate bookings.

The backend must enforce registration time windows independently of the scheduler.

Explain how the scheduled process works and how it can be tested.

---

# 8. Frontend Architecture

Organize the frontend using a clean feature-oriented structure.

Suggested structure:

src/
├── app/
│   ├── router/
│   └── providers/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── features/
│   ├── booking/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── players/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   │
│   └── admin/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
│
├── lib/
│   └── supabase.ts
│
├── pages/
│   ├── BookingPage.tsx
│   └── NotFoundPage.tsx
│
├── styles/
│
├── types/
│
├── App.tsx
└── main.tsx

You may adjust this structure based on actual requirements, but avoid unnecessary abstraction.

Use:
- Reusable components.
- Strong TypeScript types.
- Clear separation between UI and business logic.
- Centralized Supabase client.
- Consistent error handling.
- Loading and empty states.
- Responsive design.

---

# 9. UI/UX Requirements

The application should have a modern football-inspired visual identity.

Design direction:
- Modern sports application.
- Dark green and neutral color palette.
- Clean and minimal interface.
- Responsive layout.
- Mobile-first experience.
- Clear booking status indicators.
- Intuitive registration and cancellation flows.

Public booking page should include:

1. Application logo/name: Kickoff.
2. Upcoming Friday match date.
3. Registration status.
4. Progress indicator (e.g. 8/12 players).
5. Available slots.
6. Confirmed players list.
7. Waiting list.
8. Registration form.
9. Success and error feedback.
10. Cancellation functionality.

Admin dashboard should include:
- Overview statistics.
- Booking management.
- Confirmed players table.
- Waiting list table.
- Previous bookings.

All visible UI text must be in English.

Do not use Arabic text in code, variable names, comments, or UI.

Prioritize usability over unnecessary animations or visual effects.

---

# 10. Realtime Requirements

Use Supabase Realtime to keep the public booking page synchronized.

When a player:
- Registers.
- Cancels.
- Gets promoted from the waiting list.
- Is added or removed by an admin.

Other connected users should receive the necessary updates without refreshing the page.

Do not expose private columns through Realtime subscriptions.

Ensure subscriptions are properly cleaned up when components unmount.

---

# 11. Validation and Error Handling

Implement validation on both frontend and backend.

Examples:
- Full name is required.
- Phone number is required.
- Validate and normalize phone numbers consistently.
- Reject duplicate registrations.
- Reject registration outside the allowed time window.
- Reject registrations when the booking is closed.
- Handle full capacity correctly.
- Handle invalid cancellation tokens.
- Prevent unauthorized admin operations.

Provide meaningful user-facing error messages.

Do not expose internal database errors, secrets, or sensitive information to users.

---

# 12. Development Workflow – VERY IMPORTANT

I want to work with you incrementally.

Do NOT implement the entire application in one huge operation.

Follow these phases:

## Phase 1: Project Inspection and Architecture
- Inspect the existing repository.
- Review package.json, Vite configuration, TypeScript configuration, Tailwind setup, and existing files.
- Verify the existing Supabase client configuration.
- Identify what is already implemented.
- Do not recreate or overwrite existing working setup.
- Present the proposed project structure and architecture.

## Phase 2: Database Design
- Design the complete PostgreSQL schema.
- Create version-controlled SQL migration files.
- Implement tables, enums, foreign keys, constraints, and indexes.
- Explain important database decisions.
- Implement RLS policies.
- Generate TypeScript database types if appropriate.

## Phase 3: Core Booking Logic
- Implement registration.
- Implement waiting-list management.
- Implement cancellation.
- Implement automatic promotion.
- Implement concurrency protection.
- Test edge cases.

## Phase 4: Authentication and Admin
- Configure admin authentication.
- Implement authorization.
- Implement admin database operations.
- Build protected admin routes.

## Phase 5: Public Frontend
- Build the booking page.
- Build registration and cancellation interfaces.
- Implement realtime updates.
- Handle all loading, success, and error states.

## Phase 6: Admin Frontend
- Build dashboard.
- Build player management.
- Build booking management.
- Build historical records.

## Phase 7: Automation and Testing
- Implement weekly booking creation.
- Test Cairo timezone behavior.
- Test daylight saving transitions.
- Test concurrency.
- Test security and RLS.
- Test registration and cancellation edge cases.

## Phase 8: Deployment
- Prepare production environment variables.
- Deploy to Vercel.
- Configure Supabase production settings.
- Verify the complete application.

---

# 13. Rules You Must Follow

1. Always inspect the existing codebase before modifying anything.
2. Never overwrite working configuration without a clear reason.
3. Never use `any` unless absolutely necessary and explicitly justified.
4. Follow TypeScript best practices.
5. Keep components small and maintainable.
6. Avoid unnecessary dependencies.
7. Avoid overengineering.
8. Never put sensitive secrets in frontend code.
9. Never trust client-side validation for critical business rules.
10. Never implement concurrency-sensitive operations only in React.
11. Use SQL migrations instead of undocumented manual database changes.
12. Explain important architectural decisions.
13. Do not skip testing.
14. Do not move to the next phase without completing and verifying the current phase.
15. If a requirement is ambiguous, ask me before making a major assumption.
16. When implementing a feature, list the files created or modified.
17. Explain how to test each implemented feature.
18. Keep all code, comments, identifiers, and UI text in English.

---

# 14. Your First Task

Start with Phase 1 ONLY.

Inspect my existing Kickoff repository and understand its current state.

I have already:
- Created a React + TypeScript project using Vite.
- Installed Tailwind CSS v4.
- Configured the Tailwind Vite plugin.
- Created a Supabase project.
- Installed @supabase/supabase-js.
- Created a `.env.local` file containing the Supabase URL and Publishable Key.
- Created `src/lib/supabase.ts` to initialize the Supabase client.

Your first response should:
1. Summarize the existing project setup.
2. Identify any missing or incorrect configuration.
3. Propose the final folder structure.
4. Explain the implementation plan.
5. Identify any architectural concerns before database implementation.

Do not start implementing the database or changing files until you have inspected the repository and presented your findings.

Once the inspection is complete, we will proceed step by step.

Remember: You are not just generating code. You are helping me build a reliable, secure, maintainable application using proper software engineering practices.