import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { DataTable, SearchBar, Button, Badge, Card, CardContent, Modal, Input, productsService, apiPost, ApiError, API_PATHS } from "@moc/shared";
import type { Column } from "@moc/shared";
import { CATEGORIES } from "@moc/shared";

interface Product {
  id: string; sku: string; name: string; category: string;
  reorderThreshold: number; costPerUnit: number; tenantId: string;
  createdAt: string; updatedAt: string;
}

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

function AddProductModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", sku: "", category: "", costPerUnit: "", reorderThreshold: "10" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.name || !form.sku) { setError("Name and SKU are required"); return; }
    setSaving(true); setError(null);
    try {
      await apiPost(API_PATHS.PRODUCTS, {
        name: form.name, sku: form.sku,
        category: form.category || undefined,
        cost_per_unit: form.costPerUnit ? parseFloat(form.costPerUnit) : undefined,
        reorder_threshold: parseInt(form.reorderThreshold, 10),
      });
      onCreated();
      onClose();
      setForm({ name: "", sku: "", category: "", costPerUnit: "", reorderThreshold: "10" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} title="Add Product" onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </>
      }
    >
      {error && <p style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Name *</label>
        <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Product name" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>SKU *</label>
        <Input value={form.sku} onChange={(e) => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="e.g. PROD-001" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Category</label>
        <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
          style={{
            width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6,
            border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer",
          }}
        >
          <option value="">Select...</option>
          {categoryOptions.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Cost per Unit</label>
        <Input type="number" value={form.costPerUnit} onChange={(e) => setForm(p => ({ ...p, costPerUnit: e.target.value }))} placeholder="0.00" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Reorder Threshold</label>
        <Input type="number" value={form.reorderThreshold} onChange={(e) => setForm(p => ({ ...p, reorderThreshold: e.target.value }))} />
      </div>
    </Modal>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#374151",
};

export function ProductList() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const pageSize = 10;

  const fetchItems = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await productsService.list();
      const list = result?.data ?? [];
      setItems(list);
      setTotalPages(Math.max(1, Math.ceil(list.length / pageSize)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  }, [pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#111" }}>Products</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => setAddOpen(true)}>+ Add Product</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setViewMode("list")} style={toggleBtn(viewMode === "list")}>List</button>
          <button onClick={() => setViewMode("grid")} style={toggleBtn(viewMode === "grid")}>Grid</button>
        </div>
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

      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={fetchItems} />
    </div>
  );
}
