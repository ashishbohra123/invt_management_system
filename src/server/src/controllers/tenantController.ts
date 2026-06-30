import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/index.js";

export const tenantController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `SELECT id, name, domains, status, created_at, updated_at
         FROM tenants ORDER BY created_at DESC`
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, domains } = req.body;
      const result = await pool.query(
        `INSERT INTO tenants (name, domains)
         VALUES ($1, $2)
         RETURNING id, name, domains, status, created_at, updated_at`,
        [name, domains || []]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, domains, status } = req.body;
      const result = await pool.query(
        `UPDATE tenants SET name = COALESCE($1, name), domains = COALESCE($2, domains),
         status = COALESCE($3, status), updated_at = NOW()
         WHERE id = $4
         RETURNING id, name, domains, status, created_at, updated_at`,
        [name, domains, status, id]
      );
      if (result.rows.length === 0) { res.status(404).json({ error: "Tenant not found" }); return; }
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`DELETE FROM tenants WHERE id = $1`, [id]);
      if (result.rowCount === 0) { res.status(404).json({ error: "Tenant not found" }); return; }
      res.status(204).end();
    } catch (err) { next(err); }
  },
};
