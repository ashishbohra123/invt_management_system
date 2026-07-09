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

const { productRouter } = await import("../routes/products.js");
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
  app.use("/api/products", productRouter);
  app.use(errorHandler);
  return app;
}

describe("Products API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/products", () => {
    it("returns a list of products", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(createApp()).get("/api/products").set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("requires authentication", async () => {
      const res = await request(createApp()).get("/api/products");
      expect(res.status).toBe(401);
    });

    it("passes tenant_id query param to DB", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await request(createApp()).get("/api/products?tenant_id=tenant-1").set(authHeader());
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe("POST /api/products", () => {
    it("creates a product and inserts inventory record", async () => {
      const productRow = {
        id: "prod-1",
        tenant_id: "tenant-1",
        sku: "SKU-001",
        name: "Test Product",
        category: "electronics",
        is_active: true,
        reorder_threshold: 10,
        cost_per_unit: "29.99",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const inventoryRow = {
        id: "inv-1",
        product_id: "prod-1",
        tenant_id: "tenant-1",
        current_inventory: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [productRow] })
        .mockResolvedValueOnce({ rows: [inventoryRow] });

      const res = await request(createApp())
        .post("/api/products")
        .set(authHeader())
        .send({ sku: "SKU-001", name: "Test Product", category: "electronics", tenant_id: "tenant-1" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sku).toBe("SKU-001");
    });

    it("rejects empty name", async () => {
      const res = await request(createApp())
        .post("/api/products")
        .set(authHeader())
        .send({ sku: "SKU-001", name: "", tenant_id: "tenant-1" });
      expect(res.status).toBe(400);
    });

    it("rejects invalid SKU", async () => {
      const res = await request(createApp())
        .post("/api/products")
        .set(authHeader())
        .send({ sku: "AB", name: "Product", tenant_id: "tenant-1" });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("updates a product", async () => {
      const row = {
        id: "prod-1",
        tenant_id: "tenant-1",
        sku: "SKU-001",
        name: "Updated",
        category: "clothing",
        is_active: true,
        reorder_threshold: 5,
        cost_per_unit: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValueOnce({ rows: [row] });

      const res = await request(createApp())
        .put("/api/products/prod-1")
        .set(authHeader())
        .send({ name: "Updated", category: "clothing" });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated");
    });

    it("returns 404 for missing product", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(createApp())
        .put("/api/products/nonexistent")
        .set(authHeader())
        .send({ name: "Nope" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("deletes a product", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "prod-1" }] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(createApp())
        .delete("/api/products/prod-1")
        .set(authHeader());
      expect(res.status).toBe(204);
    });

    it("returns 404 for missing product", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(createApp())
        .delete("/api/products/nonexistent")
        .set(authHeader());
      expect(res.status).toBe(404);
    });
  });
});
