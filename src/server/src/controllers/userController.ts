import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/index.js";

export const userController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, status, portal_access, tenant_id, created_at, updated_at
         FROM users WHERE deleted_at IS NULL
         ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role, portalAccess, tenantId } = req.body;
      const hashed = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, portal_access, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, role, status, portal_access, tenant_id, created_at, updated_at`,
        [name, email, hashed, role || "viewer", portalAccess || [], tenantId || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, email, role, status, portalAccess } = req.body;
      const result = await pool.query(
        `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email),
         role = COALESCE($3, role), status = COALESCE($4, status),
         portal_access = COALESCE($5, portal_access), updated_at = NOW()
         WHERE id = $6 AND deleted_at IS NULL
         RETURNING id, name, email, role, status, portal_access, tenant_id, created_at, updated_at`,
        [name, email, role, status, portalAccess, id]
      );
      if (result.rows.length === 0) { res.status(404).json({ error: "User not found" }); return; }
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      if (result.rowCount === 0) { res.status(404).json({ error: "User not found" }); return; }
      res.status(204).end();
    } catch (err) { next(err); }
  },
};
