import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userRouter } from "../routes/users.js";
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
  app.use("/api/users", userRouter);
  app.use(errorHandler);
  return app;
}

const sampleRow = {
  id: "11111111-1111-1111-1111-111111111111",
  tenant_id: null,
  name: "Jane Doe",
  email: "jane@example.com",
  roles: ["viewer"],
  portals: ["admin"],
  is_active: true,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

describe("User API", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("GET /api/users", () => {
    it("returns a list of users", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "1" }] })
        .mockResolvedValueOnce({ rows: [sampleRow] });

      const res = await request(createApp()).get("/api/users");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data[0].email).toBe("jane@example.com");
    });
  });

  describe("POST /api/users", () => {
    it("creates a user and returns 201", async () => {
      const payload = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "secret123",
        role: "viewer",
        status: "active",
        portalAccess: ["admin"],
      };
      mockQuery.mockResolvedValueOnce({ rows: [sampleRow] });

      const res = await request(createApp()).post("/api/users").send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("jane@example.com");
      expect(mockQuery).toHaveBeenCalledOnce();
    });

    it("rejects create without email", async () => {
      const res = await request(createApp())
        .post("/api/users")
        .send({ password: "secret123" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("updates a user and returns the updated data", async () => {
      const payload = { name: "Updated Name", email: "updated@example.com" };
      mockQuery
        .mockResolvedValueOnce({ rowCount: 1, rows: [sampleRow] })
        .mockResolvedValueOnce({
          rows: [{ ...sampleRow, name: "Updated Name", email: "updated@example.com" }],
        });

      const res = await request(createApp()).put("/api/users/1").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("deletes a user and returns 204", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(createApp()).delete("/api/users/1");
      expect(res.status).toBe(204);
    });
  });
});
