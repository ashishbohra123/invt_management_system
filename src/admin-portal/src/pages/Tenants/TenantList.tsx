import { useState, useEffect, useCallback } from "react";
import { tenantsService, type Tenant } from "@moc/shared";
import { DataTable, Button, SearchBar, Badge, Modal } from "@moc/shared";
import type { Column } from "@moc/shared";
import { TenantFormModal } from "./TenantFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const iconEdit = "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z";
const iconDelete = "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2";

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tenantsService.list();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tenantsService.delete(deleteTarget.id);
      setTenants((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleteTarget(null);
    }
  };

  function openCreate() {
    setEditingTenant(null);
    setModalOpen(true);
  }

  function openEdit(tenant: Tenant) {
    setEditingTenant(tenant);
    setModalOpen(true);
  }

  const filteredTenants = tenants.filter((t) =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.domains ?? []).some((d) => d.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Tenant>[] = [
    { key: "name", header: "Tenant Name", render: (t) => <span style={{ fontWeight: 500 }}>{t.name}</span> },
    {
      key: "domain", header: "Domain",
      render: (t) => (t.domains ?? [])[0] || "\u2014",
    },
    {
      key: "contact", header: "Contact",
      render: () => (
        <div>
          <div style={{ fontSize: 14 }}>{"\u2014"}</div>
          <small style={{ color: "#6B7280" }}>{"\u2014"}</small>
        </div>
      ),
    },
    {
      key: "status", header: "Status",
      render: (t) => (
        <Badge variant={t.status === "active" ? "success" : "danger"}>{t.status}</Badge>
      ),
    },
    {
      key: "users", header: "Users",
      render: () => "\u2014",
    },
    {
      key: "actions", header: "Actions",
      render: (t) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            title="Edit"
            onClick={() => openEdit(t)}
            style={iconBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.borderColor = "#9CA3AF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={iconEdit} /></svg>
          </button>
          <button
            title="Delete"
            onClick={() => setDeleteTarget(t)}
            style={iconBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#FECACA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={iconDelete} /></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: 0 }}>Tenant Management</h1>
        <Button onClick={openCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Tenant
        </Button>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search tenants by name, domain, or contact..."
      />

      <DataTable
        columns={columns}
        data={filteredTenants}
        loading={loading}
        error={error}
        emptyMessage="No tenants found."
        keyExtractor={(t) => t.id}
      />

      {deleteError && <p style={{ color: "#DC2626", fontSize: 14, marginTop: 8 }}>{deleteError}</p>}

      <TenantFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTenant(null); }}
        editTenant={editingTenant}
        onSave={fetchTenants}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Tenant"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmStyle="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 36, height: 36,
  border: "1px solid #D1D5DB", background: "#fff",
  borderRadius: 6, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#6B7280", transition: "all 0.2s",
};
