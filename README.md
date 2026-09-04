# ATB Ltd — Healthcare Fintech Platform

**"টাকার অভাবে থামবে না চিকিৎসা"** — _Treatment will not stop due to lack of money._

A complete healthcare financial assistance platform for Bangladesh. ATB Ltd
provides 12,000 BDT in medical bill support to members for eligible hospital
stays.

> **Note:** This is a **monorepo** with backend and frontend in separate app directories.

## Project Structure

```text
atbltd-health/
├── package-lock.json               # ✅ Root workspace lockfile
├── apps/
│   ├── backend/                    # NestJS API (port 3000)
│   │   ├── package.json
│   │   ├── jest.config.js          # ✅ Backend test & coverage thresholds
│   │   ├── .env.example            # ✅ Backend env vars
│   │   ├── .eslintrc.js            # ✅ Backend lint config
│   │   ├── .prettierrc             # ✅ Backend prettier
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/           # Authentication & OTP lifecycle
│   │       │   ├── admin/          # Admin dashboard & payment verification
│   │       │   ├── claim/          # Benefit application processing
│   │       │   ├── commission/     # Agent commission engine
│   │       │   ├── agent/          # Owner/Agent management
│   │       │   ├── hospital/       # Hospital partner portal
│   │       │   ├── notification/   # Real-time notifications
│   │       │   └── sms/            # SMS gateway integration
│   │       ├── entities/           # TypeORM entities
│   │       └── common/             # Guards, decorators, sentry filter
│   └── frontend/                   # Next.js 16 App (port 3001)
│       ├── package.json
│       ├── .env.example            # ✅ Frontend env vars
│       ├── .eslintrc.json          # ✅ Frontend lint config
│       ├── .prettierrc             # ✅ Frontend prettier
│       ├── jest.config.js          # ✅ Frontend test config
│       ├── jest.setup.js
│       └── app/
│           ├── admin/              # Admin/Owner/Agent dashboard
│           ├── dashboard/          # Member dashboard
│           ├── hospital/           # Hospital portal
│           ├── login/              # Login page
│           ├── components/         # Shared components
│           ├── i18n/               # Bengali/English translations
│           └── lib/                # API helpers & auth context
├── base.Dockerfile                 # ✅ Multi-stage workspace Docker build
├── docker-compose.yml              # ✅ Docker Compose configuration
├── .env.example                    # ✅ Root env vars (all variables)
├── .eslintrc.json                  # ✅ Root lint config
├── Dockerfile                      # ✅ Root Dockerfile
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md    # ✅ PR review template
│   └── workflows/
│       ├── ci.yml                  # ✅ CI: lint, test, typecheck, audit
│       └── deploy.yml              # ✅ CD: Docker build & EC2 deploy
├── README.md                       # ✅ This file
├── CHANGELOG.md                    # ✅ Release history
├── CONTRIBUTING.md                 # ✅ Contribution guide
└── MONOREPO.md                     # ✅ Monorepo structure docs
```

## Key Files Location

| File                 | Path                           |
| -------------------- | ------------------------------ |
| Workspace lockfile   | `package-lock.json`            |
| Backend env example  | `apps/backend/.env.example`    |
| Frontend env example | `apps/frontend/.env.example`   |
| Root env example     | `.env.example`                 |
| Backend ESLint       | `apps/backend/.eslintrc.js`    |
| Frontend ESLint      | `apps/frontend/.eslintrc.json` |
| Backend Prettier     | `apps/backend/.prettierrc`     |
| Frontend Prettier    | `apps/frontend/.prettierrc`    |
| Docker (multi-stage) | `base.Dockerfile`              |
| Docker (root)        | `Dockerfile`                   |
| Docker Compose       | `docker-compose.yml`           |
| CI workflow          | `.github/workflows/ci.yml`     |
| CD workflow          | `.github/workflows/deploy.yml` |

## Tech Stack

- **Backend:** NestJS, TypeScript, TypeORM, PostgreSQL, Jest
- **Frontend:** Next.js 16, React 19, Tailwind CSS, React Testing Library
- **Infrastructure:** AWS EC2, Docker, Nginx, GitHub Actions
- **Observability:** Prometheus (`@willsoto/nestjs-prometheus`), Sentry
  (`@sentry/node`), `pino-pretty`
- **SMS:** GreenWeb BD Gateway
- **Auth:** JWT with 5-tier role-based access control
- **Validation:** class-validator, class-transformer, Zod

## Prerequisites

