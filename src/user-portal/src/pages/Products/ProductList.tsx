import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "../../components/ui/DataTable";
import { SearchBar } from "../../components/ui/SearchBar";
import { Button } from "../../components/ui/Button";
import type { Column } from "../../components/ui/DataTable";

interface Product {
  id: string; sku: string; name: string; category: string;
  reorderThreshold: number; costPerUnit: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

const API_PATH = "/api/products";

const columns: Column<Product>[] = [
  { key: "sku", header: "SKU" },
  { key: "name", header: "Name" },
  { key: "category", header: "Category" },
  {
    key: "costPerUnit", header: "Cost",
    render: (p) => `$${Number(p.costPerUnit).toFixed(2)}`,
  },
  { key: "reorderThreshold", header: "Threshold" },
  {
    key: "createdAt", header: "Created",
    render: (p) => new Date(p.createdAt).toLocaleDateString(),
  },
];

export function ProductList() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
      if (search) params.set("search", search);
      const res = await fetch(`${API_PATH}?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const inner = data.data ?? data;
      const list = Array.isArray(inner) ? inner : Array.isArray(inner?.data) ? inner.data : [];
      setItems(list);
      setTotalPages(inner?.totalPages ?? Math.max(1, Math.ceil((inner?.total ?? list.length) / pageSize)));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [page, search, pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  return (
    <div>
      <h1>Products</h1>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products..." />
      </div>
      <DataTable<Product>
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        keyExtractor={(p) => p.id}
      />
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span style={{ fontSize: 14 }}>Page {page} of {totalPages}</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
