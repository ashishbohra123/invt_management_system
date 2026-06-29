# Localhost Testing Guide

This guide explains how to run the backend API locally, how it connects to the database, and how the database is set up in code.

## Architecture Overview

```
Client (curl/browser/portal)
        │ HTTP :3000
        ▼
  Express API Server
  ┌──────────────────────────┐
  │  db/sync.ts              │  ← auto-creates DB + schema on startup
  │  config/index.ts         │  ← reads env vars, creates PostgreSQL Pool
  │  routes/*.ts             │  ← defines API endpoints
  │  controllers/*.ts        │  ← handles requests
  │  middleware/*.ts         │  ← auth, logging, error handling
  └──────────────┬───────────┘
             │ SQL :5432
             ▼
       PostgreSQL
  ┌──────────────────────┐
  │  invt_mgmt database  │
  │  tenants / users     │
  │  products / inventory│
  │  orders              │
  └──────────────────────┘
```

The Express API starts on port 3000, connects to PostgreSQL using a connection pool defined in `src/server/src/config/index.ts`, and serves REST endpoints under `/api`.

## Prerequisites

- **Node.js** >= 18 (recommended: 20 LTS)
- **npm** or **pnpm**
- **Docker** (easiest way to run PostgreSQL)

## Running the Backend API Locally

### 1. Install dependencies

```bash
npm install
```

This installs all workspace packages: `@moc/shared`, `@moc/server`, and the three portals.

### 2. Start PostgreSQL

**Option A — Docker (recommended):**

```bash
docker compose up postgres -d
```

This starts PostgreSQL 16 on port 5432 with the database `invt_mgmt`. The schema in `src/db/init.sql` is auto-applied on first start because Docker Compose mounts it at `/docker-entrypoint-initdb.d/init.sql`.

**Option B — Local PostgreSQL installation:**

If using a local PostgreSQL install, just ensure PostgreSQL is accepting connections. The server auto-creates the database and tables on startup (see [Auto-sync on server startup](#auto-sync-on-server-startup)).

### 3. Configure environment

```bash
cp .env.example .env
```

The `.env` file tells the API how to reach the database:

```
PORT=3000              # API server port
DB_HOST=localhost      # PostgreSQL hostname
DB_PORT=5432           # PostgreSQL port
DB_NAME=invt_mgmt      # Database name
DB_USER=postgres       # Database user
DB_PASSWORD=postgres   # Database password
JWT_SECRET=change-me-in-production   # Token signing key
JWT_EXPIRY=20m         # Token lifetime
```

### 4. Start the API server

**Option A — Start all services (recommended):**

```bash
npm run dev
```

This starts the API server, Admin Portal, Partner Portal, and Customer Portal in parallel using `concurrently`. The API server boots on port 3000, automatically creates the database and schema on first run, then starts accepting requests. Equivalent to `npm start`.

**Option B — Start the API server only:**

```bash
npm run dev -w @moc/server
```

Or from the server directory:

```bash
cd src/server
npm run dev
```

The server runs via `tsx watch src/index.ts` — TypeScript is executed directly (no build step needed). The `--watch` flag auto-restarts on file changes.

On first run, the server:
1. Connects to PostgreSQL and creates the `invt_mgmt` database if it doesn't exist
2. Reads `src/db/init.sql` and runs it to create all tables (idempotent — safe to re-run)
3. Starts the Express API on port 3000

Expected output:
```
[db] Created database: invt_mgmt
[db] Schema synchronized
Server running on port 3000
```

### 5. Verify it's running

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{"status":"ok","timestamp":"2026-06-29T12:00:00.000Z"}
```

If this fails, check that PostgreSQL is running and the config in `.env` is correct.

> **Tip:** `npm start` is an alias for `npm run dev` — both commands start the full stack with auto-sync.

## How the API Connects to the Database

The connection is established in `src/server/src/config/`:

**`env.ts`** — Reads environment variables with defaults:

```typescript
export const config = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_NAME: process.env.DB_NAME || "invt_mgmt",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  JWT_EXPIRY: process.env.JWT_EXPIRY || "20m",
};
```

**`index.ts`** — Creates a PostgreSQL connection pool:

```typescript
const { Pool } = pg;
export const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
});
```

The pool is imported by controllers and repositories to run SQL queries. It manages up to 20 concurrent connections and reuses them across requests.

Before the server starts accepting requests, `db/sync.ts` runs `ensureDatabase()` which creates the database and tables automatically — no manual setup required beyond having PostgreSQL running.

### How queries flow

```
Request → Route → Controller → pool.query("SELECT ...") → PostgreSQL → Response
```

Example from `tenantController.ts`:

```typescript
list: async (_req, res) => {
  const result = await pool.query("SELECT * FROM tenants ORDER BY name");
  res.json(result.rows);
}
```

## How the Database Is Set Up in Code

### Schema definition

The full database schema lives in `src/db/init.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  domains JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  roles JSONB DEFAULT '[]',
  portals JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  reorder_threshold INTEGER DEFAULT 10,
  cost_per_unit DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) UNIQUE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  current_inventory INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'created',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### How init.sql runs

**Path A — Docker Compose (automatic):**

In `docker-compose.yml`, the postgres service mounts:

```yaml
volumes:
  - ./src/db/init.sql:/docker-entrypoint-initdb.d/init.sql
```

PostgreSQL Docker image runs all `.sql` files in `/docker-entrypoint-initdb.d/` alphabetically on first database initialization (when the data volume is empty). This means the schema is created automatically when you run `docker compose up postgres -d` for the first time.

