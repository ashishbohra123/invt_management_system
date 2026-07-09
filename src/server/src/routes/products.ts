import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { productController } from "../controllers/productController.js";

export const productRouter = Router();
productRouter.use(authenticate);

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenant_id
 *         schema:
 *           type: string
 *         description: Filter by tenant ID
 *     responses:
 *       200:
 *         description: An array of products
 */
productRouter.get("/", productController.list);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The product object
 *       404:
 *         description: Product not found
 */
productRouter.get("/:id", async (req, res) => {
  const { pool } = await import("../config/index.js");
  const result = await pool.query("SELECT id, tenant_id, sku, name, category, reorder_threshold, cost_per_unit, created_at, updated_at FROM products WHERE id = $1", [req.params.id]);
  if (result.rowCount === 0) { res.status(404).json({ success: false, error: "Product not found" }); return; }
  const row = result.rows[0];
  res.json({ id: row.id, sku: row.sku, name: row.name, category: row.category, reorderThreshold: row.reorder_threshold, costPerUnit: Number(row.cost_per_unit), tenantId: row.tenant_id, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
});

/**
 * @openapi
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sku, name, tenant_id]
 *             properties:
 *               tenant_id:
 *                 type: string
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               reorder_threshold:
 *                 type: integer
 *               cost_per_unit:
 *                 type: number
 *     responses:
 *       201:
 *         description: The created product
 */
productRouter.post("/", productController.create);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               reorder_threshold:
 *                 type: integer
 *               cost_per_unit:
 *                 type: number
 *     responses:
 *       200:
 *         description: The updated product
 */
productRouter.put("/:id", productController.update);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 */
productRouter.delete("/:id", productController.delete);
