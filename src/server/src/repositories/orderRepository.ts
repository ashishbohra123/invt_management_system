import { pool } from "../config/index.js";

export interface OrderRow {
  id: string;
  tenant_id: string;
  product_id: string;
  quantity: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateOrderInput = {
  tenantId: string;
  productId: string;
  quantity: number;
};

function mapRow(row: OrderRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    productId: row.product_id,
    quantity: row.quantity,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    cancelledBy: row.cancelled_by,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const orderRepository = {
  async findAll(params: { tenantId?: string; status?: string; page?: number; pageSize?: number } = {}): Promise<{ data: ReturnType<typeof mapRow>[]; total: number; totalPages: number }> {
    const { tenantId, status, page = 1, pageSize = 10 } = params;
    const conditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let idx = 1;

    if (tenantId) {
      conditions.push(`o.tenant_id = $${idx++}`);
      queryParams.push(tenantId);
    }
    if (status) {
      conditions.push(`o.status = $${idx++}`);
      queryParams.push(status);
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o${whereClause}`,
      queryParams,
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;

    const dataResult = await pool.query(
      `SELECT o.*, p.name as product_name, p.sku as product_sku
       FROM orders o
       JOIN products p ON p.id = o.product_id${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...queryParams, pageSize, offset],
    );

    const data = dataResult.rows.map((row: Record<string, unknown>) => ({
      ...mapRow(row as unknown as OrderRow),
      productName: row.product_name as string,
      productSku: row.product_sku as string,
    }));

    return { data, total, totalPages };
  },

  async findById(id: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async create(input: CreateOrderInput): Promise<ReturnType<typeof mapRow>> {
    const result = await pool.query(
      `INSERT INTO orders (tenant_id, product_id, quantity, status)
       VALUES ($1, $2, $3, 'created')
       RETURNING *`,
      [input.tenantId, input.productId, input.quantity],
    );
    return mapRow(result.rows[0]);
  },

  async approve(id: string, userId: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `UPDATE orders SET status = 'confirmed', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'created'
       RETURNING *`,
      [userId, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async cancel(id: string, userId: string, reason?: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `UPDATE orders SET status = 'cancelled', cancelled_by = $1, cancelled_at = NOW(), cancel_reason = $2, updated_at = NOW()
       WHERE id = $3 AND status = 'created'
       RETURNING *`,
      [userId, reason ?? null, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async updateStatus(id: string, status: string): Promise<ReturnType<typeof mapRow> | null> {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },
};
