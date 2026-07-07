import express from "express";
import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const mockQuery = vi.fn();

vi.mock("../config/index.js", () => ({
  pool: { query: mockQuery },
  config: { PORT: 0, NODE_ENV: "test", DB_HOST: "localhost", DB_PORT: 5432, DB_NAME: "test", DB_USER: "test", DB_PASSWORD: "test", JWT_SECRET: "test-secret", JWT_EXPIRY: "20m" },
}));

const { inventoryRouter } = await import("../routes/inventory.js");
const { errorHandler } = await import("../middleware/errorHandler.js");
const { responseHandler } = await import("../middleware/responseHandler.js");

function authHeader(overrides = {}) {
  const token = jwt.sign({ id: "test-user", tenantId: "tenant-1", roles: ["admin"], ...overrides }, config.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use("/api/inventory", inventoryRouter);
  app.use(errorHandler);
  return app;
}

describe("Inventory API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/inventory", () => {
    it("returns a list of inventory records", async () => {
      const countRow = { total: "0" };
      mockQuery
        .mockResolvedValueOnce({ rows: [countRow] })
        .mockResolvedValueOnce({ rows: [] });
      const res = await request(createApp()).get("/api/inventory").set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.totalPages).toBe(0);
    });

    it("requires authentication", async () => {
      const res = await request(createApp()).get("/api/inventory");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/inventory/:id", () => {
    it("updates stock quantity", async () => {
      const row = {
        id: "inv-1",
        product_id: "prod-1",
        tenant_id: "tenant-1",
        current_inventory: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValueOnce({ rows: [row] });

      const res = await request(createApp())
        .put("/api/inventory/inv-1")
        .set(authHeader())
        .send({ current_inventory: 50 });
      expect(res.status).toBe(200);
      expect(res.body.data.currentInventory).toBe(50);
    });

    it("rejects negative quantity", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "inv-1" }] });
      const res = await request(createApp())
        .put("/api/inventory/inv-1")
        .set(authHeader())
        .send({ current_inventory: -5 });
      expect(res.status).toBe(400);
    });

    it("returns 404 for missing record", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(createApp())
        .put("/api/inventory/nonexistent")
        .set(authHeader())
        .send({ current_inventory: 10 });
      expect(res.status).toBe(404);
    });
  });
});
