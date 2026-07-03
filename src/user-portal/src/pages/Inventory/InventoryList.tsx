import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import type { Column } from "../../components/ui/DataTable";

interface InventoryItem {
  id: string; productId: string; productName: string; productSku: string;
  currentInventory: number; reorderThreshold: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

const API_PATH = "/api/inventory";

export function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const abortRef = useRef<AbortController | null>(null);
  const pageSize = 10;

  const fetchItems = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`${API_PATH}?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      const inner = data.data ?? data;
      const list = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
      setItems(list);
      setTotalPages(inner?.totalPages ?? Math.max(1, Math.ceil((inner?.total ?? list.length) / pageSize)));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const isLowStock = (item: InventoryItem) => item.currentInventory <= item.reorderThreshold;

  const columns: Column<InventoryItem>[] = [
    { key: "productName", header: "Product" },
    { key: "productSku", header: "SKU" },
    { key: "currentInventory", header: "Stock" },
    { key: "reorderThreshold", header: "Threshold" },
    {
      key: "status", header: "Status",
      render: (item) => (
        <Badge variant={isLowStock(item) ? "warning" : "success"}>
          {isLowStock(item) ? "Low Stock" : "In Stock"}
        </Badge>
      ),
    },
    {
      key: "updatedAt", header: "Updated",
      render: (item) => new Date(item.updatedAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <h1>Inventory <span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>Stock Tracking</span></h1>
      <DataTable<InventoryItem>
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        keyExtractor={(item) => item.id}
      />
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span style={{ fontSize: 14 }}>Page {page} of {totalPages}</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
