import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tenantRouter } from "../routes/tenants.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { responseHandler } from "../middleware/responseHandler.js";

const mockQuery = vi.fn();

vi.mock("../config/index.js", () => ({
  pool: { query: (...args: unknown[]) => mockQuery(...args) },
  config: {},
}));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use("/api/tenants", tenantRouter);
  app.use(errorHandler);
  return app;
}

const sampleRow = {
  id: "11111111-1111-1111-1111-111111111111",
  tenant_id: "acme",
  name: "Acme Corp",
  domains: ["acme.example.com"],
  status: "active",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

describe("Tenant API", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("GET /api/tenants", () => {
    it("returns a list of tenants", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [sampleRow] });

      const res = await request(createApp()).get("/api/tenants");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].name).toBe("Acme Corp");
    });
  });

  describe("POST /api/tenants", () => {
    it("creates a tenant and returns 201", async () => {
      const payload = { name: "Acme Corp", domains: ["acme.example.com"] };
      mockQuery
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rows: [sampleRow] });

      const res = await request(createApp()).post("/api/tenants").send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Acme Corp");
      expect(res.body.data.domains).toEqual(["acme.example.com"]);
    });

    it("rejects create without name", async () => {
      const res = await request(createApp()).post("/api/tenants").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /api/tenants/:id", () => {
    it("updates a tenant and returns the updated data", async () => {
      const payload = { name: "Updated Corp", domains: ["updated.example.com"] };
      mockQuery
        .mockResolvedValueOnce({ rowCount: 1, rows: [sampleRow] })
        .mockResolvedValueOnce({
          rows: [
            {
              ...sampleRow,
              name: "Updated Corp",
              domains: ["updated.example.com"],
            },
          ],
        });

      const res = await request(createApp()).put("/api/tenants/1").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Corp");
    });
  });

  describe("DELETE /api/tenants/:id", () => {
    it("deletes a tenant and returns 204", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(createApp()).delete("/api/tenants/1");
      expect(res.status).toBe(204);
    });
  });
});
