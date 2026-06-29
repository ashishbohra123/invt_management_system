# Localhost Testing Guide

This guide covers how to test the Inventory Management System on your local machine.

## Prerequisites

Same as [README](../README.md) — Node.js 18+, npm/pnpm, Docker (optional).

## Running Tests

### Run all tests

```bash
npm test
# or
npx vitest run
```

### Run tests with watch mode

```bash
npx vitest
# or
npm test -- --watch
```

### Run specific test files

```bash
npx vitest run src/server/tests/integration/auth.test.ts
npx vitest run src/server/tests/integration/tenants.test.ts
npx vitest run src/server/tests/integration/users.test.ts
```

### Run tests with coverage

```bash
npx vitest run --coverage
```

## Test Structure

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

## API Testing with curl

### Health Check

```bash
curl http://localhost:3000/api/health
```

```json
{"status":"ok","timestamp":"2026-06-29T12:00:00.000Z"}
```

### Authentication

Register an admin user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

Login and extract the token:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.token')
echo $TOKEN
```

### Tenants (Admin)

```bash
# Create a tenant
curl -X POST http://localhost:3000/api/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","tenant_id":"acme"}'

# List tenants
curl http://localhost:3000/api/tenants \
  -H "Authorization: Bearer $TOKEN"

# Update tenant
curl -X PUT http://localhost:3000/api/tenants/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp Updated"}'

# Delete tenant (soft-delete)
curl -X DELETE http://localhost:3000/api/tenants/<id> \
  -H "Authorization: Bearer $TOKEN"
```

### Users (Admin)

```bash
# Create user within a tenant
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"partner@acme.com","password":"pass123","tenant_id":"<tenant-id>","roles":["partner"],"portals":["partner"]}'

# List users
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"

# Update user
curl -X PUT http://localhost:3000/api/users/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active":false}'
```

### Products

```bash
# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget A","sku":"WGT-001","category":"widgets","cost_per_unit":9.99,"reorder_threshold":20}'

# List products
curl http://localhost:3000/api/products

# Update product
curl -X PUT http://localhost:3000/api/products/<id> \
  -H "Content-Type: application/json" \
  -d '{"is_active":false}'
```

### Inventory

```bash
# List all inventory
curl http://localhost:3000/api/inventory

# Update stock level
curl -X PUT http://localhost:3000/api/inventory/<id> \
  -H "Content-Type: application/json" \
  -d '{"current_inventory":150}'
```

### Orders

```bash
# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product_id":"<product-id>","quantity":5}'

# List orders
curl http://localhost:3000/api/orders

# Approve order (manager)
curl -X PUT http://localhost:3000/api/orders/<id>/approve

# Cancel order (with reason)
curl -X PUT http://localhost:3000/api/orders/<id>/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason":"Customer request"}'
```

## Database Testing

### Connect to PostgreSQL

```bash
# Via Docker
docker compose exec postgres psql -U postgres -d invt_mgmt

# Via local install
psql -d invt_mgmt
```

### Useful queries

```sql
-- List all tables
\dt

-- Describe table schema
\d+ tenants

-- Check tenant data
SELECT id, tenant_id, name, status FROM tenants;

-- Check users per tenant
SELECT t.name AS tenant, u.email, u.roles
FROM users u
JOIN tenants t ON t.id = u.tenant_id;

-- Check low-stock products
SELECT p.name, i.current_inventory, p.reorder_threshold
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE i.current_inventory <= p.reorder_threshold;

-- Check order status breakdown
SELECT status, COUNT(*) FROM orders GROUP BY status;
```

### Reset database

```bash
docker compose down -v
docker compose up -d
```

## Performance Testing

Basic load test with `autocannon` or `wrk`:

```bash
# Install autocannon
npm install -g autocannon

# Load test health endpoint
autocannon http://localhost:3000/api/health

# Load test authenticated endpoint
autocannon -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/tenants
```

## CI Pipeline

The project includes a GitHub Actions CI workflow (`.github/workflows/ci.yml`) that runs:

1. **Lint** — TypeScript type checking
2. **Test** — Vitest unit + integration tests (with PostgreSQL service container)
3. **Build** — Production build verification

## Debugging Tips

| Issue                       | Check                                             |
|-----------------------------|---------------------------------------------------|
| Tests hang on DB connect    | Ensure PostgreSQL is running (`docker compose up postgres -d`) |
| JWT auth failures           | Verify `JWT_SECRET` matches between test/source   |
| Integration test data leaks | Tests run against a dedicated test database       |
| Port conflicts              | Change `PORT` in `.env` or `vite.config.ts`        |
| Cross-origin errors         | Vite proxies `/api` to `localhost:3000` by default |
| Type errors in tests        | Run `npm run lint` to check types first            |