- Node.js 22+
- PostgreSQL 16+
- npm 10+

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/rehmanshawon/atbltd-health.git
cd atbltd-health
```

### 2. Install Workspace Dependencies

```bash
npm ci  # Installs both workspaces from the root lockfile
```

### 3. Configure Environment Variables

```bash
# Backend
cd apps/backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env.local
cd ../..
```

Reference `apps/backend/.env.example` and `apps/frontend/.env.example` for the
complete list of variables.

### 4. Set up the Database

```bash
psql -U postgres -c "CREATE DATABASE atbltd;"
npm run migration:run --workspace=@atbltd-health/backend
```

### 5. Seed Initial Data

```bash
npm run seed
npm run seed:ref
```

## Running Tests

Execute the complete test suite from the repository root:

```bash
npm test
npm run test:cov
npm run typecheck
npm run lint
npm run build
```

Target individual workspaces:

```bash
npm run test:backend
npm run test:frontend
npm run test:e2e:backend
```

### Isolated Zero-Network Test Run

Run unit test suites without Docker, PostgreSQL, SMS gateways, or network calls:

```bash
npm run test:isolated
```

Backend unit tests mock repositories and external gateways. For database-backed
e2e tests, start the disposable test database:

```bash
docker compose -f docker-compose.test.yml up -d --wait
npm run test:e2e:backend
docker compose -f docker-compose.test.yml down -v
```

## Linting & Type Checking

```bash
npm run lint
npm run typecheck
```

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable                 | Description                | Required |
| ------------------------ | -------------------------- | -------- |
| `DB_HOST`                | PostgreSQL host            | Yes      |
| `DB_PORT`                | PostgreSQL port            | Yes      |
| `DB_USERNAME`            | Database username          | Yes      |
| `DB_PASSWORD`            | Database password          | Yes      |
| `DB_DATABASE`            | Database name              | Yes      |
| `DB_SYNCHRONIZE`         | Allow TypeORM schema sync  | No       |
| `DB_MIGRATIONS_RUN`      | Run TypeORM migrations     | No       |
| `JWT_SECRET`             | JWT signing secret         | Yes      |
| `SENTRY_DSN`             | Sentry error tracking DSN  | Optional |
| `GREENWEB_API_TOKEN`     | GreenWeb SMS API token     | Optional |
| `GREENWEB_SENDER_ID`     | SMS sender ID              | Optional |
| `BKASH_MERCHANT_NUMBER`  | bKash merchant number      | Optional |
| `NAGAD_MERCHANT_NUMBER`  | Nagad merchant number      | Optional |
| `ROCKET_MERCHANT_NUMBER` | Rocket merchant number     | Optional |
| `BANK_ACCOUNT`           | Bank account for transfers | Optional |
| `SEED_ADMIN_PASSWORD`    | Seed admin password        | Yes      |
| `SEED_ADMIN2_PASSWORD`   | Seed admin2 password       | Yes      |
| `SEED_OWNER_PASSWORD`    | Seed owner password        | Yes      |
| `SEED_AGENT_PASSWORD`    | Seed agent password        | Yes      |
| `TEST_MEMBER_PASSWORD`   | Seed/test member password  | Yes      |

### Frontend (`apps/frontend/.env.local`)

| Variable              | Description     | Required |
| --------------------- | --------------- | -------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes      |

## Security and Reliability Controls

- CI fails on high and critical npm audit findings; transient registry failures
  retry 3x.
- Payment authorization is atomic, checked for idempotency, and guarded against
  race conditions.
- Sentry captures all unhandled 5xx exceptions and operational faults.
- Prometheus exposes application telemetry and runtime metrics.
- Jest enforces minimum 70% line coverage thresholds.
- Financial approval follows the Maker-Checker workflow.
- Production deploys require passing CI and automated post-deploy health validation.

## Architecture

### Role Hierarchy

```text
SUPER_ADMIN → ADMIN → OWNER → AGENT → MEMBER
```

### Maker-Checker Approval Flow

- **Admin** = Maker (initial review)
- **Super Admin** = Checker (final verification & authorization)
- Items move sequentially from Admin queue to SA queue
- All financial operations require dual control
- Every action produces an audit log

## API Documentation

Base URL: `https://api.atbltd.health/api`

### Observability & Health

- `GET /api/health` — Service health status
- `GET /api/metrics` — Prometheus telemetry & runtime metrics

### Authentication

- `POST /api/auth/login` — Staff login (ID + password)
- `POST /api/auth/member-login` — Member login (ID only)
- `POST /api/auth/register` — Member registration
- `GET /api/auth/profile` — Get profile

### Benefits (Claims)

- `GET /api/claims` — List applications (admin)
- `POST /api/claims` — Submit application (member)
- `GET /api/claims/mine` — Get own applications
- `PUT /api/claims/:id/status` — Update status (Maker-Checker)
- `POST /api/claims/:id/documents/upload` — Upload documents

### Admin & Payments

- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/payments` — Payment list
- `POST /api/admin/payments/:id/verify` — Verify payment (Maker-Checker)

### Notifications

- `GET /api/notifications` — Get notifications
- `PUT /api/notifications/:id/read` — Mark as read
- `PUT /api/notifications/mark-all-read` — Mark all read

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

Proprietary — Astha Treatment Bills Ltd. All rights reserved.
