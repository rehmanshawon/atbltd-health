# ATB Ltd — Healthcare Fintech Platform

**"টাকার অভাবে থামবে না চিকিৎসা"** — _Treatment will not stop due to lack of money._

A complete healthcare financial assistance platform for Bangladesh. ATB Ltd provides 12,000 BDT in medical bill support to members for eligible hospital stays.

## Project Structure

```
atbltd-health/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Authentication & JWT
│   │   │   │   ├── admin/      # Admin dashboard & payment verification
│   │   │   │   ├── claim/      # Benefit application processing
│   │   │   │   ├── commission/ # Agent commission engine
│   │   │   │   ├── agent/      # Owner/Agent management
│   │   │   │   ├── hospital/   # Hospital partner portal
│   │   │   │   ├── notification/ # Real-time notifications
│   │   │   │   └── sms/        # SMS gateway integration
│   │   │   ├── entities/       # TypeORM entities
│   │   │   └── common/         # Guards, decorators, enums
│   │   └── test/              # E2E tests
│   └── frontend/         # Next.js 16 App
│       ├── app/
│       │   ├── admin/          # Admin/Owner/Agent dashboard
│       │   ├── dashboard/      # Member dashboard
│       │   ├── hospital/       # Hospital portal
│       │   ├── login/          # Login page
│       │   ├── components/     # Shared components
│       │   ├── i18n/           # Bengali/English translations
│       │   └── lib/            # API helpers & auth context
│       └── public/            # Static assets
├── base.Dockerfile       # Multi-stage Docker build
├── docker-compose.yml    # Docker Compose configuration
└── .github/workflows/    # CI/CD pipelines
```

## Tech Stack

- **Backend:** NestJS, TypeScript, TypeORM, PostgreSQL
- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Infrastructure:** AWS EC2, Docker, Nginx
- **CI/CD:** GitHub Actions
- **SMS:** GreenWeb BD Gateway
- **Auth:** JWT with role-based access control

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
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

Copy the example env files:

```bash
cd ../backend
cp .env.example .env

cd ../frontend
cp .env.example .env.local
```

Update the values in both files with your actual credentials.

### 5. Set up the Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE atbltd;"

# Run migrations (auto-sync in development)
# The backend uses TypeORM synchronize: true in dev
```

### 6. Seed Initial Data

```bash
cd apps/backend
npm run seed
npm run seed:ref
```

This creates:

- Super Admin: `ATB-26-SA-1` / `Admin@ATB2026`
- Admin: `ATB-26-AD-1` / `Admin2@ATB2026`
- Owner: `ATB-26-OW-1` / `Owner@ATB2026`
- Agent: `ATB-26-AG-1` / `Agent@ATB2026`
- Member: `ATB-26-ME-01` (no password required)

## Running the Application

### Development Mode

**Backend:**

```bash
cd apps/backend
npm run start:dev
# Runs on http://localhost:3000
```

**Frontend:**

```bash
cd apps/frontend
npm run dev
# Runs on http://localhost:3001
```

### Production (Docker)

```bash
docker compose up -d
```

## Running Tests

### Backend Tests

```bash
cd apps/backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # With coverage report
```

### Frontend Tests

```bash
cd apps/frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # With coverage report
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

| Variable             | Description            | Required |
| -------------------- | ---------------------- | -------- |
| `DB_HOST`            | PostgreSQL host        | Yes      |
| `DB_PORT`            | PostgreSQL port        | Yes      |
| `DB_USERNAME`        | Database username      | Yes      |
| `DB_PASSWORD`        | Database password      | Yes      |
| `DB_DATABASE`        | Database name          | Yes      |
| `JWT_SECRET`         | JWT signing secret     | Yes      |
| `GREENWEB_API_TOKEN` | GreenWeb SMS API token | Optional |
| `GREENWEB_SENDER_ID` | SMS sender ID          | Optional |

### Frontend (`apps/frontend/.env.local`)

| Variable              | Description     | Required |
| --------------------- | --------------- | -------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes      |

## Deployment

The application auto-deploys to AWS EC2 via GitHub Actions on push to `main`:

1. GitHub Actions builds Docker images
2. Images pushed to Docker Hub
3. SSH to EC2 pulls latest images
4. Docker Compose restarts containers

## Architecture

### Role Hierarchy

```
SUPER_ADMIN → ADMIN → OWNER → AGENT → MEMBER
```

### Maker-Checker Approval Flow

- **Admin** = Maker (first approval)
- **Super Admin** = Checker (final approval)
- Financial operations require dual control
- All actions audit-logged

## API Documentation

The API is available at `https://api.atbltd.health/api`. Key endpoints:

- `POST /api/auth/login` — Staff login
- `POST /api/auth/member-login` — Member login (ID only)
- `POST /api/auth/register` — Member registration
- `GET /api/claims` — List applications (admin)
- `POST /api/claims` — Submit application (member)
- `PUT /api/claims/:id/status` — Update application status
- `GET /api/notifications` — Get notifications
- `GET /api/admin/dashboard` — Dashboard stats

## License

Proprietary — Astha Treatment Bills Ltd. All rights reserved.

```



```
