import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { tenantRouter } from "../routes/tenants.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { responseHandler } from "../middleware/responseHandler.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use("/api/tenants", tenantRouter);
  app.use(errorHandler);
  return app;
}

describe("Tenant API", () => {
  describe("GET /api/tenants", () => {
    it("returns a list of tenants", async () => {
      const res = await request(createApp()).get("/api/tenants");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /api/tenants", () => {
    it("creates a tenant and returns 201", async () => {
      const payload = { name: "Acme Corp", domain: "acme.example.com" };
      const res = await request(createApp()).post("/api/tenants").send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(payload);
    });

    it("accepts an empty body", async () => {
      const res = await request(createApp()).post("/api/tenants").send({});
      expect(res.status).toBe(201);
    });
  });

  describe("PUT /api/tenants/:id", () => {
    it("updates a tenant and returns the updated data", async () => {
      const payload = { name: "Updated Corp", domain: "updated.example.com" };
      const res = await request(createApp()).put("/api/tenants/1").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject(payload);
    });
  });

  describe("DELETE /api/tenants/:id", () => {
    it("deletes a tenant and returns 204", async () => {
      const res = await request(createApp()).delete("/api/tenants/1");
      expect(res.status).toBe(204);
    });
  });
});
