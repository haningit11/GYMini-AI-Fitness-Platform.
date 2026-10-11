# GYMini — AI-Driven Social Fitness Platform

**GYMini** is a full-stack web application that brings personalized training, workout tracking, progress analytics, and gym communities together in one platform. Developed as a Computer Science senior project at Lebanese International University (2025–2026).

## Overview

GYMini aims to make fitness planning more accessible and motivating. Members can generate AI-assisted workout plans, import existing routines, complete guided sessions, monitor their progress, and connect with other gym members.

## Features

- **AI workout generator:** Creates personalized multi-day routines based on fitness level, goals, equipment, and training frequency.
- **Workout plan import:** Converts text, images, or PDF workout plans into editable structured routines.
- **Interactive workouts:** Track exercises, sets, reps, rest intervals, session progress, and completed workouts.
- **Exercise guidance:** Exercise lookup and visual demonstrations through ExerciseDB.
- **Training analytics:** Visualize activity, workout trends, muscle-group distribution, and body measurements.
- **Social fitness:** Gym community chats, direct messages, followers, and profiles.
- **Gamification:** XP, streaks, ranks, and leaderboards.
- **Role-based dashboards:** Separate experiences for members, gym admins, and platform admins, including gym moderation and platform management.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| Data & charts | TanStack Query, Recharts |
| Backend | Supabase Edge Functions (Deno) |
| Database & auth | Supabase PostgreSQL, Supabase Auth, Supabase Realtime |
| AI | Google Gemini API |
| Exercise data | ExerciseDB API |
| Email | Resend |
| Testing | Vitest, Testing Library |

## Project Structure

```text
src/                  React application, pages, components, and integrations
public/               Public static assets
supabase/
  functions/          Backend Edge Functions
  migrations/         Database migrations
schema.sql            Database schema reference
package.json          Scripts and dependencies
```

## Local Setup

**Prerequisites:** Node.js and npm, and a configured Supabase project with the required backend functions and environment secrets.

```bash
git clone https://github.com/haningit11/gymini-senior-2026.git
cd gymini-senior-2026
npm install
```

Create a local `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_SUPABASE_PROJECT_ID=your-supabase-project-id
```

Then start the frontend:

```bash
npm run dev
```

**Note:** A frontend-only setup does not provision Supabase tables, authentication, Edge Functions, or third-party API access. Configure the backend separately before expecting the full application to work. Keep Google AI, ExerciseDB, and Resend API secrets in your backend secret manager, never in frontend `VITE_` variables or committed files.

## Available Scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
npm run test      # Vitest
```

## User Roles

- **Member:** Personal training, progress tracking, communities, messaging, and leaderboards.
- **Gym Admin:** Member functionality plus gym profile management, membership oversight, and chat moderation.
- **Super Admin:** Platform-level user, gym, review, and system-log management.

## Security & Responsible Use

- Authentication and role permissions are designed around Supabase Auth and PostgreSQL Row Level Security.
- Third-party API credentials must remain server-side.
- AI-generated workouts are informational and do not replace professional medical or coaching advice.
- **Before public deployment:** Audit Edge Function authentication, rate limits, CORS, database policies, and credential rotation. Source publication alone is not proof of production security.

## Background

This project began with an initial Lovable-generated frontend scaffold and was subsequently developed and extended locally. The repository contains the application implementation, database migrations, and Supabase backend functions.

## Academic Context

Senior Project — Computer Science and Information Technology, Lebanese International University, Spring 2025–2026.

**Author:** Hanin Fawaz Idriss  
**Supervisor:** Dr. Houssam Yactine

## License

No open-source license is included at present. All rights reserved unless a license is added by the author.
