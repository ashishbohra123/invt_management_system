import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { inventoryController } from "../controllers/inventoryController.js";

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);

/**
 * @openapi
 * /inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenant_id
 *         schema:
 *           type: string
 *         description: Filter by tenant ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name or SKU
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated inventory records
 */
inventoryRouter.get("/", inventoryController.list);

/**
 * @openapi
 * /inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get an inventory record by ID
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
 *         description: The inventory record
 *       404:
 *         description: Inventory record not found
 */
inventoryRouter.get("/:id", inventoryController.getById);

/**
 * @openapi
 * /inventory/{id}:
 *   put:
 *     tags: [Inventory]
 *     summary: Update inventory stock
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
 *             required: [current_inventory]
 *             properties:
 *               current_inventory:
 *                 type: integer
 *                 description: The new stock quantity
 *     responses:
 *       200:
 *         description: The updated inventory record
 */
inventoryRouter.put("/:id", inventoryController.update);
