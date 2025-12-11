# Holiyay Makefile
# Single source of truth for all project commands
# Monorepo structure with packages/api and packages/web

.PHONY: help install dev dev-web dev-all start start-web test lint lint-fix \
        typecheck typecheck-api typecheck-web build-types \
        db-generate db-migrate docker-up docker-down docker-logs docker-clean

# Default target
help:
	@echo "Holiyay - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install       Install all dependencies"
	@echo "  make dev           Start API dev server (port 3000)"
	@echo "  make dev-web       Start Next.js dev server (port 3001)"
	@echo "  make dev-all       Start both API and web in parallel"
	@echo "  make start         Start API production server"
	@echo "  make start-web     Start Next.js production server"
	@echo "  make test          Run API tests"
	@echo "  make lint          Check code style"
	@echo "  make lint-fix      Fix code style"
	@echo ""
	@echo "Type Checking:"
	@echo "  make typecheck     Run TypeScript type checking on all packages"
	@echo "  make typecheck-api Run TypeScript type checking on API package"
	@echo "  make typecheck-web Run TypeScript type checking on web package"
	@echo "  make build-types   Build API type declarations (required for web)"
	@echo ""
	@echo "Database:"
	@echo "  make db-generate           Generate migrations from schema"
	@echo "  make db-migrate            Run database migrations"
	@echo "  make db-generate-local     Generate migrations (uses localhost Postgres if DATABASE_URL is unset)"
	@echo "  make db-migrate-local      Run migrations (uses localhost Postgres if DATABASE_URL is unset)"
	@echo ""
	@echo "Docker (Local Development):"
	@echo "  make docker-up     Start Postgres"
	@echo "  make docker-down   Stop Postgres"
	@echo "  make docker-logs   Follow container logs"
	@echo "  make docker-clean  Stop and remove volumes"
	@echo ""
	@echo "Docker (Full Stack):"
	@echo "  make docker-dev    Start full stack in Docker (watch mode)"
	@echo "  make docker-build  Build Docker images"

# =============================================================================
# Development
# =============================================================================

install:
	pnpm -w install

dev:
	cd packages/api && pnpm run dev

dev-web:
	cd packages/web && pnpm run dev

dev-all:
	@echo "Starting API and Web servers..."
	@make dev & make dev-web

start:
	cd packages/api && pnpm run start

start-web:
	cd packages/web && npm run start

test:
	cd packages/api && pnpm run test

lint:
	pnpm run lint

lint-fix:
	pnpm run lint:fix

# =============================================================================
# Type Checking
# =============================================================================

# Build API type declarations (needed for web package to resolve types)
build-types:
	cd packages/api && pnpm exec tsc --build

# Type check API package only
typecheck-api:
	cd packages/api && pnpm exec tsc --noEmit

# Type check web package (builds API types first if needed)
typecheck-web: build-types
	cd packages/web && pnpm exec tsc --noEmit

# Type check all packages
typecheck: typecheck-api typecheck-web
	@echo "All type checks passed!"

# =============================================================================
# Database
# =============================================================================

db-generate:
	cd packages/api && pnpm run db:generate

db-migrate:
	cd packages/api && pnpm run db:migrate

# Convenience targets for local development (default to localhost Postgres if DATABASE_URL is not set)
db-generate-local:
	@echo "Using DATABASE_URL=${DATABASE_URL:-postgres://holiyay:holiyay@localhost:5432/holiyay}"
	DATABASE_URL=${DATABASE_URL:-postgres://holiyay:holiyay@localhost:5432/holiyay} \
	cd packages/api && pnpm run db:generate

db-migrate-local:
	@echo "Using DATABASE_URL=${DATABASE_URL:-postgres://holiyay:holiyay@localhost:5432/holiyay}"
	DATABASE_URL=${DATABASE_URL:-postgres://holiyay:holiyay@localhost:5432/holiyay} \
	cd packages/api && pnpm run db:migrate

# Wait for Postgres to be ready (used by composite targets below)
db-wait:
	@echo "Starting dev stack (docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d)..."
	@docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d >/dev/null
	@echo -n "Waiting for Postgres to accept connections..."
	@count=0; until docker compose exec -T db pg_isready -U $${POSTGRES_USER:-holiyay} -d $${POSTGRES_DB:-holiyay} >/dev/null 2>&1 || [ $$count -ge 60 ]; do \
		echo -n "."; sleep 1; count=$$((count+1)); \
	done; echo ""; \
	if [ $$count -ge 60 ]; then echo "Timed out waiting for Postgres"; exit 1; fi

# Bring Postgres up and run migrations (or generate)
db-up-and-migrate: db-wait
	@echo "Running migrations..."
	@DATABASE_URL=$${DATABASE_URL:-postgres://$${POSTGRES_USER:-holiyay}:$${POSTGRES_PASSWORD:-holiyay}@localhost:$${DB_PORT:-5432}/$${POSTGRES_DB:-holiyay}} \
	cd packages/api && pnpm run db:migrate

db-up-and-generate: db-wait
	@echo "Generating migrations..."
	@DATABASE_URL=$${DATABASE_URL:-postgres://$${POSTGRES_USER:-holiyay}:$${POSTGRES_PASSWORD:-holiyay}@localhost:$${DB_PORT:-5432}/$${POSTGRES_DB:-holiyay}} \
	cd packages/api && pnpm run db:generate

# =============================================================================
# Docker - Local Development (Postgres only)
# =============================================================================

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-clean:
	docker compose down -v

# =============================================================================
# Docker - Full Stack (optional, for testing production-like setup)
# =============================================================================

docker-dev:
	exec docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --watch

docker-build:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build
