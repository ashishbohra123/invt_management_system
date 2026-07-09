import { pool } from "../config/index.js";

export interface ProductRow {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  category: string | null;
  is_active: boolean;
  reorder_threshold: number;
  cost_per_unit: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateProductInput = {
  tenantId: string;
  sku: string;
  name: string;
  category?: string;
  reorderThreshold?: number;
  costPerUnit?: number;
};

export type UpdateProductInput = {
  sku?: string;
  name?: string;
  category?: string;
  isActive?: boolean;
  reorderThreshold?: number;
  costPerUnit?: number;
};

function mapRow(row: ProductRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    isActive: row.is_active,
    reorderThreshold: row.reorder_threshold,
    costPerUnit: row.cost_per_unit ? Number(row.cost_per_unit) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const productRepository = {
  async findAll(tenantId?: string): Promise<ReturnType<typeof mapRow>[]> {
    let query = `SELECT * FROM products`;
    const params: string[] = [];
    if (tenantId) {
      query += ` WHERE tenant_id = $1`;
      params.push(tenantId);
    }
    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows.map(mapRow);
  },

  async findById(id: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async findBySku(tenantId: string, sku: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `SELECT * FROM products WHERE tenant_id = $1 AND sku = $2`,
      [tenantId, sku],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async create(input: CreateProductInput): Promise<ReturnType<typeof mapRow>> {
    const result = await pool.query(
      `INSERT INTO products (tenant_id, sku, name, category, reorder_threshold, cost_per_unit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.tenantId,
        input.sku,
        input.name,
        input.category ?? null,
        input.reorderThreshold ?? 10,
        input.costPerUnit ?? null,
      ],
    );
    return mapRow(result.rows[0]);
  },

  async update(id: string, input: UpdateProductInput): Promise<ReturnType<typeof mapRow> | null> {
    const sets: string[] = [];
    const params: (string | boolean | number | null)[] = [];
    let idx = 1;

    if (input.sku !== undefined) { sets.push(`sku = $${idx++}`); params.push(input.sku); }
    if (input.name !== undefined) { sets.push(`name = $${idx++}`); params.push(input.name); }
    if (input.category !== undefined) { sets.push(`category = $${idx++}`); params.push(input.category); }
    if (input.isActive !== undefined) { sets.push(`is_active = $${idx++}`); params.push(input.isActive); }
    if (input.reorderThreshold !== undefined) { sets.push(`reorder_threshold = $${idx++}`); params.push(input.reorderThreshold); }
    if (input.costPerUnit !== undefined) { sets.push(`cost_per_unit = $${idx++}`); params.push(input.costPerUnit); }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = NOW()`);
    params.push(id);
    const result = await pool.query(
      `UPDATE products SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      params,
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
