import { useState, useEffect, useCallback } from "react";
import { tenantsService, type Tenant } from "@moc/shared";
import { DataTable, Button, SearchBar, Badge, Modal } from "@moc/shared";
import type { Column } from "@moc/shared";
import { TenantFormModal } from "./TenantFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";

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
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Tenant>[] = [
    { key: "name", header: "Name", render: (t) => <span style={{ fontWeight: 500 }}>{t.name}</span> },
    {
      key: "domains", header: "Domains",
      render: (t) => (t.domains ?? []).join(", ") || "\u2014",
    },
    {
      key: "status", header: "Status",
      render: (t) => (
        <Badge variant={t.status === "active" ? "success" : "danger"}>{t.status}</Badge>
      ),
    },
    {
      key: "createdAt", header: "Created",
      render: (t) => new Date(t.createdAt).toLocaleDateString(),
    },
    {
      key: "actions", header: "Actions",
      render: (t) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Edit</Button>
          <Button variant="ghost" size="sm" style={{ color: "#dc2626" }} onClick={() => setDeleteTarget(t)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111" }}>Tenants</h1>
        <Button onClick={openCreate}>+ New Tenant</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search tenants..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredTenants}
        loading={loading}
        error={error}
        emptyMessage="No tenants found."
        keyExtractor={(t) => t.id}
      />

      {deleteError && <p style={{ color: "#dc2626", fontSize: 14, marginTop: 8 }}>{deleteError}</p>}

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
