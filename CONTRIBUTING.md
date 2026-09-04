# Contributing to ATB Ltd

Thank you for your interest in contributing to ATB Ltd — a healthcare fintech
platform for Bangladesh.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/atbltd-health.git
   cd atbltd-health
   ```

3. **Install dependencies:**

   ```bash
   npm ci
   ```

4. **Set up environment:**

   ```bash
   cd apps/backend
   cp .env.example .env
   cd ../frontend
   cp .env.example .env.local
   cd ../..
   ```

5. **Run database migrations:**

   ```bash
   psql -U postgres -c "CREATE DATABASE atbltd;"
   npm run migration:run --workspace=@atbltd-health/backend
   npm run seed
   ```

   Never use `docker compose down -v` against the production project. Production
   schema synchronization is disabled, and the existing EC2 schema must be
   backed up and baselined before automatic migrations are enabled.

6. **Start development:**

   ```bash
   # Terminal 1: Backend
   npm run dev:backend

   # Terminal 2: Frontend
   npm run dev:frontend
   ```

## Development Workflow

1. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit using conventional commits:

   ```bash
   git commit -m "feat: add new feature"
   ```

3. Run tests before pushing:

   ```bash
   npm test
   npm run typecheck
   npm run lint
   ```

4. Push and create a Pull Request.

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix      | Purpose            | Example                             |
| ----------- | ------------------ | ----------------------------------- |
| `feat:`     | New feature        | `feat: add hospital verification`   |
| `fix:`      | Bug fix            | `fix: resolve login redirect loop`  |
| `docs:`     | Documentation      | `docs: update API docs`             |
| `test:`     | Add tests          | `test: add auth service tests`      |
| `refactor:` | Code restructuring | `refactor: split large component`   |
| `chore:`    | Maintenance        | `chore: update dependencies`        |
| `ci:`       | CI/CD              | `ci: add test job`                  |
| `security:` | Security fix       | `security: remove hardcoded secret` |

## Code Style

- **TypeScript** with strict null checks where possible
- **ESLint + Prettier** — run `npm run lint` before committing
- **NestJS patterns** — modular services, typed DTOs, guards, interceptors
- **React components under 500 LOC** — split larger ones
- **Every new feature needs tests**

## Testing

### Standard Suite

```bash
npm test
npm run test:cov
```

### Backend

```bash
npm run test:backend
npm run test:cov:backend
npm run test:e2e:backend
```

### Frontend

```bash
npm run test:frontend
npm run test:cov:frontend
```

### Isolated Zero-Network Testing

Run tests in an offline, isolated environment with zero external dependencies:

```bash
npm run test:isolated
```

All external services (SMS gateways like GreenWeb, payment gateways like
bKash/Nagad) are fully mocked with Jest to guarantee deterministic,
account-free test execution.

## Architecture

```text
SUPER_ADMIN → ADMIN → OWNER → AGENT → MEMBER
```

### Maker-Checker Flow

- **Admin** = Maker (first approval)
- **Super Admin** = Checker (final approval)
- All financial operations require dual control
- Every action is audit-logged

## Docker

```bash
docker compose up -d
```

## Deployment

Deployment is triggered after GitHub Actions CI succeeds on `main`:

1. Backend and frontend tests, typechecks, lint, audits, E2E tests, and migration
   validation run in CI.
2. Docker images are built from the exact CI-validated commit.
3. Images are pushed to Docker Hub.
4. EC2 pulls and restarts the containers.
5. Backend and frontend health checks must pass before deployment succeeds.

## Questions?

Contact: <info@atbltd.health>
