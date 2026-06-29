import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { authRouter } from "../routes/auth.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { responseHandler } from "../middleware/responseHandler.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use("/api/auth", authRouter);
  app.use(errorHandler);
  return app;
}

describe("Auth API", () => {
  describe("POST /api/auth/login", () => {
    it("returns 200 with the request body", async () => {
      const credentials = { email: "admin@example.com", password: "secret" };
      const res = await request(createApp()).post("/api/auth/login").send(credentials);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(credentials);
    });
  });

  describe("POST /api/auth/register", () => {
    it("creates a user and returns 201", async () => {
      const payload = { email: "new@example.com", password: "secure123" };
      const res = await request(createApp()).post("/api/auth/register").send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject(payload);
    });
  });
});
