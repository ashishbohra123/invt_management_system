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
const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<string, { label: string; variant: "info" | "success" | "danger" | "default" }> = {
  created: { label: "Created", variant: "info" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

const STATUS_OPTIONS = ["", "created", "confirmed", "cancelled"] as const;

const statusBadgeColors: Record<string, React.CSSProperties> = {
  created: { background: "#EFF6FF", color: "#2563EB" },
  confirmed: { background: "#DCFCE7", color: "#16A34A" },
  cancelled: { background: "#FEE2E2", color: "#DC2626" },
};

const tableHeaderBg = "#F9FAFB";
const cardBorder = "#E5E7EB";
const primaryColor = "#2563EB";

function OrderStatusBadge({ status }: { status: string }) {
  const colors = statusBadgeColors[status] ?? { background: "#F1F5F9", color: "#475569" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 9,
      fontSize: 12,
      fontWeight: 600,
      lineHeight: "20px",
      ...colors,
    }}>
      {STATUS_CONFIG[status]?.label ?? status}
    </span>
  );
}

interface ProductOption { id: string; name: string; sku: string; }

export function OrderList() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: 1 });
  const [actionTarget, setActionTarget] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<"approve" | "cancel" | null>(null);
  const [detailTarget, setDetailTarget] = useState<Order | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_PATH}?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const json = await res.json();
      const payload = json.data ?? json;
      const list = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
      setItems(list);
      setTotalPages(payload.totalPages ?? Math.max(1, Math.ceil((payload.total ?? list.length) / PAGE_SIZE)));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: newOrder.productId, quantity: newOrder.quantity }),
      });
      if (!res.ok) throw new Error("Failed to create order");
      setCreateOpen(false);
      setNewOrder({ productId: "", quantity: 1 });
      toast("Order created successfully", "success");
      fetchItems();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Create failed", "error");
    }
  };

  const openCreateModal = async () => {
    setCreateOpen(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setProducts(list.map((p: { id: string; name: string; sku: string }) => ({ id: p.id, name: p.name, sku: p.sku })));
      }
    } catch { /* silently ignore product fetch failure */ }
  };

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    try {
      const res = await fetch(`${API_PATH}/${actionTarget.id}/${actionType}`, { method: "PUT" });
      if (!res.ok) throw new Error(`Failed to ${actionType} order`);
      setActionTarget(null);
      setActionType(null);
      setDetailTarget(null);
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
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: "createdAt", header: "Created",
      render: (o) => (
        <span style={{ color: "#6B7280", fontSize: 13 }}>
          {new Date(o.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions", header: "Actions",
      render: (o) => (
        <span style={{ display: "flex", gap: 8 }}>
          {o.status === "created" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActionTarget(o); setActionType("approve"); }}
                style={{
                  padding: "4px 12px", borderRadius: 6, border: `1px solid ${primaryColor}`,
                  background: "#fff", color: primaryColor, cursor: "pointer", fontSize: 12, fontWeight: 500,
                }}
              >
                Confirm
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActionTarget(o); setActionType("cancel"); }}
                style={{
                  padding: "4px 12px", borderRadius: 6, border: "1px solid #DC2626",
                  background: "#fff", color: "#DC2626", cursor: "pointer", fontSize: 12, fontWeight: 500,
                }}
              >
                Cancel
              </button>
            </>
          )}
        </span>
      ),
    },
  ];

  const handleRowClick = (order: Order) => {
    setDetailTarget(order);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111111" }}>Orders</h1>
        <Button onClick={openCreateModal}>+ New Order</Button>
      </div>

      <div style={{
        display: "flex", gap: 8, marginBottom: 20,
        flexWrap: "wrap", alignItems: "center",
      }}>
        {STATUS_OPTIONS.map((s) => {
          const isActive = statusFilter === s;
          const label = s === "" ? "All" : STATUS_CONFIG[s]?.label ?? s;
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                padding: "6px 16px", borderRadius: 8, border: isActive ? "none" : `1px solid ${cardBorder}`,
                background: isActive ? primaryColor : "#fff",
                color: isActive ? "#fff" : "#374151",
                cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 500,
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{
        borderRadius: 12, border: `1px solid ${cardBorder}`,
        overflow: "hidden", background: "#fff",
      }}>
        <DataTable<Order>
          columns={columns}
          data={items}
          loading={loading}
          error={error}
          keyExtractor={(o) => o.id}
          onRowClick={handleRowClick}
        />
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
          Previous
        </Button>
        <span style={{ fontSize: 14, color: "#6B7280" }}>Page {page} of {totalPages}</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          Next
        </Button>
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
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#374151" }}>
            Product
          </label>
          <select
            value={newOrder.productId}
            onChange={(e) => setNewOrder(p => ({ ...p, productId: e.target.value }))}
            style={{
              width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6,
              border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer",
              color: newOrder.productId ? "#111" : "#9CA3AF",
            }}
          >
            <option value="" disabled>Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#374151" }}>
            Quantity
          </label>
          <Input
            type="number"
            value={String(newOrder.quantity)}
            onChange={(e) => setNewOrder(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
          />
        </div>
      </Modal>

      <Modal
        open={actionTarget !== null && actionType !== null}
        title={actionType === "approve" ? "Approve Order" : "Cancel Order"}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setActionTarget(null); setActionType(null); }}>
              Back
            </Button>
            <Button
              onClick={handleAction}
            >
              {actionType === "approve" ? "Approve" : "Cancel"}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
          Are you sure you want to {actionType} this order?
          {actionTarget && (
            <span style={{ display: "block", marginTop: 8, fontSize: 13, color: "#374151" }}>
              Product: {actionTarget.productName} &middot; SKU: {actionTarget.productSku} &middot; Qty: {actionTarget.quantity}
            </span>
          )}
        </p>
      </Modal>

      {detailTarget && (
        <>
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)",
              zIndex: 1000,
            }}
            onClick={() => setDetailTarget(null)}
          />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0,
            width: 480, maxWidth: "100vw",
            background: "#fff", zIndex: 1001,
            boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px", borderBottom: `1px solid ${cardBorder}`,
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111111" }}>
                Order Details
              </h2>
              <button
                onClick={() => setDetailTarget(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 20, color: "#6B7280", padding: 4, lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: 24, overflow: "auto", flex: 1 }}>
              <div style={{ marginBottom: 24 }}>
                <OrderStatusBadge status={detailTarget.status} />
              </div>

              <div style={{ display: "grid", gap: 20 }}>
                <DetailRow label="Product" value={detailTarget.productName} />
                <DetailRow label="SKU" value={detailTarget.productSku} />
                <DetailRow label="Quantity" value={String(detailTarget.quantity)} />
                <DetailRow label="Order ID" value={detailTarget.id} />
                <DetailRow label="Status" value={STATUS_CONFIG[detailTarget.status]?.label ?? detailTarget.status} />
                <DetailRow
                  label="Created"
                  value={new Date(detailTarget.createdAt).toLocaleString()}
                />
                <DetailRow
                  label="Last Updated"
                  value={new Date(detailTarget.updatedAt).toLocaleString()}
                />
                <DetailRow label="Created By" value={detailTarget.createdBy} />
                {detailTarget.approvedBy && (
                  <DetailRow label="Approved By" value={detailTarget.approvedBy} />
                )}
                {detailTarget.cancelledBy && (
                  <DetailRow label="Cancelled By" value={detailTarget.cancelledBy} />
                )}
              </div>
            </div>

            {detailTarget.status === "created" && (
              <div style={{
                padding: "16px 24px", borderTop: `1px solid ${cardBorder}`,
                display: "flex", gap: 12, justifyContent: "flex-end",
              }}>
                <button
                  onClick={() => {
                    setActionTarget(detailTarget);
                    setActionType("cancel");
                  }}
                  style={{
                    padding: "8px 20px", borderRadius: 8, border: `1px solid #DC2626`,
                    background: "#fff", color: "#DC2626", cursor: "pointer",
                    fontSize: 14, fontWeight: 500,
                  }}
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => {
                    setActionTarget(detailTarget);
                    setActionType("approve");
                  }}
                  style={{
                    padding: "8px 20px", borderRadius: 8, border: "none",
                    background: primaryColor, color: "#fff", cursor: "pointer",
                    fontSize: 14, fontWeight: 500,
                  }}
                >
                  Approve Order
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: "#111111", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
