import express from "express";
import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { userRouter } from "../routes/users.js";
import { tenantRouter } from "../routes/tenants.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { responseHandler } from "../middleware/responseHandler.js";

const mockQuery = vi.fn();

vi.mock("../config/index.js", () => ({
  pool: { query: (...args: unknown[]) => mockQuery(...args) },
  config: { PORT: 0, NODE_ENV: "test", DB_HOST: "localhost", DB_PORT: 5432, DB_NAME: "test", DB_USER: "test", DB_PASSWORD: "test", JWT_SECRET: "test-secret", JWT_EXPIRY: "20m" },
}));

const REQUEST_COUNT = 50;
const ACCEPTABLE_AVG_MS = 100;

async function measureThroughput(
  label: string,
  fn: () => Promise<unknown>,
  count: number = REQUEST_COUNT,
): Promise<number> {
  const timings: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = performance.now();
    await fn();
    timings.push(performance.now() - start);
  }
  const total = timings.reduce((a, b) => a + b, 0);
  const avg = total / timings.length;
  const min = Math.min(...timings);
  const max = Math.max(...timings);
  const sorted = [...timings].sort((a, b) => a - b);
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  console.log(
    `${label}: avg=${avg.toFixed(2)}ms min=${min.toFixed(2)}ms max=${max.toFixed(2)}ms p99=${p99.toFixed(2)}ms (${count} requests)`,
  );
  return avg;
}

function createApp(router: express.Router, basePath: string) {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use(basePath, router);
  app.use(errorHandler);
  return app;
}

describe("API throughput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(`GET /api/users handles ${REQUEST_COUNT} requests within ${ACCEPTABLE_AVG_MS}ms avg`, async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const avg = await measureThroughput("GET /api/users", () =>
      request(createApp(userRouter, "/api/users")).get("/api/users"),
    );
    expect(avg).toBeLessThan(ACCEPTABLE_AVG_MS);
  });

  it(`POST /api/users handles ${REQUEST_COUNT} requests within ${ACCEPTABLE_AVG_MS}ms avg`, async () => {
    mockQuery.mockReturnValue({ rows: [{ id: "new-user" }], rowCount: 1 });
    const avg = await measureThroughput("POST /api/users", () =>
      request(createApp(userRouter, "/api/users")).post("/api/users").send({ name: "test" }),
    );
    expect(avg).toBeLessThan(ACCEPTABLE_AVG_MS);
  });

  it(`GET /api/tenants handles ${REQUEST_COUNT} requests within ${ACCEPTABLE_AVG_MS}ms avg`, async () => {
    mockQuery.mockReturnValue({ rows: [] });
    const avg = await measureThroughput("GET /api/tenants", () =>
      request(createApp(tenantRouter, "/api/tenants")).get("/api/tenants"),
    );
    expect(avg).toBeLessThan(ACCEPTABLE_AVG_MS);
  });

  it(`POST /api/tenants handles ${REQUEST_COUNT} requests within ${ACCEPTABLE_AVG_MS}ms avg`, async () => {
    const now = new Date();
    let callIndex = 0;
    mockQuery.mockImplementation(() => {
      callIndex++;
      if (callIndex % 2 === 1) return { rows: [], rowCount: 0 };
      return { rows: [{ id: "new-tenant", tenant_id: "test-tenant", name: "Test", domains: [], status: "active", created_at: now, updated_at: now }], rowCount: 1 };
    });
    const avg = await measureThroughput("POST /api/tenants", () =>
      request(createApp(tenantRouter, "/api/tenants")).post("/api/tenants").send({ name: "test" }),
    );
    expect(avg).toBeLessThan(ACCEPTABLE_AVG_MS);
  });
});
