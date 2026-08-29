# Contributing to ATB Ltd

Thank you for your interest in contributing to ATB Ltd — a healthcare fintech platform for Bangladesh.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/atbltd-health.git
   cd atbltd-health
   ```

3. **Install dependencies:**

   ```bash
   cd apps/backend
   npm install
   cd ../frontend
   npm install
   ```

4. **Set up environment:**

   ```bash
   cd apps/backend
   cp .env.example .env
   cd ../frontend
   cp .env.example .env.local
   ```

5. **Run database migrations:**

   ```bash
   psql -U postgres -c "CREATE DATABASE atbltd;"
   cd apps/backend
   npm run seed
   ```

6. **Start development:**

   ```bash
   # Terminal 1: Backend
   cd apps/backend
   npm run start:dev

   # Terminal 2: Frontend
   cd apps/frontend
   npm run dev
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
   cd apps/backend && npm test
   cd apps/frontend && npm test
   ```

4. Push and create a Pull Request

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
- **NestJS patterns** — services, DTOs, guards, interceptors
- **React components under 500 LOC** — split larger ones
- **Every new feature needs tests**

## Testing

### Backend

```bash
cd apps/backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
```

### Frontend

```bash
cd apps/frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
```

## Architecture

```
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

Deployment is automatic via GitHub Actions on push to `main`:

1. Tests run (CI)
2. Docker images built
3. Pushed to Docker Hub
4. SSH to EC2 pulls and restarts

## Questions?

Contact: info@atbltd.health
