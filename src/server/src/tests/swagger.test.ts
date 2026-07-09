import { describe, expect, it } from "vitest";
import { openApiSpec } from "../config/swagger.js";

describe("Swagger / OpenAPI spec", () => {
  it("is a valid OpenAPI 3.0 document", () => {
    expect((openApiSpec as any).openapi).toBe("3.0.0");
    expect((openApiSpec as any).info.title).toBe("Inventory Management System API");
    expect((openApiSpec as any).info.version).toBe("1.0.0");
  });

  it("defines bearerAuth security scheme", () => {
    expect((openApiSpec as any).components?.securitySchemes?.bearerAuth).toBeDefined();
    expect((openApiSpec as any).components?.securitySchemes?.bearerAuth.type).toBe("http");
    expect((openApiSpec as any).components?.securitySchemes?.bearerAuth.scheme).toBe("bearer");
  });

  it("documents the User endpoints", () => {
    expect((openApiSpec as any).paths?.["/users"]?.get).toBeDefined();
    expect((openApiSpec as any).paths?.["/users"]?.post).toBeDefined();
    expect((openApiSpec as any).paths?.["/users/{id}"]?.put).toBeDefined();
    expect((openApiSpec as any).paths?.["/users/{id}"]?.delete).toBeDefined();
  });

  it("documents the Tenant endpoints", () => {
    expect((openApiSpec as any).paths?.["/tenants"]?.get).toBeDefined();
    expect((openApiSpec as any).paths?.["/tenants"]?.post).toBeDefined();
    expect((openApiSpec as any).paths?.["/tenants/{id}"]?.put).toBeDefined();
    expect((openApiSpec as any).paths?.["/tenants/{id}"]?.delete).toBeDefined();
  });

  it("documents the Auth endpoints", () => {
    expect((openApiSpec as any).paths?.["/auth/login"]?.post).toBeDefined();
    expect((openApiSpec as any).paths?.["/auth/register"]?.post).toBeDefined();
  });

  it("serves the OpenAPI JSON via GET /openapi.json", async () => {
    const express = await import("express");
    const request = (await import("supertest")).default;
    const { router } = await import("../routes/index.js");

    const app = express.default();
    app.use("/api", router);
    const res = await request(app).get("/api/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.0");
    expect(res.body.paths?.["/users"]).toBeDefined();
    expect(res.body.paths?.["/tenants"]).toBeDefined();
  });
});
