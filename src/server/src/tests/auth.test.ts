import express from "express";
import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

const mockQuery = vi.fn();

vi.mock("../config/index.js", () => ({
  pool: { query: mockQuery },
  config: { PORT: 0, NODE_ENV: "test", DB_HOST: "localhost", DB_PORT: 5432, DB_NAME: "test", DB_USER: "test", DB_PASSWORD: "test", JWT_SECRET: "test-secret", JWT_EXPIRY: "1h" },
}));

vi.mock("../middleware/authenticate.js", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: "test-user", tenantId: "tenant-1", roles: ["admin"] };
    next();
  },
}));

const { authRouter } = await import("../routes/auth.js");
const { errorHandler } = await import("../middleware/errorHandler.js");
const { responseHandler } = await import("../middleware/responseHandler.js");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use("/api/auth", authRouter);
  app.use(errorHandler);
  return app;
}

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("returns 200 with token for valid credentials", async () => {
      const hashed = await bcrypt.hash("correct-password", 4);
      mockQuery.mockResolvedValue({
        rows: [{ id: "user-1", name: "Admin", email: "admin@example.com", password: hashed, roles: ["admin"], portals: ["admin", "customer"], tenant_id: "tenant-1" }],
      });
      const res = await request(createApp())
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "correct-password" });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe("admin@example.com");
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("returns 401 for invalid password", async () => {
      const hashed = await bcrypt.hash("correct-password", 4);
      mockQuery.mockResolvedValue({
        rows: [{ id: "user-1", name: "Admin", email: "admin@example.com", password: hashed, roles: ["admin"], portals: ["admin"], tenant_id: "tenant-1" }],
      });
      const res = await request(createApp())
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "wrong-password" });
      expect(res.status).toBe(401);
    });

    it("returns 401 for unknown email", async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const res = await request(createApp())
        .post("/api/auth/login")
        .send({ email: "unknown@example.com", password: "any" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/register", () => {
    it("creates a user and returns 201 with token", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "user-2", name: "New User", email: "new@example.com", roles: ["viewer"], portals: [], tenant_id: null, created_at: new Date().toISOString() }],
      });
      const res = await request(createApp())
        .post("/api/auth/register")
        .send({ email: "new@example.com", password: "secure123", name: "New User" });
      expect(res.status).toBe(201);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe("new@example.com");
    });

    it("returns 409 if email already exists", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "existing" }] });
      const res = await request(createApp())
        .post("/api/auth/register")
        .send({ email: "existing@example.com", password: "secure123" });
      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the current user profile", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: "test-user", name: "Test User", email: "test@example.com", roles: ["admin"], portals: ["admin"], tenant_id: "tenant-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      });
      const res = await request(createApp())
        .get("/api/auth/me")
        .set("Authorization", "Bearer test-token");
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("test@example.com");
    });
  });
});
