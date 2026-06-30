import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/index.js";

interface UserRow {
  id: string;
  tenant_id: string | null;
  name: string;
  email: string;
  roles: string[];
  portals: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toUser(row: UserRow) {
  const roles = Array.isArray(row.roles) ? row.roles : [];
  const portals = Array.isArray(row.portals) ? row.portals : [];
  return {
    id: row.id,
    name: row.name ?? "",
    email: row.email,
    role: roles[0] ?? "viewer",
    status: row.is_active ? "active" : "inactive",
    portalAccess: portals,
    tenantId: row.tenant_id ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const userController = {
  list: async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.pageSize ?? "10"), 10) || 10)
    );
    const search = String(req.query.search ?? "").trim();
    const offset = (page - 1) * pageSize;

    const params: unknown[] = [];
    let where = "";
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE name ILIKE $1 OR email ILIKE $1`;
    }

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

    const listParams = [...params, pageSize, offset];
    const limitOffset = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const result = await pool.query<UserRow>(
      `SELECT id, tenant_id, name, email, roles, portals, is_active, created_at, updated_at
       FROM users ${where}
       ORDER BY created_at DESC
       ${limitOffset}`,
      listParams
    );

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    res.json({
      data: result.rows.map(toUser),
      total,
      page,
      pageSize,
      totalPages,
    });
  },

  create: async (req: Request, res: Response) => {
    const { name, email, password, role, status, portalAccess, tenantId } =
      req.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
        status?: string;
        portalAccess?: string[];
        tenantId?: string;
      };

    if (!email?.trim()) {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }
    if (!password) {
      res.status(400).json({ success: false, error: "Password is required" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const roles = role ? [role] : ["viewer"];
    const portals = Array.isArray(portalAccess) ? portalAccess : [];
    const isActive = status !== "inactive";

    try {
      const result = await pool.query<UserRow>(
        `INSERT INTO users (tenant_id, name, email, password, roles, portals, is_active)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
         RETURNING id, tenant_id, name, email, roles, portals, is_active, created_at, updated_at`,
        [
          tenantId ?? null,
          name?.trim() ?? "",
          email.trim().toLowerCase(),
          hashedPassword,
          JSON.stringify(roles),
          JSON.stringify(portals),
          isActive,
        ]
      );
      res.status(201).json(toUser(result.rows[0]));
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "23505"
      ) {
        res.status(409).json({ success: false, error: "Email already exists" });
        return;
      }
      throw err;
    }
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, status, portalAccess, password } = req.body as {
      name?: string;
      email?: string;
      role?: string;
      status?: string;
      portalAccess?: string[];
      password?: string;
    };

    const existing = await pool.query<UserRow>(
      `SELECT id, tenant_id, name, email, roles, portals, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (existing.rowCount === 0) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const current = existing.rows[0];
    const nextName = name?.trim() ?? current.name;
    const nextEmail = email?.trim().toLowerCase() ?? current.email;
    const nextRoles = JSON.stringify(role ? [role] : current.roles);
    const nextPortals = JSON.stringify(
      Array.isArray(portalAccess) ? portalAccess : current.portals
    );
    const nextActive =
      status !== undefined ? status !== "inactive" : current.is_active;

    try {
      const result = password
        ? await pool.query<UserRow>(
            `UPDATE users
             SET name = $1,
                 email = $2,
                 roles = $3::jsonb,
                 portals = $4::jsonb,
                 is_active = $5,
                 password = $6,
                 updated_at = NOW()
             WHERE id = $7
             RETURNING id, tenant_id, name, email, roles, portals, is_active, created_at, updated_at`,
            [
              nextName,
              nextEmail,
              nextRoles,
              nextPortals,
              nextActive,
              await bcrypt.hash(password, 10),
              id,
            ]
          )
        : await pool.query<UserRow>(
            `UPDATE users
             SET name = $1,
                 email = $2,
                 roles = $3::jsonb,
                 portals = $4::jsonb,
                 is_active = $5,
                 updated_at = NOW()
             WHERE id = $6
             RETURNING id, tenant_id, name, email, roles, portals, is_active, created_at, updated_at`,
            [nextName, nextEmail, nextRoles, nextPortals, nextActive, id]
          );
      res.json(toUser(result.rows[0]));
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "23505"
      ) {
        res.status(409).json({ success: false, error: "Email already exists" });
        return;
      }
      throw err;
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.status(204).end();
  },
};
