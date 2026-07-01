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

const { orderRouter } = await import("../routes/orders.js");
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
  app.use("/api/orders", orderRouter);
  app.use(errorHandler);
  return app;
}

describe("Orders API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/orders", () => {
    it("returns a list of orders", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(createApp()).get("/api/orders").set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("requires authentication", async () => {
      const res = await request(createApp()).get("/api/orders");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/orders", () => {
    it("creates an order with sufficient inventory", async () => {
      const productRow = {
        id: "prod-1",
        tenant_id: "tenant-1",
        sku: "SKU-001",
        name: "Product",
        category: null,
        is_active: true,
        reorder_threshold: 10,
        cost_per_unit: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const inventoryRow = {
        id: "inv-1",
        product_id: "prod-1",
        tenant_id: "tenant-1",
        current_inventory: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const orderRow = {
        id: "ord-1",
        tenant_id: "tenant-1",
        product_id: "prod-1",
        quantity: 5,
        status: "created",
        approved_by: null,
        approved_at: null,
        cancelled_by: null,
        cancelled_at: null,
        cancel_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [productRow] })
        .mockResolvedValueOnce({ rows: [inventoryRow] })
        .mockResolvedValueOnce({ rows: [orderRow] });

      const res = await request(createApp())
        .post("/api/orders")
        .set(authHeader())
        .send({ tenant_id: "tenant-1", product_id: "prod-1", quantity: 5 });
      expect(res.status).toBe(201);
      expect(res.body.data.quantity).toBe(5);
    });

    it("rejects order with insufficient inventory", async () => {
      const productRow = {
        id: "prod-1",
        tenant_id: "tenant-1",
        sku: "SKU-001",
        name: "Product",
        category: null,
        is_active: true,
        reorder_threshold: 10,
        cost_per_unit: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const inventoryRow = {
        id: "inv-1",
        product_id: "prod-1",
        tenant_id: "tenant-1",
        current_inventory: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [productRow] })
        .mockResolvedValueOnce({ rows: [inventoryRow] });

      const res = await request(createApp())
        .post("/api/orders")
        .set(authHeader())
        .send({ tenant_id: "tenant-1", product_id: "prod-1", quantity: 99 });
      expect(res.status).toBe(400);
    });

    it("rejects zero quantity", async () => {
      const res = await request(createApp())
        .post("/api/orders")
        .set(authHeader())
        .send({ tenant_id: "tenant-1", product_id: "prod-1", quantity: 0 });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/orders/:id/approve", () => {
    it("approves an order and deducts inventory", async () => {
      const orderRow = {
        id: "ord-1",
        tenant_id: "tenant-1",
        product_id: "prod-1",
        quantity: 5,
        status: "created",
        approved_by: null,
        approved_at: null,
        cancelled_by: null,
        cancelled_at: null,
        cancel_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const inventoryRow = {
        id: "inv-1",
        product_id: "prod-1",
        tenant_id: "tenant-1",
        current_inventory: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const approvedRow = { ...orderRow, status: "confirmed", approved_by: "test-user", approved_at: new Date().toISOString() };

      mockQuery
        .mockResolvedValueOnce({ rows: [orderRow] })
        .mockResolvedValueOnce({ rows: [inventoryRow] })
        .mockResolvedValueOnce({ rows: [{ ...inventoryRow, current_inventory: 45 }] })
        .mockResolvedValueOnce({ rows: [approvedRow] });

      const res = await request(createApp())
        .put("/api/orders/ord-1/approve")
        .set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("confirmed");
    });

    it("rejects approval of already approved order", async () => {
      const orderRow = {
        id: "ord-1",
        tenant_id: "tenant-1",
        product_id: "prod-1",
        quantity: 5,
        status: "confirmed",
        approved_by: "someone",
        approved_at: new Date().toISOString(),
        cancelled_by: null,
        cancelled_at: null,
        cancel_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockQuery.mockResolvedValueOnce({ rows: [orderRow] });

      const res = await request(createApp())
        .put("/api/orders/ord-1/approve")
        .set(authHeader());
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/orders/:id/cancel", () => {
    it("cancels a created order", async () => {
      const orderRow = {
        id: "ord-1",
        tenant_id: "tenant-1",
        product_id: "prod-1",
        quantity: 5,
        status: "created",
        approved_by: null,
        approved_at: null,
        cancelled_by: null,
        cancelled_at: null,
        cancel_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const cancelledRow = { ...orderRow, status: "cancelled", cancelled_by: "test-user", cancelled_at: new Date().toISOString(), cancel_reason: "Changed mind" };

      mockQuery
        .mockResolvedValueOnce({ rows: [orderRow] })
        .mockResolvedValueOnce({ rows: [cancelledRow] });

      const res = await request(createApp())
        .put("/api/orders/ord-1/cancel")
        .set(authHeader())
        .send({ reason: "Changed mind" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("cancelled");
    });

    it("rejects cancellation of already approved order", async () => {
      const orderRow = {
        id: "ord-1",
        tenant_id: "tenant-1",
        product_id: "prod-1",
        quantity: 5,
        status: "confirmed",
        approved_by: "someone",
        approved_at: new Date().toISOString(),
        cancelled_by: null,
        cancelled_at: null,
        cancel_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockQuery.mockResolvedValueOnce({ rows: [orderRow] });

      const res = await request(createApp())
        .put("/api/orders/ord-1/cancel")
        .set(authHeader());
      expect(res.status).toBe(400);
    });
  });
});
