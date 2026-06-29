import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { userRouter } from "../routes/users.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { responseHandler } from "../middleware/responseHandler.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use("/api/users", userRouter);
  app.use(errorHandler);
  return app;
}

describe("User API", () => {
  describe("GET /api/users", () => {
    it("returns a list of users", async () => {
      const res = await request(createApp()).get("/api/users");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /api/users", () => {
    it("creates a user and returns 201", async () => {
      const payload = { name: "Jane Doe", email: "jane@example.com" };
      const res = await request(createApp()).post("/api/users").send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(payload);
    });

    it("accepts an empty body", async () => {
      const res = await request(createApp()).post("/api/users").send({});
      expect(res.status).toBe(201);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("updates a user and returns the updated data", async () => {
      const payload = { name: "Updated Name", email: "updated@example.com" };
      const res = await request(createApp()).put("/api/users/1").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject(payload);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("deletes a user and returns 204", async () => {
      const res = await request(createApp()).delete("/api/users/1");
      expect(res.status).toBe(204);
    });
  });
});
