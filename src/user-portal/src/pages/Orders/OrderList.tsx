import { useState, useEffect, useCallback, useRef } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";

interface Order {
  id: string; productId: string; productName: string; productSku: string;
  quantity: number; status: string; tenantId: string;
  createdBy: string; approvedBy?: string; cancelledBy?: string;
  createdAt: string; updatedAt: string;
}

const API_PATH = "/api/orders";

export function OrderList() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: 1 });
  const [actionTarget, setActionTarget] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<"approve" | "cancel" | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pageSize = 10;

  const fetchItems = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_PATH}?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      const inner = data.data ?? data;
      const list = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
      setItems(list);
      setTotalPages(inner?.totalPages ?? Math.max(1, Math.ceil((inner?.total ?? list.length) / pageSize)));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [page, pageSize, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch(API_PATH, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newOrder) });
      if (!res.ok) throw new Error("Failed to create order");
      setCreateOpen(false);
      setNewOrder({ productId: "", quantity: 1 });
      fetchItems();
    } catch (err) { setError(err instanceof Error ? err.message : "Create failed"); }
  };

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    try {
      const res = await fetch(`${API_PATH}/${actionTarget.id}/${actionType}`, { method: "PUT" });
      if (!res.ok) throw new Error(`Failed to ${actionType} order`);
      setActionTarget(null);
      setActionType(null);
      fetchItems();
    } catch (err) { setError(err instanceof Error ? err.message : `${actionType} failed`); }
  };

  const statusColors: Record<string, string> = { created: "#1976d2", approved: "#2e7d32", cancelled: "#d32f2f" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        <button onClick={() => setCreateOpen(true)} style={newBtnStyle}>+ New Order</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Filter:</label>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: 8 }}>
          <option value="">All</option>
          <option value="created">Created</option>
          <option value="approved">Approved</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #e0e0e0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                <th style={thStyle}>Product</th><th style={thStyle}>SKU</th>
                <th style={thStyle}>Qty</th><th style={thStyle}>Status</th>
                <th style={thStyle}>Created</th><th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center" }}>No orders found.</td></tr>}
              {items.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                  <td style={tdStyle}>{o.productName}</td>
                  <td style={tdStyle}>{o.productSku}</td>
                  <td style={tdStyle}>{o.quantity}</td>
                  <td style={tdStyle}>
                    <span style={{ color: statusColors[o.status] ?? "#666", fontWeight: 600 }}>{o.status}</span>
                  </td>
                  <td style={tdStyle}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    {o.status === "created" && (
                      <>
                        <button onClick={() => { setActionTarget(o); setActionType("approve"); }} style={approveBtnStyle}>Approve</button>
                        <button onClick={() => { setActionTarget(o); setActionType("cancel"); }} style={cancelBtnStyle}>Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={btnStyle}>Previous</button>
        <span style={{ padding: "8px 0" }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={btnStyle}>Next</button>
      </div>

      {createOpen && (
        <>
          <div style={overlayStyle} onClick={() => setCreateOpen(false)} />
          <div style={modalStyle}>
            <h3>New Order</h3>
            <div style={{ marginBottom: 12 }}>
              <label>Product ID: </label>
              <input value={newOrder.productId} onChange={(e) => setNewOrder(p => ({ ...p, productId: e.target.value }))} style={{ padding: 8, width: "100%", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Quantity: </label>
              <input type="number" min={1} value={newOrder.quantity} onChange={(e) => setNewOrder(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} style={{ padding: 8, width: "100%", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setCreateOpen(false)} style={{ padding: "8px 16px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreate} style={primaryBtnStyle}>Create</button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={actionTarget !== null}
        title={actionType === "approve" ? "Approve Order" : "Cancel Order"}
        message={`Are you sure you want to ${actionType} this order?`}
        confirmLabel={actionType === "approve" ? "Approve" : "Cancel"}
        confirmStyle={actionType === "approve" ? "primary" : "danger"}
        onConfirm={handleAction}
        onCancel={() => { setActionTarget(null); setActionType(null); }}
      />
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: 12, fontWeight: 600, borderBottom: "2px solid #e0e0e0" };
const tdStyle: React.CSSProperties = { padding: 12 };
const btnStyle: React.CSSProperties = { padding: "8px 16px", cursor: "pointer" };
const newBtnStyle: React.CSSProperties = { padding: "8px 16px", background: "#388e3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 };
const approveBtnStyle: React.CSSProperties = { marginRight: 8, color: "#2e7d32", border: "none", background: "none", cursor: "pointer", fontSize: 14 };
const cancelBtnStyle: React.CSSProperties = { color: "#d32f2f", border: "none", background: "none", cursor: "pointer", fontSize: 14 };
const primaryBtnStyle: React.CSSProperties = { padding: "8px 16px", background: "#388e3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 };
const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1001 };
const modalStyle: React.CSSProperties = { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 8, padding: 24, minWidth: 360, maxWidth: "90vw", zIndex: 1002, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" };
