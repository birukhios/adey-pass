# Adey Pass

Adey Pass is a production-ready prototype for event registration, special guest invitations, secure QR ticket links, National/Fayda ID verification workflow, gate check-in, walk-in registration, dashboard reporting, and role-based admin settings.

The MVP is intentionally focused on registration-only events. Seat maps, seat numbers, and full stadium seating assignment are not part of this first version. Gates are configurable and optional.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- Prisma ORM with SQLite for local prototype; PostgreSQL-ready schema path for production
- Zod, React Hook Form, QR, scanner, chart, CSV, and icon packages

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Use the default local SQLite `DATABASE_URL`, or switch it to PostgreSQL for production.

4. Generate Prisma Client:

```bash
npm run prisma:generate
```

5. Push the schema and seed data:

```bash
npx prisma db push
npm run prisma:seed
```

6. Start the app:

```bash
npm run dev
```

## Seed Accounts

All seed accounts use:

```text
AdeyPass@2026
```

- `super@adeypass.local` - Super Admin
- `events@adeypass.local` - Event Admin
- `gate@adeypass.local` - Gate Officer
- `protocol@adeypass.local` - Protocol Officer
- `security@adeypass.local` - Security Officer
- `reports@adeypass.local` - Report Viewer

## Implemented Foundation

- Adey Pass brand system and app shell
- Credentials authentication with NextAuth, Prisma users, session roles, and permission-aware proxy route protection
- Dashboard, events, guests, tickets, scanner, reports, and settings routes
- Public ticket and verification pages
- Public RSVP invitation page: `/rsvp/[token]`
- Public organization guest submission page: `/organization/[eventId]`
- Guest CSV bulk upload with template download, preview validation, API import route, and audit log creation
- Prisma schema for users, roles, permissions, events, gates, guests, invitations, organization submissions, OTP challenges, tickets, QR tokens, ID verifications, check-ins, walk-ins, ticket templates, audit logs, and app settings
- Seed data for roles, users, gates, categories, sample event, guests, and generated tickets
- Mock OTP verification for Fayda/National ID and walk-in registration
- Gate-aware scanner validation, duplicate scan tracking, and report export sections

## Verification

```bash
npm run lint
npm run build
```

`npx prisma generate` requires access to Prisma's binary CDN the first time the query engine is downloaded.

## Phase Status

- Phase 1: Project setup and branded shell complete
- Phase 2: Credentials auth, first-admin setup, session roles, and protected admin routes implemented
- Phase 3-9: Event, gates, guest, invitation RSVP, organization submissions, ticket, verification, scanner, walk-in, dashboard, and reports implemented
- Phase 10: Production deployment, real SMS/Fayda provider integration, and load testing remain environment-dependent
