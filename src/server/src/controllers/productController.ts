import type { Request, Response } from "express";
import { productService, AppError } from "../services/index.js";

export const productController = {
  async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenant_id as string | undefined;
      const products = await productService.list(tenantId);
      res.json({ data: products, total: products.length, page: 1, pageSize: products.length, totalPages: 1 });
    } catch (err) {
      nextError(err, res);
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const product = await productService.getById(req.params.id);
      if (!product) {
        res.status(404).json({ success: false, error: "Product not found" });
        return;
      }
      res.json(product);
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
      const product = await productService.create({
        tenantId,
        sku: req.body.sku,
        name: req.body.name,
        category: req.body.category,
        reorderThreshold: req.body.reorder_threshold,
        costPerUnit: req.body.cost_per_unit,
      });
      res.status(201).json(product);
    } catch (err) {
      nextError(err, res);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const product = await productService.update(req.params.id, {
        sku: req.body.sku,
        name: req.body.name,
        category: req.body.category,
        isActive: req.body.is_active,
        reorderThreshold: req.body.reorder_threshold,
        costPerUnit: req.body.cost_per_unit,
      });
      if (!product) {
        res.status(404).json({ success: false, error: "Product not found" });
        return;
      }
      res.json(product);
    } catch (err) {
      nextError(err, res);
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const deleted = await productService.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: "Product not found" });
        return;
      }
      res.status(204).end();
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
