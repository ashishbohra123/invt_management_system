import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { DataTable } from "../../components/ui/DataTable";
import { SearchBar } from "../../components/ui/SearchBar";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import type { Column } from "../../components/ui/DataTable";
import { CATEGORIES } from "@moc/shared";

interface Product {
  id: string; sku: string; name: string; category: string;
  reorderThreshold: number; costPerUnit: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

const API_PATH = "/api/products";

const categoryOptions = Object.values(CATEGORIES);

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

const inlineLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap",
};

const toggleBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 12px", fontSize: 13, cursor: "pointer",
  border: "1px solid #D1D5DB", background: active ? "#388E3C" : "#fff",
  color: active ? "#fff" : "#374151", borderRadius: 4,
});

export function ProductList() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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
      const res = await fetch(API_PATH, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setItems(list);
      setTotalPages(Math.max(1, Math.ceil(list.length / pageSize)));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
      );
    }
    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter);
    }
    return result;
  }, [items, search, categoryFilter]);

  const totalFilteredPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalFilteredPages) setPage(totalFilteredPages);
  }, [totalFilteredPages, page]);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleCategoryFilter = useCallback((cat: string) => {
    setCategoryFilter(cat === categoryFilter ? "" : cat);
    setPage(1);
  }, [categoryFilter]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#111" }}>Products</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setViewMode("list")} style={toggleBtn(viewMode === "list")}>List</button>
          <button onClick={() => setViewMode("grid")} style={toggleBtn(viewMode === "grid")}>Grid</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by name, SKU, or category..." />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={inlineLabel}>Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            style={{
              padding: "6px 10px", fontSize: 13, borderRadius: 4,
              border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer",
            }}
          >
            <option value="">All</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
        {filtered.length < items.length && (
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {filtered.length} of {items.length} products
          </span>
        )}
      </div>

      {loading ? (
        <p style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>Loading...</p>
      ) : error ? (
        <p style={{ color: "#DC2626", padding: 16 }}>{error}</p>
      ) : filtered.length === 0 ? (
        <p style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
          {search || categoryFilter ? "No products match your filters." : "No products found."}
        </p>
      ) : viewMode === "list" ? (
        <DataTable<Product>
          columns={columns}
          data={paginated}
          loading={false}
          keyExtractor={(p) => p.id}
        />
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {paginated.map((p) => (
            <Card key={p.id}>
              <CardContent style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace", marginTop: 2 }}>{p.sku}</div>
                  </div>
                  <Badge variant="info">{p.category}</Badge>
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: 13, color: "#6B7280" }}>
                  <div>
                    <div style={{ fontWeight: 500, color: "#374151" }}>${Number(p.costPerUnit).toFixed(2)}</div>
                    <div style={{ fontSize: 11 }}>Cost</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: "#374151" }}>{p.reorderThreshold}</div>
                    <div style={{ fontSize: 11 }}>Threshold</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalFilteredPages > 1 && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span style={{ fontSize: 14 }}>Page {page} of {totalFilteredPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalFilteredPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
