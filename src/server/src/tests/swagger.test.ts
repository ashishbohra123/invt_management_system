import { describe, expect, it } from "vitest";
import { openApiSpec } from "../config/swagger.js";

describe("Swagger / OpenAPI spec", () => {
  it("is a valid OpenAPI 3.0 document", () => {
    expect(openApiSpec.openapi).toBe("3.0.0");
    expect(openApiSpec.info.title).toBe("Inventory Management System API");
    expect(openApiSpec.info.version).toBe("1.0.0");
  });

  it("defines bearerAuth security scheme", () => {
    expect(openApiSpec.components?.securitySchemes?.bearerAuth).toBeDefined();
    expect(openApiSpec.components?.securitySchemes?.bearerAuth.type).toBe("http");
    expect(openApiSpec.components?.securitySchemes?.bearerAuth.scheme).toBe("bearer");
  });

  it("documents the User endpoints", () => {
    expect(openApiSpec.paths?.["/users"]?.get).toBeDefined();
    expect(openApiSpec.paths?.["/users"]?.post).toBeDefined();
    expect(openApiSpec.paths?.["/users/{id}"]?.put).toBeDefined();
    expect(openApiSpec.paths?.["/users/{id}"]?.delete).toBeDefined();
  });

  it("documents the Tenant endpoints", () => {
    expect(openApiSpec.paths?.["/tenants"]?.get).toBeDefined();
    expect(openApiSpec.paths?.["/tenants"]?.post).toBeDefined();
    expect(openApiSpec.paths?.["/tenants/{id}"]?.put).toBeDefined();
    expect(openApiSpec.paths?.["/tenants/{id}"]?.delete).toBeDefined();
  });

  it("documents the Auth endpoints", () => {
    expect(openApiSpec.paths?.["/auth/login"]?.post).toBeDefined();
    expect(openApiSpec.paths?.["/auth/register"]?.post).toBeDefined();
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
