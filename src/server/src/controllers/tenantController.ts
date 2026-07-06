import type { Request, Response } from "express";
import { pool } from "../config/index.js";

interface TenantRow {
  id: string;
  tenant_id: string;
  name: string;
  domains: string[];
  status: string;
  created_at: Date;
  updated_at: Date;
}

function toTenant(row: TenantRow) {
  const domains = Array.isArray(row.domains) ? row.domains : [];
  return {
    id: row.id,
    name: row.name,
    domains,
    status: row.status === "inactive" ? "inactive" : "active",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function slugifyTenantId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
  return slug || "tenant";
}

async function resolveTenantId(
  preferred: string | undefined,
  name: string
): Promise<string> {
  const base = (preferred?.trim() || slugifyTenantId(name)).slice(0, 20);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await pool.query(
      `SELECT 1 FROM tenants WHERE tenant_id = $1`,
      [candidate]
    );
    if (existing.rowCount === 0) return candidate;
    const suffixStr = `-${suffix++}`;
    candidate = `${base.slice(0, 20 - suffixStr.length)}${suffixStr}`;
  }
}

function parseDomains(body: {
  domains?: string[];
  domain?: string;
}): string[] {
  if (Array.isArray(body.domains)) return body.domains;
  if (body.domain?.trim()) return [body.domain.trim()];
  return [];
}

export const tenantController = {
  list: async (_req: Request, res: Response) => {
    const result = await pool.query<TenantRow>(
      `SELECT id, tenant_id, name, domains, status, created_at, updated_at
       FROM tenants
       ORDER BY created_at DESC`
    );
    res.json(result.rows.map(toTenant));
  },

  create: async (req: Request, res: Response) => {
    const { name, tenant_id, status } = req.body as {
      name?: string;
      tenant_id?: string;
      domains?: string[];
      domain?: string;
      status?: string;
    };

    if (!name?.trim()) {
      res.status(400).json({ success: false, error: "Name is required" });
      return;
    }

    const domains = parseDomains(req.body);
    const tenantId = await resolveTenantId(tenant_id, name.trim());
    const nextStatus = status === "inactive" ? "inactive" : "active";

    try {
      const result = await pool.query<TenantRow>(
        `INSERT INTO tenants (tenant_id, name, domains, status)
         VALUES ($1, $2, $3::jsonb, $4)
         RETURNING id, tenant_id, name, domains, status, created_at, updated_at`,
        [tenantId, name.trim(), JSON.stringify(domains), nextStatus]
      );
      res.status(201).json(toTenant(result.rows[0]));
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "23505"
      ) {
        res.status(409).json({ success: false, error: "Tenant already exists" });
        return;
      }
      throw err;
    }
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, status } = req.body as {
      name?: string;
      domains?: string[];
      domain?: string;
      status?: string;
    };

    const existing = await pool.query<TenantRow>(
      `SELECT id, tenant_id, name, domains, status, created_at, updated_at
       FROM tenants WHERE id = $1`,
      [id]
    );
    if (existing.rowCount === 0) {
      res.status(404).json({ success: false, error: "Tenant not found" });
      return;
    }

    const current = existing.rows[0];
    const nextName = name?.trim() ?? current.name;
    const nextDomains = JSON.stringify(
      req.body.domains !== undefined || req.body.domain !== undefined
        ? parseDomains(req.body)
        : current.domains
    );
    const nextStatus =
      status !== undefined
        ? status === "inactive"
          ? "inactive"
          : "active"
        : current.status;

    try {
      const result = await pool.query<TenantRow>(
        `UPDATE tenants
         SET name = $1,
             domains = $2::jsonb,
             status = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, tenant_id, name, domains, status, created_at, updated_at`,
        [nextName, nextDomains, nextStatus, id]
      );
      res.json(toTenant(result.rows[0]));
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "23505"
      ) {
        res.status(409).json({ success: false, error: "Tenant already exists" });
        return;
      }
      throw err;
    }
  },

  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await pool.query<TenantRow>(
      `SELECT id, tenant_id, name, domains, status, created_at, updated_at
       FROM tenants WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: "Tenant not found" });
      return;
    }
    res.json(toTenant(result.rows[0]));
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM tenants WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: "Tenant not found" });
      return;
    }
    res.status(204).end();
  },
};
