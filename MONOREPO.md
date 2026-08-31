# Monorepo Structure Guide

This repository uses a **monorepo** architecture with separate apps for backend and frontend.

## Why Monorepo?

- Single source of truth for shared types
- Coordinated versioning across services
- Unified CI/CD pipeline
- Easier cross-cutting changes

## Directory Overview

| Directory        | Purpose                 | Port |
| ---------------- | ----------------------- | ---- |
| `apps/backend/`  | NestJS API server       | 3000 |
| `apps/frontend/` | Next.js web application | 3001 |

## Key Files

### Lockfiles

- `apps/backend/package-lock.json` — Backend dependency lockfile
- `apps/frontend/package-lock.json` — Frontend dependency lockfile

### Environment

- `apps/backend/.env.example` — Backend environment template
- `apps/frontend/.env.example` — Frontend environment template
- `.env.example` — Root environment template (all variables)

### Linting

- `apps/backend/.eslintrc.js` — Backend ESLint configuration
- `apps/frontend/.eslintrc.json` — Frontend ESLint configuration
- `.eslintrc.json` — Root ESLint configuration

### Formatting

- `apps/backend/.prettierrc` — Backend Prettier configuration
- `apps/frontend/.prettierrc` — Frontend Prettier configuration

### Docker

- `base.Dockerfile` — Multi-stage build for both apps
- `Dockerfile` — Root-level Dockerfile
- `docker-compose.yml` — Docker Compose orchestration

### CI/CD

- `.github/workflows/ci.yml` — Validation pipeline (lint, test, typecheck, audit)
- `.github/workflows/deploy.yml` — Deployment pipeline (Docker build + EC2 deploy)

### Root Level Files (for tooling detection)

- `.env.example` — All environment variables in one place
- `.eslintrc.json` — Root-level ESLint configuration
- `Dockerfile` — Root-level Dockerfile
- `README.md` — Main documentation
- `CHANGELOG.md` — Release history
- `CONTRIBUTING.md` — Contribution guide

## Development Commands

```bash
# Backend
cd apps/backend
npm ci          # Install with lockfile
npm test        # Run tests
npm run lint    # Lint

# Frontend
cd apps/frontend
npm ci          # Install with lockfile
npm test        # Run tests
npm run lint    # Lint
```

## Test Coverage

| App      | Test Files | Total Tests | Coverage         |
| -------- | ---------- | ----------- | ---------------- |
| Backend  | 14         | 74          | 40.7% statements |
| Frontend | 4          | 10          | 64.5% statements |
