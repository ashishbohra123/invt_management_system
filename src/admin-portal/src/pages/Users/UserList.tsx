import { useState, useEffect, useCallback, useRef } from "react";
import { API_PATHS, DataTable, Button, SearchBar, Badge } from "@moc/shared";
import type { Column } from "@moc/shared";
import { UserFormModal } from "./UserFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  portalAccess?: string[];
  createdAt: string;
}

const USERS_PATH = API_PATHS.USERS;

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("search", search);
      const res = await fetch(`${USERS_PATH}?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data ?? [];
      setUsers(items);
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? items.length) / pageSize));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, search, pageSize]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${USERS_PATH}/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
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
          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Edit</Button>
          <Button variant="ghost" size="sm" style={{ color: "#dc2626" }} onClick={() => setDeleteTarget(u)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111" }}>Users</h1>
        <Button onClick={openCreate}>+ New User</Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search users..."
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        emptyMessage="No users found."
        keyExtractor={(u) => u.id}
      />

      {deleteError && <p style={{ color: "#dc2626", fontSize: 14, marginTop: 8 }}>{deleteError}</p>}

      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span style={{ fontSize: 14, color: "#6b7280" }}>Page {page} of {totalPages}</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

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