**Path B — Manual (standalone development):**

```bash
psql -d invt_mgmt -f src/db/init.sql
```

**Path C — Auto-sync on server startup (default for local dev):**

The server now auto-creates the database and schema on startup via `src/server/src/db/sync.ts`:

```typescript
// Called from src/server/src/index.ts before app.listen()
ensureDatabase().then(() => app.listen(...))
```

`sync.ts` works in two steps:

1. **Create database** — Connects to the `postgres` admin database and runs `CREATE DATABASE IF NOT EXISTS` (checked via `pg_database` catalog)
2. **Sync schema** — Reads `src/db/init.sql` and executes it against the target database. All tables use `CREATE TABLE IF NOT EXISTS`, so repeated runs are safe.

No manual `createdb` or `psql -f` steps needed for local development — just start PostgreSQL and run:

```bash
# Full stack (server + portals)
npm run dev

# Server only
npm run dev -w @moc/server
```

### Entity relationships

```
tenants (1) ── (N) products (1) ── (1) inventory
   │                    │
   │                    └── (N) orders
   │
   └── (N) users
```

- `tenants` — Multi-tenant organizations, identified by unique `tenant_id`
- `users` — Belong to a tenant (or null for super-admins), have JSON roles and portal access arrays
- `products` — Belong to a tenant, have unique SKU per tenant
- `inventory` — One-to-one with products, tracks current stock level
- `orders` — Belong to a tenant and product, track lifecycle (created → approved/cancelled)

### Adding or modifying tables

Edit `src/db/init.sql`, then either restart Docker (which re-runs init.sql only on a fresh volume) or run the SQL manually against the running database:

```bash
docker compose exec -T postgres psql -U postgres -d invt_mgmt < src/db/init.sql
```

For a clean reset:
```bash
docker compose down -v
docker compose up -d
```

## Database Schema

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `tenants` | `id` (PK UUID), `tenant_id` (unique), `name`, `domains` (JSONB), `status` | Top-level organization |
| `users` | `id` (PK UUID), `tenant_id` (FK), `email`, `password`, `roles` (JSONB), `portals` (JSONB), `is_active` | Unique per tenant+email |
| `products` | `id` (PK UUID), `tenant_id` (FK), `sku`, `name`, `category`, `is_active`, `reorder_threshold`, `cost_per_unit` | Unique SKU per tenant |
| `inventory` | `id` (PK UUID), `product_id` (FK, unique), `tenant_id` (FK), `current_inventory` | 1:1 with products |
| `orders` | `id` (PK UUID), `tenant_id` (FK), `product_id` (FK), `quantity`, `status`, `approved_by`, `cancelled_by`, `cancel_reason` | Status: created → approved/cancelled |

## Running Tests

### Run all tests

```bash
npm test
```

### Run server tests with watch mode

```bash
npx vitest
```

### Run specific test files

```bash
npx vitest run src/server/tests/integration/auth.test.ts
npx vitest run src/server/tests/integration/tenants.test.ts
npx vitest run src/server/tests/integration/users.test.ts
```

### Test structure

```
testing/
└── server/
    ├── unit/
    │   ├── services/        # Service-level tests (mocked DB)
    │   └── utils/           # Password, JWT, validator tests
    ├── integration/
    │   ├── auth.test.ts     # Login, register, JWT flow
    │   ├── tenants.test.ts  # CRUD tenant endpoints
    │   ├── users.test.ts    # CRUD user endpoints
    │   ├── products.test.ts
    │   ├── inventory.test.ts
    │   └── orders.test.ts
    └── setup.ts             # Test DB bootstrap and teardown
```

Integration tests require a running PostgreSQL instance (test database).

## API Testing with curl

### Authentication

Register a new admin:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

Login and save the token:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.token')
```

### Tenants

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","tenant_id":"acme"}'
```

### Users

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"partner@acme.com","password":"pass123","tenant_id":"<id>","roles":["partner"],"portals":["partner"]}'
```

### Products

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget A","sku":"WGT-001","category":"widgets","cost_per_unit":9.99}'
```

### Inventory

```bash
curl -X PUT http://localhost:3000/api/inventory/<id> \
  -H "Content-Type: application/json" \
  -d '{"current_inventory":100}'
```

### Orders

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product_id":"<id>","quantity":5}'

curl -X PUT http://localhost:3000/api/orders/<id>/approve

curl -X PUT http://localhost:3000/api/orders/<id>/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason":"Customer request"}'
```

## Database Queries

```bash
docker compose exec postgres psql -U postgres -d invt_mgmt
```

```sql
-- List tables
\dt

-- Check data
SELECT id, tenant_id, name FROM tenants;
SELECT t.name AS tenant, u.email, u.roles FROM users u JOIN tenants t ON t.id = u.tenant_id;
SELECT p.name, i.current_inventory FROM inventory i JOIN products p ON p.id = i.product_id WHERE i.current_inventory <= p.reorder_threshold;
SELECT status, COUNT(*) FROM orders GROUP BY status;
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED :5432` | PostgreSQL not running | `docker compose up postgres -d` |
| `relation "tenants" does not exist` | Schema not loaded | Restart the server — `db/sync.ts` auto-runs `init.sql` on startup. Or run `psql -d invt_mgmt -f src/db/init.sql` manually |
| `Missing token` / `Invalid token` | JWT issue | Re-login or check `JWT_SECRET` in `.env` |
| Port 3000 in use | Another process | `lsof -i :3000`, kill, or change `PORT` in `.env` |
| Tests hang on DB connect | No test DB | Ensure PostgreSQL is running |
