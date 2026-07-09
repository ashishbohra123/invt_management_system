import type { Request, Response } from "express";
import { orderService, AppError } from "../services/index.js";

export const orderController = {
  async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenant_id as string | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;
      const result = await orderService.list({ tenantId, status, page, pageSize });
      res.json({ data: result.data, total: result.total, page: page ?? 1, pageSize: pageSize ?? 10, totalPages: result.totalPages });
    } catch (err) {
      nextError(err, res);
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const order = await orderService.getById(req.params.id);
      res.json(order);
    } catch (err) {
      nextError(err, res);
    }
  },

  async create(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenant_id || req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, error: "tenant_id is required" });
        return;
      }
      const order = await orderService.create({
        tenantId,
        productId: req.body.product_id,
        quantity: req.body.quantity,
      });
      res.status(201).json(order);
    } catch (err) {
      nextError(err, res);
    }
  },

  async approve(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }
      const order = await orderService.approve(req.params.id, userId);
      res.json(order);
    } catch (err) {
      nextError(err, res);
    }
  },

  async cancel(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }
      const order = await orderService.cancel(req.params.id, userId, req.body.reason);
      res.json(order);
    } catch (err) {
      nextError(err, res);
    }
  },
};

function nextError(err: unknown, res: Response) {
  if (err instanceof AppError) {
    const status =
      err.code === "NOT_FOUND" ? 404 :
      err.code === "VALIDATION_ERROR" ? 400 :
      err.code === "UNAUTHORIZED" ? 401 : 400;
    res.status(status).json({ success: false, error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
}
