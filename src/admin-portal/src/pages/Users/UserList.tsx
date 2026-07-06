import { useState, useEffect, useCallback, useRef } from "react";
import { usersService, DataTable, Button, SearchBar, Badge } from "@moc/shared";
import type { User } from "@moc/shared";
import type { Column } from "@moc/shared";
import { UserFormModal } from "./UserFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const iconEdit = "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z";
const iconDelete = "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2";

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pageSize = 10;
  const abortRef = useRef<AbortController | null>(null);

  const fetchUsers = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params: { page?: number; pageSize?: number; search?: string } = { page, pageSize };
      if (search) params.search = search;
      const res = await usersService.list(params, controller.signal);
      setUsers(res.data ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search, pageSize]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersService.delete(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleteTarget(null);
    }
  };

  function openCreate() {
    setEditingUser(null);
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns: Column<User>[] = [
    { key: "name", header: "Name", render: (u) => <span style={{ fontWeight: 500 }}>{u.name}</span> },
    { key: "email", header: "Email" },
    {
      key: "role", header: "Role",
      render: (u) => <Badge variant="default">{u.role}</Badge>,
    },
    {
      key: "status", header: "Status",
      render: (u) => (
        <Badge variant={u.status === "active" ? "success" : "danger"}>{u.status}</Badge>
      ),
    },
    {
      key: "createdAt", header: "Created",
      render: (u) => new Date(u.createdAt).toLocaleDateString(),
    },
    {
      key: "actions", header: "Actions",
      render: (u) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            title="Edit"
            onClick={() => openEdit(u)}
            style={iconBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.borderColor = "#9CA3AF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={iconEdit} /></svg>
          </button>
          <button
            title="Delete"
            onClick={() => setDeleteTarget(u)}
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
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", margin: 0 }}>User Management</h1>
        <Button onClick={openCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add User
        </Button>
      </div>

      <SearchBar
        value={search}
        onChange={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search users by name, email, or role..."
      />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        emptyMessage="No users found."
        keyExtractor={(u) => u.id}
        footer={
          <div style={paginationStyle}>
            <span style={{ fontSize: 14, color: "#6B7280" }}>
              Showing {total > 0 ? from : 0} to {to} of {total} entries
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={pageBtnStyle}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    ...pageBtnStyle,
                    ...(p === page ? { background: "#2563EB", color: "#fff", borderColor: "#2563EB" } : {}),
                  }}
                >
                  {p}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={pageBtnStyle}>Next</button>
            </div>
          </div>
        }
      />

      {deleteError && <p style={{ color: "#DC2626", fontSize: 14, marginTop: 8 }}>{deleteError}</p>}

      <UserFormModal
        open={modalOpen}
        onClose={closeModal}
        editUser={editingUser ? { ...editingUser, portalAccess: editingUser.portalAccess ?? [] } : null}
        onSave={fetchUsers}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name ?? "this user"}? This action cannot be undone.`}
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

const paginationStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: 16, borderTop: "1px solid #F3F4F6",
};

const pageBtnStyle: React.CSSProperties = {
  padding: "8px 12px", border: "1px solid #D1D5DB",
  background: "#fff", borderRadius: 6, cursor: "pointer",
  fontSize: 13, color: "#374151",
};
