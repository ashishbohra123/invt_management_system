import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/index.js";
import { config } from "../config/env.js";

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await pool.query(
        `SELECT id, name, email, password, role, portal_access, tenant_id
         FROM users WHERE email = $1 AND deleted_at IS NULL`,
        [email]
      );
      if (result.rows.length === 0) {
        res.status(401).json({ success: false, error: "Invalid email or password" });
        return;
      }
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(401).json({ success: false, error: "Invalid email or password" });
        return;
      }
      const token = jwt.sign(
        { id: user.id, tenantId: user.tenant_id, roles: [user.role] },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY }
      );
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, portalAccess: user.portal_access, tenantId: user.tenant_id },
      });
    } catch (err) { next(err); }
  },

  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role, portalAccess, tenantId } = req.body;
      const exists = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`, [email]
      );
      if (exists.rows.length > 0) {
        res.status(409).json({ success: false, error: "Email already registered" });
        return;
      }
      const hashed = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, portal_access, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, role, portal_access, tenant_id, created_at`,
        [name, email, hashed, role || "viewer", portalAccess || [], tenantId || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  },
};
