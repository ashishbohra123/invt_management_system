# Inventory Management System

Multi-portal inventory management application with an Express REST API, PostgreSQL database, and three React frontends (Admin, Partner, Customer).

## Architecture Overview

```
┌──────────────┐  ┌───────────────┐  ┌────────────────┐
│ Admin Portal │  │Partner Portal │  │Customer Portal │
│  React+Vite  │  │  React+Vite   │  │  React+Vite    │
│   :3001      │  │   :3002       │  │   :3003        │
└──────┬───────┘  └───────┬───────┘  └───────┬────────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                         │ HTTP REST
                         ▼
                  ┌──────────────┐
                  │  Express API │
                  │   :3000      │
                  └──────┬───────┘
                         │ SQL
                         ▼
                  ┌──────────────┐
                  │  PostgreSQL  │
                  │   :5432      │
                  └──────────────┘
```

### Modules

| Module     | Portal(s)             | Description                          |
|------------|-----------------------|--------------------------------------|
| Tenant     | Admin                 | Multi-tenant organization management |
| User       | Admin                 | User accounts, roles, portal access  |
| Product    | Partner, Customer     | Product catalog with categories      |
| Inventory  | Partner               | Stock tracking and low-stock alerts  |
| Order      | Partner, Customer     | Order lifecycle with approve/cancel  |

## Prerequisites

- **Node.js** >= 18 (recommended: 20 LTS)
- **npm** (ships with Node.js) or **pnpm** (optional — `npm install -g pnpm`)
- **Docker** (optional — for PostgreSQL and containerized services)
- **Git** — to clone the repository

## Quick Start

### 1. Clone the repository

```bash
git clone -b pocFirstDraft https://github.com/ashishbohra123/invt_management_system.git
cd invt_management_system
```

### 2. Install dependencies

Using npm (recommended):

```bash
npm install
```

Or using pnpm (if installed):

```bash
pnpm install
```

This installs dependencies for all packages: `src/shared`, `src/server`, and all three portals.

### 3. Set up environment

Copy the example environment file (edit if needed):

```bash
cp .env.example .env
```

Default `.env` values:
```
PORT=3000              # Server port
DB_HOST=localhost      # PostgreSQL host
DB_PORT=5432           # PostgreSQL port
DB_NAME=invt_mgmt      # Database name
DB_USER=postgres       # Database user
DB_PASSWORD=postgres   # Database password
JWT_SECRET=change-me-in-production
```

### 4. Start PostgreSQL

**Option A — Using Docker (recommended):**

```bash
docker compose up postgres -d
```

**Option B — Using a local PostgreSQL installation:**

Create the database manually:
```bash
createdb invt_mgmt
psql -d invt_mgmt -f src/db/init.sql
```

### 5. Run database initialization

The schema is in `src/db/init.sql`. If using Docker Compose, it runs automatically on first start. Otherwise:

```bash
psql -d invt_mgmt -f src/db/init.sql
```

This creates the following tables:
- `tenants` — Multi-tenant organizations
- `users` — User accounts with roles and portal access
- `products` — Product catalog with categories
- `inventory` — Stock levels (1:1 with products)
- `orders` — Order lifecycle with audit trail

### 6. Start the application

```bash
npm run dev
```

Or using pnpm:

```bash
pnpm dev
```

This starts all services in parallel:

| Service         | URL                       | Description                |
|-----------------|---------------------------|----------------------------|
| Express API     | http://localhost:3000      | REST API backend           |
| Admin Portal    | http://localhost:3001      | Admin dashboard            |
| Partner Portal  | http://localhost:3002      | Partner operations         |
| Customer Portal | http://localhost:3003      | Customer self-service      |

### 7. Verify it's running

```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"2026-06-26T..."}
```

## Available Scripts

Run from the project root:

| Command                                    | Description                                |
|--------------------------------------------|--------------------------------------------|
| `npm run dev` or `npm start`               | Start all services in development mode     |
| `npm run build`                            | Build all packages for production          |
| `npm run lint`                             | Type-check all packages                    |
| `npm run test`                             | Run all tests                              |
| `npm run dev -w @moc/server`               | Start only the API server                  |
| `npm run dev -w @moc/admin-portal`         | Start only Admin Portal                    |

Per-package scripts (run from `src/<package>`):

| Package         | `npm run dev`                   | `npm run build`    |
|-----------------|---------------------------------|--------------------|
| `@moc/server`   | `tsx watch src/index.ts`        | `tsc`              |
| `@moc/*-portal` | `vite`                          | `tsc && vite build` |

## Detailed Setup (Per Service)

### Server (Express API)

```bash
cd src/server
npm run dev
```

