# holiyay-app

## Tech Stack

| Layer             | Technology                                                            |
| ----------------- | --------------------------------------------------------------------- |
| **Runtime**       | [Node.js](https://nodejs.org) + [pnpm](https://pnpm.io)               |
| **API Framework** | [Hono](https://hono.dev)                                              |
| **Frontend**      | [Next.js](https://nextjs.org)                                         |
| **Database**      | PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)               |
| **Auth**          | JWT (local) / [Supabase Auth](https://supabase.com/auth) (production) |
| **Validation**    | [Zod](https://zod.dev)                                                |
| **AI**            | OpenAI API                                                            |
| **Deployment**    | [Vercel](https://vercel.com) + [Supabase](https://supabase.com)       |

## Architecture

This is a **monorepo** with two packages:

```
holiyay/
├── packages/
│   ├── api/          # Hono backend (Node)
│   └── web/          # Next.js frontend (mounts API)
```

The API follows a clean layered architecture:

```
Request → Routes → Services → Repositories → Database
```

- **Routes** — Thin HTTP layer, handles request/response only
- **Services** — Business logic and orchestration
- **Repositories** — Database access, queries
- **Auth Adapters** — Swappable auth providers (JWT / Supabase)

### Deployment Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Next.js App                          │  │
│  │  ┌─────────────────┐    ┌──────────────────────────────┐  │  │
│  │  │   Pages/App     │    │  /api/[...path]/route.ts     │  │  │
│  │  │   (React UI)    │───▶│  ┌──────────────────────┐    │  │  │
│  │  │                 │    │  │   Hono App (mounted) │    │  │  │
│  │  └─────────────────┘    │  └──────────────────────┘    │  │  │
│  │                         └──────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │           SUPABASE              │
                    │  ┌───────────┐  ┌───────────┐   │
                    │  │ PostgreSQL│  │   Auth    │   │
                    │  └───────────┘  └───────────┘   │
                    └─────────────────────────────────┘
```

The entire app deploys to Vercel as a single Next.js application. The Hono API is mounted inside Next.js API routes, allowing both frontend and backend to run together.

## Project Structure

```
holiyay/
├── packages/
│   ├── api/                         # Backend API
│   │   ├── src/
│   │   │   ├── app.ts               # Hono app (exported for mounting)
│   │   │   ├── index.ts             # Standalone server entry
│   │   │   │
│   │   │   ├── routes/              # HTTP layer (thin)
│   │   │   │   ├── auth.ts
│   │   │   │   ├── calendars.ts
│   │   │   │   ├── items.ts
│   │   │   │   ├── shares.ts
│   │   │   │   └── ai.ts
│   │   │   │
│   │   │   ├── services/            # Business logic
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── calendar.service.ts
│   │   │   │   ├── item.service.ts
│   │   │   │   ├── share.service.ts
│   │   │   │   └── ai.service.ts
│   │   │   │
│   │   │   ├── repositories/        # Database access
│   │   │   │
│   │   │   ├── auth/                # Auth adapters
│   │   │   │   ├── adapter.ts       # Interface
│   │   │   │   ├── factory.ts       # Provider selection
│   │   │   │   ├── jwt.auth.ts      # Local JWT adapter
│   │   │   │   └── supabase.auth.ts # Supabase adapter
│   │   │   │
│   │   │   ├── db/                  # Database
│   │   │   │   ├── schema.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   └── middleware/
│   │   │
│   │   ├── test/
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   └── web/                         # Frontend
│       ├── src/
│       │   └── app/
│       │       ├── api/[[...path]]/ # Mounts Hono API
│       │       │   └── route.ts
│       │       ├── layout.tsx
│       │       └── page.tsx
│       │
│       ├── next.config.ts
│       └── package.json
│
├── docker-compose.yml               # Local Postgres
├── docker-compose.dev.yml           # Full stack Docker (optional)
├── Dockerfile                       # API container
├── Dockerfile.web                   # Web container
├── Makefile                         # Project commands
├── package.json                     # Workspace root
└── tsconfig.base.json
```

## Prerequisites

- [pnpm](https://pnpm.io) v8.x (or Corepack)
- [Node.js](https://nodejs.org) v20+ (for Next.js)
- [Docker](https://docker.com) (for local PostgreSQL)

## Quick Start

### 1. Install dependencies

```bash
pnpm -w install
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run migrations

```bash
make db-migrate
```

### 5. Start development servers

```bash
# Terminal 1: API server (port 3000)
make dev

# Terminal 2: Web server (port 3001)
make dev-web
```

Or run both together:

```bash
make dev-all
```

The API will be at `http://localhost:3000` and the web app at `http://localhost:3001`.

## Environment Variables

### Local Development

```bash
# Database (local Docker Postgres)
DATABASE_URL=postgres://holiyay:holiyay@localhost:5432/holiyay

# Auth: Use local JWT
AUTH_PROVIDER=jwt
JWT_SECRET=dev-secret-change-in-production

# Optional: AI features
OPENAI_API_KEY=sk-...
```

### Production (Vercel + Supabase)

```bash
# Database: Supabase Postgres (use pooler URL for serverless!)
DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Auth: Use Supabase
AUTH_PROVIDER=supabase
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
OPENAI_API_KEY=sk-...
```

| Variable                    | Description                             | Required                      |
| --------------------------- | --------------------------------------- | ----------------------------- |
| `DATABASE_URL`              | PostgreSQL connection string            | ✅                            |
| `AUTH_PROVIDER`             | `jwt` or `supabase`                     | ✅                            |
| `JWT_SECRET`                | Secret for JWT signing (when using jwt) | When `AUTH_PROVIDER=jwt`      |
| `SUPABASE_URL`              | Supabase project URL                    | When `AUTH_PROVIDER=supabase` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key               | When `AUTH_PROVIDER=supabase` |
| `OPENAI_API_KEY`            | OpenAI API key for AI features          | ❌                            |
| `PORT`                      | API server port (default: 3000)         | ❌                            |

## API Endpoints

All endpoints are available at `/api/*` when running in Next.js, or at the root when running the API standalone.

### Authentication

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login`    | Log in              |
| `POST` | `/auth/logout`   | Log out             |
| `GET`  | `/auth/me`       | Get current user    |

### Calendars

| Method   | Endpoint         | Description             |
| -------- | ---------------- | ----------------------- |
| `GET`    | `/calendars`     | List user's calendars   |
| `POST`   | `/calendars`     | Create a calendar       |
| `GET`    | `/calendars/:id` | Get calendar with items |
| `PATCH`  | `/calendars/:id` | Update a calendar       |
| `DELETE` | `/calendars/:id` | Delete a calendar       |

### Items

| Method   | Endpoint                       | Description              |
| -------- | ------------------------------ | ------------------------ |
| `GET`    | `/calendars/:id/items`         | List items in a calendar |
| `POST`   | `/calendars/:id/items`         | Add an item              |
| `POST`   | `/calendars/:id/items/reorder` | Reorder items            |
| `GET`    | `/items/:id`                   | Get a single item        |
| `PATCH`  | `/items/:id`                   | Update an item           |
| `DELETE` | `/items/:id`                   | Delete an item           |

### Sharing

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| `POST` | `/calendars/:id/share`  | Get share link                |
| `POST` | `/calendars/:id/invite` | Invite user by email          |
| `GET`  | `/share/:token`         | View shared calendar (public) |
| `POST` | `/share/:token/join`    | Join as collaborator          |

### AI Features

| Method | Endpoint           | Description                  |
| ------ | ------------------ | ---------------------------- |
| `GET`  | `/ai/status`       | Check if AI is available     |
| `POST` | `/ai/checklist`    | Generate packing checklist   |
| `POST` | `/ai/recommend`    | Get activity recommendations |
| `POST` | `/ai/destinations` | Get destination suggestions  |

## Makefile Commands

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `make install`      | Install all dependencies             |
| `make dev`          | Start API dev server (port 3000)     |
| `make dev-web`      | Start Next.js dev server (port 3001) |
| `make dev-all`      | Start both servers in parallel       |
| `make test`         | Run API tests                        |
| `make lint`         | Check code style                     |
| `make db-generate`  | Generate migrations from schema      |
| `make db-migrate`   | Run database migrations              |
| `make docker-up`    | Start local Postgres                 |
| `make docker-down`  | Stop Postgres                        |
| `make docker-clean` | Stop and remove volumes              |

## Deployment

### Vercel (Recommended)

The entire app deploys to Vercel as a single Next.js application.

1. **Connect your repo to Vercel**

2. **Configure build settings:**
   - Root Directory: `packages/web`
   - Build Command: `pnpm run build`
   - Output Directory: `.next`

3. **Set environment variables:**

   ```
   DATABASE_URL=postgres://...@pooler.supabase.com:6543/postgres
   AUTH_PROVIDER=supabase
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

4. **Deploy!**

The Hono API is automatically mounted at `/api/*` via the catch-all route handler.

### Supabase Setup

1. **Create a Supabase project**

2. **Get your credentials:**
   - Project URL (`SUPABASE_URL`)
   - Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
   - Database URL (use the **pooler** URL for serverless!)

3. **Run migrations against Supabase:**
   ```bash
   DATABASE_URL="postgres://..." make db-migrate
   ```

### Docker (Alternative)

For self-hosted deployments:

```bash
# Build images
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# Run full stack
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Design Decisions

### Monorepo with pnpm Workspaces

Simple workspace configuration using pnpm workspaces. pnpm handles dependency resolution across packages.

### Auth Adapter Pattern

Authentication is abstracted behind an interface. Switch between providers via the `AUTH_PROVIDER` environment variable:

- `jwt` — Local JWT auth with bcrypt password hashing (development, standalone)
- `supabase` — Supabase Auth for production

### Hono Mounted in Next.js

The Hono API is mounted inside Next.js API routes via `@hono/node-server/vercel`. This allows:

- Single Vercel deployment (no separate backend)
- Shared types between frontend and backend
- Full Hono compatibility (middleware, routes, etc.)

### Serverless-Safe Database

The database connection is optimized for serverless:

- Lazy initialization
- Connection pooling (1 connection in serverless mode)
- Uses Supabase's connection pooler (port 6543)
