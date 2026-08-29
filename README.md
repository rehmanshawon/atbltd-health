# ATB Ltd — Healthcare Fintech Platform

**"টাকার অভাবে থামবে না চিকিৎসা"** — _Treatment will not stop due to lack of money._

A complete healthcare financial assistance platform for Bangladesh. ATB Ltd provides 12,000 BDT in medical bill support to members for eligible hospital stays.

> **Note:** This is a **monorepo** with backend and frontend in separate app directories.

## Project Structure

```
atbltd-health/
├── apps/
│   ├── backend/                    # NestJS API (port 3000)
│   │   ├── package.json
│   │   ├── package-lock.json       # ✅ Backend lockfile
│   │   ├── .env.example            # ✅ Backend env vars
│   │   ├── .eslintrc.js            # ✅ Backend lint config
│   │   ├── .prettierrc             # ✅ Backend prettier
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/           # Authentication & JWT
│   │       │   ├── admin/          # Admin dashboard & payment verification
│   │       │   ├── claim/          # Benefit application processing
│   │       │   ├── commission/     # Agent commission engine
│   │       │   ├── agent/          # Owner/Agent management
│   │       │   ├── hospital/       # Hospital partner portal
│   │       │   ├── notification/   # Real-time notifications
│   │       │   └── sms/            # SMS gateway integration
│   │       ├── entities/           # TypeORM entities
│   │       └── common/             # Guards, decorators, enums
│   └── frontend/                   # Next.js 16 App (port 3001)
│       ├── package.json
│       ├── package-lock.json       # ✅ Frontend lockfile
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
├── base.Dockerfile                 # ✅ Multi-stage Docker build
├── docker-compose.yml              # ✅ Docker Compose configuration
├── .env.example                    # ✅ Root env vars (all variables)
├── .eslintrc.json                  # ✅ Root lint config
├── Dockerfile                      # ✅ Root Dockerfile
├── .github/workflows/
│   ├── ci.yml                      # ✅ CI: lint, test, typecheck, audit
│   └── deploy.yml                  # ✅ CD: Docker build & EC2 deploy
├── README.md                       # ✅ This file
├── CHANGELOG.md                    # ✅ Release history
├── CONTRIBUTING.md                 # ✅ Contribution guide
└── MONOREPO.md                     # ✅ Monorepo structure docs
```

## Key Files Location

| File                 | Path                              |
| -------------------- | --------------------------------- |
| Backend lockfile     | `apps/backend/package-lock.json`  |
| Frontend lockfile    | `apps/frontend/package-lock.json` |
| Backend env example  | `apps/backend/.env.example`       |
| Frontend env example | `apps/frontend/.env.example`      |
| Root env example     | `.env.example`                    |
| Backend ESLint       | `apps/backend/.eslintrc.js`       |
| Frontend ESLint      | `apps/frontend/.eslintrc.json`    |
| Backend Prettier     | `apps/backend/.prettierrc`        |
| Frontend Prettier    | `apps/frontend/.prettierrc`       |
| Docker (multi-stage) | `base.Dockerfile`                 |
| Docker (root)        | `Dockerfile`                      |
| Docker Compose       | `docker-compose.yml`              |
| CI workflow          | `.github/workflows/ci.yml`        |
| CD workflow          | `.github/workflows/deploy.yml`    |

## Tech Stack

- **Backend:** NestJS, TypeScript, TypeORM, PostgreSQL, Jest
- **Frontend:** Next.js 16, React 19, Tailwind CSS, React Testing Library
- **Infrastructure:** AWS EC2, Docker, Nginx, GitHub Actions
- **SMS:** GreenWeb BD Gateway
- **Auth:** JWT with 5-tier role-based access control
- **Logging:** nestjs-pino (structured JSON logging)

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

### 2. Install Backend Dependencies

```bash
cd apps/backend
npm ci  # Uses committed package-lock.json
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm ci  # Uses committed package-lock.json
```

### 4. Configure Environment Variables

```bash
# Backend
cd apps/backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env.local
```

Reference `apps/backend/.env.example` and `apps/frontend/.env.example` for the complete list of variables.

### 5. Set up the Database

```bash
psql -U postgres -c "CREATE DATABASE atbltd;"
```

### 6. Seed Initial Data

```bash
cd apps/backend
npm run seed
npm run seed:ref
```

## Running Tests

### Backend (55 tests across 7 suites)

```bash
cd apps/backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report (thresholds enforced)
```

### Frontend (5 tests)

```bash
cd apps/frontend
npm test              # Run all tests
npm run test:cov      # Coverage report (thresholds enforced)
```

## Linting & Type Checking

```bash
# Backend
cd apps/backend
npm run lint
npx tsc --noEmit

# Frontend
cd apps/frontend
npm run lint
npx tsc --noEmit
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
| `JWT_SECRET`             | JWT signing secret         | Yes      |
| `GREENWEB_API_TOKEN`     | GreenWeb SMS API token     | Optional |
| `GREENWEB_SENDER_ID`     | SMS sender ID              | Optional |
| `BKASH_MERCHANT_NUMBER`  | bKash merchant number      | Optional |
| `NAGAD_MERCHANT_NUMBER`  | Nagad merchant number      | Optional |
| `ROCKET_MERCHANT_NUMBER` | Rocket merchant number     | Optional |
| `BANK_ACCOUNT`           | Bank account for transfers | Optional |
| `SEED_ADMIN_PASSWORD`    | Seed admin password        | Optional |
| `SEED_ADMIN2_PASSWORD`   | Seed admin2 password       | Optional |
| `SEED_OWNER_PASSWORD`    | Seed owner password        | Optional |
| `SEED_AGENT_PASSWORD`    | Seed agent password        | Optional |

### Frontend (`apps/frontend/.env.local`)

| Variable              | Description     | Required |
| --------------------- | --------------- | -------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes      |

## Deployment

Deployment is automated via `.github/workflows/deploy.yml`:

1. CI runs (`.github/workflows/ci.yml`): lint, test, typecheck, audit
2. Docker images built via `base.Dockerfile`
3. Images pushed to Docker Hub
4. SSH to EC2 pulls and restarts containers
5. Nginx serves frontend with SSL

## Architecture

### Role Hierarchy

```
SUPER_ADMIN → ADMIN → OWNER → AGENT → MEMBER
```

### Maker-Checker Approval Flow

- **Admin** = Maker (first review)
- **Super Admin** = Checker (final approval)
- Sequential workflow: items move from Admin queue to SA queue
- All financial operations require dual control
- Every action is audit-logged

## API Documentation

Base URL: `https://api.atbltd.health/api`

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

### Admin

- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/payments` — Payment list
- `POST /api/admin/payments/:id/verify` — Verify payment

### Notifications

- `GET /api/notifications` — Get notifications
- `PUT /api/notifications/:id/read` — Mark as read
- `PUT /api/notifications/mark-all-read` — Mark all read

### Health

- `GET /api/health` — Health check endpoint

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

Proprietary — Astha Treatment Bills Ltd. All rights reserved.
