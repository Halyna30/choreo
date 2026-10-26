# Choreo

**A shared daily task list for families.** Parents create tasks, kids tick them off, and everyone in the group sees each other's progress in real time.

Built with **React Native (Expo)**, **TypeScript** and **Supabase**.

<!-- Add screenshots to docs/screenshots and uncomment:
<p align="center">
  <img src="docs/screenshots/today.png" width="230" alt="My tasks for today" />
  <img src="docs/screenshots/group.png" width="230" alt="Group progress" />
  <img src="docs/screenshots/new-task.png" width="230" alt="New task form" />
  <img src="docs/screenshots/invite.png" width="230" alt="Invite with a role" />
</p>
-->

## Why

Every family argues about chores. Generic to-do apps don't handle the fact that a parent and a child should have **different permissions** in the same list. Choreo is built around that: roles decide who can plan tasks and who can only complete them.

## Features

- **Groups with roles**
  - **Owner** – creates the group, invites members, manages roles
  - **Adult** – creates, edits and deletes tasks for everyone
  - **Child** – sees the group's tasks and can only change the status of their own
- **Role-based invites** – one-time, 8-character codes that expire after 7 days; the role (and an optional label like "Mom" or "Grandpa") is set by the owner, not by the person joining
- **Custom member labels** – display names inside the group, independent of permissions
- **Daily tasks** with three statuses: *To do → In progress → Done*, switched with a single tap
- **Group view** – every member's tasks and progress for the selected day
- **Real-time sync** – when a child completes a task, the parent sees it within a second
- **Day navigation** – yesterday / today / tomorrow and beyond
- Email + password authentication with a persisted session

## Tech stack

| Area | Technology |
| --- | --- |
| App | React Native, Expo, Expo Router (file-based routing), TypeScript |
| UI | React Native Paper (Material Design 3) |
| Server state | TanStack Query |
| Backend | Supabase: PostgreSQL, Auth, Realtime, Row Level Security |
| Code quality | ESLint, Prettier |

## Technical highlights

**Security lives in the database, not in the UI.**
All permissions are enforced with PostgreSQL **Row Level Security** policies and triggers. Hiding a button in the app is only a convenience: even a hand-crafted API request cannot let a child edit a task's title or a non-member read the group's data. Helper functions are `security definer` to avoid recursive RLS checks, and group creation / joining go through RPC functions so the role always comes from the invite.

**Optimistic updates with rollback.**
Changing a task's status updates the TanStack Query cache immediately. If the server rejects the change, the previous state is restored and an error is shown.

**Realtime without duplicated state.**
Supabase Realtime events don't patch local state by hand – they invalidate the relevant queries, so the cache stays the single source of truth. One subscription per group is kept for the whole app.

**State-driven navigation.**
Expo Router's `Stack.Protected` switches screens automatically on two levels: signed in / signed out, and has a group / needs onboarding. No manual redirects after login, logout or leaving a group.

**Dates without the UTC trap.**
Task days are stored as local `YYYY-MM-DD` keys instead of `toISOString()`, which can shift a date by one day around midnight.

**Versioned database schema.**
The schema is kept as SQL migrations in [`supabase/migrations`](supabase/migrations), and new features are added as new migrations rather than by editing old ones.

## Project structure

```
src/
├── app/                    # screens (Expo Router)
│   ├── sign-in.tsx, sign-up.tsx
│   └── (app)/              # signed-in area
│       ├── onboarding.tsx  # create or join a group
│       ├── (tabs)/         # Today, Group, Profile
│       ├── task/           # new task, task details
│       └── group/          # invites, member details
├── features/               # domain logic
│   ├── auth/               # session context, auth errors
│   ├── groups/             # API, query hooks, roles
│   └── tasks/              # API, query hooks, realtime, dates, components
├── components/             # shared UI
└── lib/                    # Supabase client, query client, theme
supabase/migrations/        # database schema, RLS policies, functions
```

Each feature separates **API calls** (`api.ts`) from **TanStack Query hooks** (`hooks.ts`); screens only use hooks.

## Database

| Table | Purpose |
| --- | --- |
| `profiles` | user profile, created automatically on sign-up |
| `groups` | a family or any other group |
| `group_members` | membership with a role (`owner` / `adult` / `child`) and an optional label |
| `group_invites` | one-time invite codes with a role and expiry date |
| `tasks` | a task assigned to a member for a specific day, with a status |

## Getting started

**Requirements:** Node.js (LTS), a free [Supabase](https://supabase.com) project, and the Expo Go app or an Android emulator.

1. **Clone and install**

   ```bash
   git clone https://github.com/Halyna30/choreo.git
   cd choreo
   npm install
   ```

2. **Set up the database** – in the Supabase dashboard open *SQL Editor* and run the files from `supabase/migrations` in order.

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your project URL and **publishable key** (*Connect* button in the Supabase dashboard). Never use the `secret` / `service_role` key in the app.

4. **Run**

   ```bash
   npx expo start
   ```

   Scan the QR code with Expo Go, or press `a` for an Android emulator.

## Roadmap

- [x] Authentication
- [x] Groups, role-based invites, member management
- [x] Daily tasks, statuses, group view, real-time sync
- [ ] Recurring tasks (daily / selected weekdays)
- [ ] Push notifications and reminders
- [ ] Tests: Jest + React Native Testing Library, Maestro end-to-end
- [ ] Android release via EAS Build
- [ ] Rewards and task approval by a parent

## Author

**Halyna Pryn** – Frontend Developer (React, TypeScript, React Native)
[GitHub](https://github.com/Halyna30)
