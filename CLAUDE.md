# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AirService Enterprise** (branded "LMT air service") — an HVAC service management system for air conditioning repair, preventive maintenance, and installation. Three user roles: **ADMIN**, **TECHNICIAN**, **CLIENT**.

## Commands

```bash
# Development
npm run dev              # standard dev (webpack)
npm run dev:sqlite       # dev with local SQLite
npm run dev:test         # dev with local test PostgreSQL (runs db:test:env first)

# Build & production
npm run build
npm start

# Testing
npm test                 # Jest
npm run test:watch
npm run test:coverage

# Linting
npm run lint

# Database (PostgreSQL/production schema)
npm run db:migrate       # prisma migrate dev
npm run db:generate      # regenerate Prisma client after schema changes
npm run db:studio        # Prisma Studio GUI
npm run db:seed          # seed sample data

# Database (SQLite/local dev)
npm run use:sqlite       # switch to SQLite schema
npm run use:postgres     # switch back to PostgreSQL schema
npm run db:sqlite:push   # push SQLite schema without migrations

# Local test PostgreSQL (Docker)
npm run db:test:up       # start postgres:15 on port 5433
npm run db:test:sync     # sync prod snapshot → local test DB
npm run db:test:env      # write .env.local for local test postgres

# Work order status reconciliation
npm run db:status:audit
npm run db:status:reconcile   # --fix: write corrections
```

## Architecture

### Database

Dual-database setup:
- **SQLite** (`prisma/schema.sqlite.prisma`) — local dev only; `DATABASE_URL=file:./sqlite/dev.db`
- **PostgreSQL** (`prisma/schema.prisma`) — production (Supabase) and local test Docker (`localhost:5433`)

`lib/assert-safe-database.ts` throws at startup in dev mode if `DATABASE_URL` points to a remote/Supabase host. Override with `ALLOW_PRODUCTION_DATABASE=true` for intentional one-off migrations.

The Prisma singleton is in `lib/prisma.ts` — never instantiate `new PrismaClient()` anywhere else.

### Core Data Model

```
Client → Site → Building → Floor → Room → Asset
WorkOrder → JobItem → JobPhoto
JobItem links to: Asset, Technician (User), PMSchedule (optional)
PMContract → PMSchedule → JobItem
```

Work order types: **PM** (Preventive Maintenance), **CM** (Corrective Maintenance), **INSTALL**.

Work order status transitions:
- Auto-synced from JobItem statuses via `lib/sync-work-order-status.ts` for OPEN/IN_PROGRESS/COMPLETED
- Workflow-locked statuses (WAITING_APPROVAL, APPROVED, REJECTED, CANCELLED) are never auto-overwritten

### Auth & Authorization

- Cookie-based sessions, JWT signed with `JWT_SECRET`
- `getCurrentUser()` in `lib/auth.ts` — reads the session cookie
- Authorization helpers in `lib/auth-helpers.ts`: `requireAdmin()`, `requireAuth()`, `requireRole(roles[])` — throw `'Unauthorized'` on failure, used at the top of every Server Action and API route

### Server Actions

All mutations are Next.js Server Actions (`'use server'`). Entry point `app/actions.ts` re-exports from domain files:

| File | Domain |
|------|--------|
| `app/actions/work-orders.ts` | Work order CRUD, duplicate detection |
| `app/actions/users.ts` | User CRUD |
| `app/actions/pm.ts` | PM contract/schedule management |
| `app/actions/pm-client.ts` | Client-facing PM plan views |
| `app/actions/approval.ts` | CM approval workflow |
| `app/actions/assets.ts` | Asset CRUD |
| `app/actions/locations.ts` | Client/Site/Building/Floor/Room CRUD |
| `app/actions/checklist.ts` | Job checklist progress |
| `app/actions/feedback.ts` | Post-job satisfaction surveys |
| `app/actions/notifications.ts` | In-app notifications |
| `app/actions/contact.ts` | Contact messages |
| `app/actions/auth.ts` | Login/logout |

### Photo Upload

Client compresses images first (`lib/client-image-compress.ts`), then POSTs to `/api/upload/route.ts`. The route validates:
1. MIME type (must be `image/*`)
2. Extension (jpg/jpeg/png/gif/webp)
3. Magic bytes (JPEG, PNG, GIF, WebP)
4. Size (from `NEXT_PUBLIC_MAX_UPLOAD_MB` — defaults 4 MB on Vercel, 10 MB elsewhere)

Storage: **Supabase Storage** bucket `job-photos` when `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set; falls back to local `/public/job-photos/` in dev.

### PM Duplicate Detection

`lib/duplicate-check.ts` — pure function `markPotentialPmMonthlyDuplicates()` that flags PM work orders sharing the same site + calendar month + asset + wash type (MAJOR/MINOR). Server-side duplicate check also runs in `app/actions/work-orders.ts` `findPotentialDuplicates()`.

### Dashboard Stats

`lib/dashboard-job-stats.ts` exports `getDashboardJobItemStats()` used by both Admin and Technician dashboards to avoid duplicated queries. Admin passes `siteId` for site-filtered views; technician passes `technicianId`.

### Reports

`app/reports/` — printable/exportable reports per work order type:
- `maintenance/` — PM cleaning reports
- `install/` — installation reports
- `repair/` — CM repair reports
- `job/[id]/` — per-job report (PDF export via jsPDF/html2pdf)
- `exhaust-fan/[id]/`, `airborne-infection/[id]/`, `clean-room/[id]/` — specialist reports

### Navigation

`app/components/Navigation.tsx` renders role-specific nav links from `navigation/AdminNavLinks.tsx`, `TechnicianNavLinks.tsx`, `ClientNavLinks.tsx`. Navigation is hidden on `/welcome`.

### Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Primary DB (SQLite path or PostgreSQL URL) |
| `DIRECT_URL` | Supabase direct connection (bypasses PgBouncer for migrations) |
| `JWT_SECRET` | Cookie session signing |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key for server-side storage uploads |
| `NEXT_PUBLIC_APP_URL` | Public app URL (used in SEO meta, QR codes, approval links) |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | Upload size limit (auto-set 4 MB on Vercel) |
| `ALLOW_PRODUCTION_DATABASE` | Set `true` to bypass remote DB safety guard in dev |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Bot notifications |

### Deployment

- Docker: `docker compose up` (includes postgres:15 service on port 5433 for testing, web on 3000)
- Vercel: `output: 'standalone'` in `next.config.ts`; image storage via Supabase Storage
- Production DB: Supabase PostgreSQL (requires both `DATABASE_URL` for pooled and `DIRECT_URL` for migrations)
