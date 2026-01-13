# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Life OS Finance is a Hebrew-language personal finance and fitness tracking Progressive Web App (PWA) built with Next.js 15, React 19, TypeScript, and Supabase. The app uses right-to-left (RTL) layout and the Heebo font for Hebrew text.

## Commands

### Development
```bash
npm run dev          # Start development server (PWA disabled in dev)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

## Architecture

### Database Architecture

The app uses **Supabase** with a server-side data fetching pattern:

- **Finance Module**: Single `transactions` table with fields: `id`, `created_at`, `amount`, `description`, `type` (income/expense), `category`
- **Fitness Module**: Three tables implementing a spreadsheet-style workout tracker:
  - `fitness_targets`: Exercise templates per day (Push/Pull/Legs split)
  - `fitness_logs`: Daily workout entries linked to targets
  - `fitness_daily_summary`: Aggregated daily metrics

**Migration files**:
- [supabase_migration.sql](supabase_migration.sql) - Finance transactions table
- [supabase_migration_fitness_spreadsheet.sql](supabase_migration_fitness_spreadsheet.sql) - Fitness tracking tables with seed data

**RLS Policies**: Currently set to allow public access for rapid development. All tables use permissive policies (`using (true)`).

### Navigation Architecture

The app implements **responsive navigation** with two distinct patterns:

- **Mobile**: Bottom navigation bar ([components/bottom-nav.tsx](components/bottom-nav.tsx)) - shown on screens < md breakpoint
- **Desktop**: Left sidebar ([components/sidebar.tsx](components/sidebar.tsx)) - shown on screens >= md breakpoint

Both navigation components are wrapped by [components/responsive-nav.tsx](components/responsive-nav.tsx) which is included in the root layout. This wrapper handles the responsive switching logic.

### App Structure

Next.js 15 App Router with server components by default:

- [app/page.tsx](app/page.tsx) - Dashboard (server component that fetches transactions)
- [app/layout.tsx](app/layout.tsx) - Root layout with Hebrew locale (`lang="he" dir="rtl"`)
- [app/fitness/page.tsx](app/fitness/page.tsx) - Fitness tracker with Push/Pull/Legs tabs
- Routes: `/`, `/transactions`, `/fitness`, `/add`, `/stats`

**Data Flow Pattern**:
1. Server components fetch initial data from Supabase (e.g., `app/page.tsx` fetches transactions)
2. Data passed as props to client components marked with `"use client"`
3. Client components manage local state and mutations using Supabase client directly

### Component Architecture

**UI Components**:
- [components/ui-components.tsx](components/ui-components.tsx) - Core UI primitives (Button, Card, Input, etc.)
- [components/ui-dialog.tsx](components/ui-dialog.tsx) - Dialog/Modal components from Radix UI
- Built with Radix UI primitives + Tailwind styling

**Feature Components**:
- [components/dashboard.tsx](components/dashboard.tsx) - Main finance dashboard with balance cards and transaction list
- [components/add-transaction-dialog.tsx](components/add-transaction-dialog.tsx) - Transaction creation modal
- [app/fitness/components/fitness-spreadsheet.tsx](app/fitness/components/fitness-spreadsheet.tsx) - Complex fitness logging spreadsheet with debounced autosave (1000ms delay)

### Supabase Client

The Supabase client is initialized in [lib/supabase.ts](lib/supabase.ts) using environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These must be configured in `.env.local` (not committed to git).

### Styling

- **Tailwind CSS 4.0** with PostCSS
- Global styles in [app/globals.css](app/globals.css)
- RTL-optimized layout with Hebrew font (Heebo)
- Dark mode CSS variables defined but not actively implemented

### PWA Configuration

PWA functionality via `@ducanh2912/next-pwa` configured in [next.config.ts](next.config.ts):
- Service worker outputs to `/public`
- Disabled in development mode
- Icons and manifest should be in `/public` directory

## Key Patterns

### Real-time Data Updates

Finance module uses **optimistic updates**:
1. Update local state immediately
2. Call Supabase mutation
3. Revert on error (e.g., delete transaction in [components/dashboard.tsx](components/dashboard.tsx))

Fitness module uses **debounced autosave**:
- All spreadsheet inputs debounce for 1000ms before saving
- Managed via `saveTimeoutRef` in [app/fitness/components/fitness-spreadsheet.tsx](app/fitness/components/fitness-spreadsheet.tsx)
- Upsert pattern with `onConflict` for unique constraints

### TypeScript Configuration

- `strict: false` - Lenient type checking for rapid development
- Path alias: `@/*` maps to project root
- Target: ES2017

## Important Notes

- **Hebrew/RTL**: All user-facing text is in Hebrew; UI flows right-to-left
- **No Authentication**: Currently using public RLS policies for speed
- **Revalidation**: Home page uses `revalidate = 0` to disable caching
- **Error Handling**: Fitness spreadsheet checks for missing tables (code 42P01) and shows helpful migration prompt
