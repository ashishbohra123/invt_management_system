import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_PATHS, Role, Input, Button } from "@moc/shared";

const USERS_PATH = API_PATHS.USERS;

interface FormData {
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
}

const initialForm: FormData = { name: "", email: "", role: Role.VIEWER, status: "active" };

const ROLE_OPTIONS = [
  { value: Role.SUPER_ADMIN, label: "Super Admin" },
  { value: Role.ADMIN, label: "Admin" },
  { value: Role.MANAGER, label: "Manager" },
  { value: Role.VIEWER, label: "Viewer" },
];

const labelStyle: React.CSSProperties = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14, color: "#374151" };
const selectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1px solid #d1d5db",
  borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box",
  color: "#111", background: "#fff",
};

export function UserForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`${USERS_PATH}/${id}`);
        if (!res.ok) throw new Error("User not found");
        const json = await res.json();
        const user = json.data ?? json;
        setForm({ name: user.name, email: user.email, role: user.role, status: user.status });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `${USERS_PATH}/${id}` : USERS_PATH;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Failed to ${isEdit ? "update" : "create"} user`);
      navigate("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p style={{ color: "#6b7280", fontSize: 14 }}>Loading user...</p>;
  if (error && !form.name && isEdit) return <p style={{ color: "#dc2626" }}>{error}</p>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: "0 0 24px" }}>
        {isEdit ? "Edit User" : "Create User"}
      </h1>
      {error && <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Name</label>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            style={selectStyle}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
            style={selectStyle}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
          <Button variant="secondary" type="button" onClick={() => navigate("/users")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
