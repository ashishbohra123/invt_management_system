import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/index.js";
import { config } from "../config/env.js";

function toUser(row: { id: string; name: string; email: string; roles: string[]; portals: string[]; tenant_id: string | null }) {
  const roles = Array.isArray(row.roles) ? row.roles : [];
  const portals = Array.isArray(row.portals) ? row.portals : [];
  return {
    id: row.id,
    name: row.name ?? "",
    email: row.email,
    role: roles[0] ?? "viewer",
    portalAccess: portals,
    tenantId: row.tenant_id ?? undefined,
  };
}

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await pool.query(
        `SELECT id, name, email, password, roles, portals, tenant_id
         FROM users WHERE email = $1 AND is_active = true`,
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
        { id: user.id, tenantId: user.tenant_id, roles: Array.isArray(user.roles) ? user.roles : [] },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY }
      );
      res.json({ token, user: toUser(user) });
    } catch (err) { next(err); }
  },

  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role, portalAccess, tenantId } = req.body;
      const exists = await pool.query(
        `SELECT id FROM users WHERE email = $1`, [email]
      );
      if (exists.rows.length > 0) {
        res.status(409).json({ success: false, error: "Email already registered" });
        return;
      }
      const hashed = await bcrypt.hash(password, 10);
      const roles = role ? [role] : ["viewer"];
      const portals = Array.isArray(portalAccess) ? portalAccess : [];
      const result = await pool.query(
        `INSERT INTO users (name, email, password, roles, portals, tenant_id)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
         RETURNING id, name, email, roles, portals, tenant_id, created_at`,
        [name, email, hashed, JSON.stringify(roles), JSON.stringify(portals), tenantId || null]
      );
      const newUser = result.rows[0];
      const token = jwt.sign(
        { id: newUser.id, tenantId: newUser.tenant_id, roles: Array.isArray(newUser.roles) ? newUser.roles : [] },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY }
      );
      res.status(201).json({ token, user: toUser(newUser) });
    } catch (err) { next(err); }
  },

  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `SELECT id, name, email, roles, portals, tenant_id, created_at, updated_at
         FROM users WHERE id = $1 AND is_active = true`,
        [req.user!.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }
      res.json({ user: toUser(result.rows[0]) });
    } catch (err) { next(err); }
  },
};
