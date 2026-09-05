# Tech Stack

Every choice runs offline inside our Docker Compose stack. No external network calls at demo time.

## Locked

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind | Team knows it, fast HMR |
| Backend | Node 20 + Express + **TypeScript** | TS is not optional in money code |
| Database | **PostgreSQL 16** | Reviewers care specifically |
| ORM | Prisma | Migrations, transactions, type safety. `schema.sql` is ORM-agnostic — raw `pg` also fine |
| Auth | Self-built JWT in httpOnly cookies + **Argon2id** | No BaaS. Plaintext or SHA-256 = instant disqualification |
| Validation | **Zod**, schemas shared client + server | One source of truth |
| Money | `DECIMAL(14,2)` in PG, **decimal.js** in JS | Floats produce ₹0.01 drift and kill the correctness demo |
| Forms | React Hook Form + Zod resolver | |
| Server state | React Query | Cache invalidation after posting |
| Charts | Recharts | Budget pie, dashboard trends |
| PDF | **Puppeteer** HTML→PDF, server-side | Deterministic. Never browser print dialog. Bake Chromium into the image |
| Real-time | Socket.IO | Live report updates (Tier 2) |
| Search | Postgres `tsvector` | Using PG's own capability beats bolting on Elasticsearch |
| Containers | Docker Compose: `api`, `web`, `db` | Containerisation is judged |
| Load test | k6 or autocannon | Our throughput numbers |

## Deliberately not used

| Rejected | Reason |
|---|---|
| **Odoo itself** | Using their accounting engine means we configured, not built. Reviewers wrote that engine — nothing left to evaluate. We mirror the architecture instead |
| Gemini / OpenAI / any LLM API | External API, violates the core constraint |
| Web Speech API | Streams audio to Google's servers. No key needed, but **not local** |
| Cloud OCR | External API |
| Redis | Cannot name the query it fixes at demo scale |
| Elasticsearch | Postgres FTS is sufficient and more impressive here |
| Auth0 / Clerk / Firebase | BaaS |
| Three.js + GLB | Out of scope. The 360° viewer is an image sequence |
| Google Fonts CDN | External network call. Self-host `.woff2` |
| Floats for money | Non-negotiable |

## Docker Compose

```yaml
services:
  db:    postgres:16-alpine        # volume-backed
  api:   node:20 + chromium        # :5000
  web:   node:20 → nginx           # :5173 / :80
```

Optional if email lands in Tier 1: `mailpit` (real SMTP, visible inbox, zero network).

## Versions to pin

```
node 20.x · postgres 16 · react 18.3 · vite 5 · tailwind 3.4
prisma 5.x · zod 3.23 · decimal.js 10.4 · socket.io 4.7 · puppeteer 22
```

## Environment

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/urban
JWT_SECRET=<random 32 bytes>
NODE_ENV=development
COOKIE_SECURE=false        # local dev only
CORS_ORIGIN=http://localhost:5173
```

`credentials: true` on both CORS config and the frontend fetch/socket client. Missing either breaks auth across the Docker network boundary — a real bug we have hit before.

## What to say on stage

- "Postgres, self-built API, no third-party services. It runs with the network cable pulled out."
- "Money is DECIMAL end to end. No floats anywhere."
- "The balance invariant is a Postgres constraint trigger, not application validation."
