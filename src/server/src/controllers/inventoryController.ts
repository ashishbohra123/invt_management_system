import type { Request, Response } from "express";
import { inventoryService, AppError } from "../services/index.js";

export const inventoryController = {
  async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenant_id as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;
      const result = await inventoryService.list(tenantId, search, page, pageSize);
      const p = page ?? 1;
      const ps = pageSize ?? 10;
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: p,
        pageSize: ps,
        totalPages: Math.ceil(result.total / ps),
      });
    } catch (err) {
      nextError(err, res);
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const record = await inventoryService.getById(req.params.id);
      res.json(record);
    } catch (err) {
      nextError(err, res);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const quantity = parseInt(req.body.current_inventory ?? req.body.quantity, 10);
      if (isNaN(quantity)) {
        res.status(400).json({ success: false, error: "Valid quantity is required" });
        return;
      }
      const record = await inventoryService.updateStock(req.params.id, quantity);
      if (!record) {
        res.status(404).json({ success: false, error: "Inventory record not found" });
        return;
      }
      res.json(record);
    } catch (err) {
      nextError(err, res);
    }
  },
};

function nextError(err: unknown, res: Response) {
  if (err instanceof AppError) {
    const status =
      err.code === "NOT_FOUND" ? 404 :
      err.code === "VALIDATION_ERROR" ? 400 : 400;
    res.status(status).json({ success: false, error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
}
