import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { tenantController } from "../controllers/tenantController.js";

export const tenantRouter = Router();
tenantRouter.use(authenticate);

/**
 * @openapi
 * /tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: List all tenants
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: An array of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
tenantRouter.get("/", tenantController.list);

/**
 * @openapi
 * /tenants:
 *   post:
 *     tags: [Tenants]
 *     summary: Create a new tenant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created tenant
 */
tenantRouter.post("/", tenantController.create);

/**
 * @openapi
 * /tenants/{id}:
 *   get:
 *     tags: [Tenants]
 *     summary: Get a tenant by ID
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
 *         description: The tenant object
 *       404:
 *         description: Tenant not found
 */
tenantRouter.get("/:id", tenantController.getById);

/**
 * @openapi
 * /tenants/{id}:
 *   put:
 *     tags: [Tenants]
 *     summary: Update a tenant
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
 *     responses:
 *       200:
 *         description: The updated tenant
 */
tenantRouter.put("/:id", tenantController.update);

/**
 * @openapi
 * /tenants/{id}:
 *   delete:
 *     tags: [Tenants]
 *     summary: Delete a tenant
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
 *         description: Tenant deleted
 */
tenantRouter.delete("/:id", tenantController.delete);
