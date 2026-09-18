# BT Automazgātava — Online Booking System

Production-ready booking system for manual car wash.

**Stack:** Nuxt 3 · TypeScript · PostgreSQL (Neon) · Drizzle ORM · Vercel

---

## Requirements

- Node.js 20+
- PostgreSQL (Neon recommended)
- npm

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/Aleksandr202020/bt_booking_giok.git
cd bt_booking_giok
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in:

```env
DATABASE_URL=postgresql://...   # from Neon
SESSION_SECRET=...              # long random string
APP_URL=http://localhost:3000
```

### 3. Database

```bash
# Push schema (development)
npm run db:push

# Or generate + run migrations
npm run db:generate
npm run db:migrate

# Seed development data
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## Development credentials (seed)

| Role     | Email                        | Password      |
|----------|------------------------------|---------------|
| Admin    | admin@bt-automazgatava.lv    | Admin123!     |
| Customer | customer@example.com         | Customer123!  |

**Never use these in production.**

---

## Scripts

| Command            | Description                |
|--------------------|----------------------------|
| `npm run dev`      | Development server         |
| `npm run build`    | Production build           |
| `npm run typecheck`| TypeScript check           |
| `npm run test`     | Run tests                  |
| `npm run db:push`  | Push schema to DB          |
| `npm run db:generate` | Generate migrations     |
| `npm run db:migrate`  | Apply migrations         |
| `npm run db:seed`  | Seed development data      |
| `npm run db:studio`| Drizzle Studio             |

---

## Architecture (Phase 1)

- `server/database/schema.ts` — full PostgreSQL schema
- `server/database/index.ts` — Drizzle client
- `server/database/seed.ts` — development seed
- `server/utils/constants.ts` — business constants
- Critical unique index on active bookings (prevents double booking)

---

## Deployment

- **Code:** GitHub
- **App:** Vercel (connected to this repo)
- **Database:** Neon

Set the same environment variables in Vercel project settings.

---

## Phases

1. ✅ Foundation (schema, migrations, seed, constants)
2. Auth + Users + Ban
3. Cars + Services + Pricing
4. Booking Engine + Availability + Concurrency
5. Customer API + UI
6. Admin API + UI
7. i18n + Polish + CI + Security audit