The server starts on port 3000. Available API endpoints:

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/health`               | Health check             |
| POST   | `/api/auth/login`           | User login               |
| POST   | `/api/auth/register`        | User registration        |
| GET    | `/api/tenants`              | List tenants             |
| POST   | `/api/tenants`              | Create tenant            |
| PUT    | `/api/tenants/:id`          | Update tenant            |
| DELETE | `/api/tenants/:id`          | Delete tenant            |
| GET    | `/api/users`                | List users               |
| POST   | `/api/users`                | Create user              |
| PUT    | `/api/users/:id`            | Update user              |
| DELETE | `/api/users/:id`            | Delete user              |
| GET    | `/api/products`             | List products            |
| POST   | `/api/products`             | Create product           |
| PUT    | `/api/products/:id`         | Update product           |
| DELETE | `/api/products/:id`         | Delete product           |
| GET    | `/api/inventory`            | List inventory           |
| PUT    | `/api/inventory/:id`        | Update stock             |
| GET    | `/api/orders`               | List orders              |
| POST   | `/api/orders`               | Create order             |
| PUT    | `/api/orders/:id/approve`   | Approve order            |
| PUT    | `/api/orders/:id/cancel`    | Cancel order             |

### Admin Portal

```bash
cd src/admin-portal
npm run dev
```

Opens at http://localhost:3001. Routes:
- `/` — Dashboard
- `/users` — User management (CRUD with search, pagination, role/portal access)
- `/tenants` — Tenant management (CRUD with domain management)

### User Portal

```bash
cd src/user-portal
npm run dev
```

Opens at http://localhost:3002. Routes:
- `/` — Dashboard
- `/products` — Product catalog
- `/inventory` — Stock levels
- `/orders` — Order management

## Docker Setup

Build and run all services:

```bash
docker compose up --build
```

This starts:
- **postgres** — PostgreSQL 16 with auto-schema initialization
- **server** — Express API (port 3000)
- **admin-portal** — Admin frontend via nginx (port 3001)
- **user-portal** — User frontend via nginx (port 3002)

Stop all services:

```bash
docker compose down
```

To remove the database volume as well:

```bash
docker compose down -v
```

## Project Structure

```
invt_management_system/
├── .github/workflows/ci.yml   # CI pipeline (lint, test, build)
├── scope/                      # Module dependency documentation
│   ├── tenant-module.md
│   ├── user-module.md
│   ├── product-module.md
│   ├── inventory-module.md
│   └── order-module.md
├── src/
│   ├── shared/                 # Shared package (workspace dependency)
│   │   ├── constants/          # API paths, pagination defaults
│   │   ├── enums/              # Portals, roles, categories, statuses
│   │   ├── errors/             # Error code constants
│   │   ├── services/           # Shared API client and service modules
│   │   ├── types/              # User, Tenant, and other shared interfaces
│   │   └── validators/         # Email, SKU validation
│   ├── server/                 # Express REST API
│   │   └── src/
│   │       ├── config/         # Environment config, DB pool
│   │       ├── controllers/    # Request handlers
│   │       ├── middleware/     # Auth, logging, error handling
│   │       ├── repositories/  # Data access layer
│   │       ├── routes/         # Route definitions
│   │       └── services/       # Business logic
│   ├── admin-portal/           # React + Vite admin SPA
│   ├── user-portal/            # React + Vite user SPA
│   └── db/                     # Database
│       ├── migrations/         # Schema migrations
│       ├── seeds/              # Seed data scripts
│       └── init.sql            # Initial schema
├── docker-compose.yml          # Docker Compose configuration
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── tsconfig.base.json          # Shared TypeScript configuration
├── .env.example                # Environment variable template
└── README.md                   # This file
```

## Development Notes

### Adding a new shared type or service

1. Edit the relevant file in `src/shared/` (types go in `types/`, services in `services/`)
2. Update the barrel export in `src/shared/index.ts`
3. Import from `@moc/shared` in any server or portal package

Shared services use a lightweight fetch-based API client in `src/shared/services/api-client.ts` with `apiGet`, `apiPost`, `apiPut`, `apiDelete` helpers for consistent error handling.

### Adding a new API endpoint

1. Create a route file in `src/server/src/routes/`
2. Register it in `src/server/src/routes/index.ts`
3. Create a controller in `src/server/src/controllers/`
4. Add middleware as needed in `src/server/src/middleware/`
5. Add a shared TypeScript interface in `src/shared/types/`
6. Add a shared service in `src/shared/services/` for frontend consumption

### Database changes

Edit `src/db/init.sql` and restart PostgreSQL. The schema auto-applies on Docker startup.

## Troubleshooting

| Problem                          | Solution                                      |
|----------------------------------|-----------------------------------------------|
| `npm run dev` not working        | Run `npm install` from project root first     |
| `pnpm: command not found`        | Use `npm` instead (no pnpm required)          |
| Port already in use              | Change the port in `.env` or `vite.config.ts` |
| `ECONNREFUSED` on database       | Ensure PostgreSQL is running: `docker compose up postgres -d` |
| Cross-origin errors              | Vite proxies `/api` to `localhost:3000` by default |
| Missing shared package           | Run `npm install` from the project root      |
