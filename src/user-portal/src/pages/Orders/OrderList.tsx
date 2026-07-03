import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import type { Column } from "../../components/ui/DataTable";

interface Order {
  id: string; productId: string; productName: string; productSku: string;
  quantity: number; status: string; tenantId: string;
  createdBy: string; approvedBy?: string; cancelledBy?: string;
  createdAt: string; updatedAt: string;
}

const API_PATH = "/api/orders";
const statusColors: Record<string, string> = {
  created: "info", approved: "success", cancelled: "danger",
};

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
  const { toast } = useToast();

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
      toast("Order created successfully", "success");
      fetchItems();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Create failed", "error");
    }
  };

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    try {
      const res = await fetch(`${API_PATH}/${actionTarget.id}/${actionType}`, { method: "PUT" });
      if (!res.ok) throw new Error(`Failed to ${actionType} order`);
      setActionTarget(null);
      setActionType(null);
      toast(`Order ${actionType}d successfully`, "success");
      fetchItems();
    } catch (err) {
      toast(err instanceof Error ? err.message : `${actionType} failed`, "error");
    }
  };

  const columns: Column<Order>[] = [
    { key: "productName", header: "Product" },
    { key: "productSku", header: "SKU" },
    { key: "quantity", header: "Qty" },
    {
      key: "status", header: "Status",
      render: (o) => (
        <Badge variant={(statusColors[o.status] ?? "default") as "success" | "info" | "danger"}>
          {o.status}
        </Badge>
      ),
    },
    {
      key: "createdAt", header: "Created",
      render: (o) => new Date(o.createdAt).toLocaleDateString(),
    },
    {
      key: "actions", header: "Actions",
      render: (o) => (
        <>
          {o.status === "created" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setActionTarget(o); setActionType("approve"); }}>Approve</Button>
              <Button variant="ghost" size="sm" onClick={() => { setActionTarget(o); setActionType("cancel"); }} style={{ color: "#d32f2f" }}>Cancel</Button>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        <Button onClick={() => setCreateOpen(true)}>+ New Order</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8, fontSize: 14 }}>Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", fontSize: 14 }}
        >
          <option value="">All</option>
          <option value="created">Created</option>
          <option value="approved">Approved</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable<Order>
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        keyExtractor={(o) => o.id}
      />

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span style={{ fontSize: 14 }}>Page {page} of {totalPages}</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>

      <Modal
        open={createOpen}
        title="New Order"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </>
        }
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Product ID</label>
          <Input value={newOrder.productId} onChange={(e) => setNewOrder(p => ({ ...p, productId: e.target.value }))} placeholder="Enter product ID" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Quantity</label>
          <Input type="number" value={String(newOrder.quantity)} onChange={(e) => setNewOrder(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
        </div>
      </Modal>

      <Modal
        open={actionTarget !== null}
        title={actionType === "approve" ? "Approve Order" : "Cancel Order"}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setActionTarget(null); setActionType(null); }}>Back</Button>
            <Button variant={actionType === "cancel" ? "danger" : "primary"} onClick={handleAction}>
              {actionType === "approve" ? "Approve" : "Cancel"}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: "#555", lineHeight: 1.5 }}>
          Are you sure you want to {actionType} this order?
        </p>
      </Modal>
    </div>
  );
}
