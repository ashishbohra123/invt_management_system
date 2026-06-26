import type { Request, Response, NextFunction } from "express"; import jwt from "jsonwebtoken"; import { config } from "../config/env.js";
export interface AuthUser { id: string; tenantId?: string; roles: string[]; }
declare global { namespace Express { interface Request { user?: AuthUser } } }
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization; if (!header?.startsWith("Bearer ")) { res.status(401).json({ success: false, error: "Missing token" }); return; }
  try { const token = header.slice(7); req.user = jwt.verify(token, config.JWT_SECRET) as AuthUser; next(); } catch { res.status(401).json({ success: false, error: "Invalid token" }); }
}
