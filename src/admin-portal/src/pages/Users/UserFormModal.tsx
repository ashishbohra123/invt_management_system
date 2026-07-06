import { useState, useEffect, useRef, type FormEvent } from "react";
import { Role, PortalType, isValidEmail, Modal, Input, Button, usersService } from "@moc/shared";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  editUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "active" | "inactive";
    portalAccess: string[];
  } | null;
  onSave: () => void;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

const ROLE_OPTIONS = [
  { value: Role.SUPER_ADMIN, label: "Super Admin" },
  { value: Role.ADMIN, label: "Admin" },
  { value: Role.MANAGER, label: "Manager" },
  { value: Role.VIEWER, label: "Viewer" },
];

const PORTAL_OPTIONS = [
  { value: PortalType.ADMIN, label: "Admin Portal" },
  { value: PortalType.PARTNER, label: "Partner Portal" },
  { value: PortalType.CUSTOMER, label: "Customer Portal" },
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: Role.VIEWER,
  portalAccess: [PortalType.ADMIN] as string[],
  isActive: true,
};

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14, color: "#374151",
};
const fieldStyle: React.CSSProperties = { marginBottom: 16 };
const selectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1px solid #d1d5db",
  borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box",
  color: "#111", background: "#fff",
};
const errorTextStyle: React.CSSProperties = {
  color: "#dc2626", fontSize: 12, marginTop: 2, display: "block",
};

export function UserFormModal({ open, onClose, editUser, onSave }: UserFormModalProps) {
  const isEdit = Boolean(editUser);
  const mountedRef = useRef(true);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
      setToast(null);
      return;
    }
    if (editUser) {
      setForm({
        name: editUser.name || "",
        email: editUser.email || "",
        password: "",
        role: (editUser.role as Role) || Role.VIEWER,
        portalAccess: editUser.portalAccess?.length ? editUser.portalAccess : [PortalType.ADMIN],
        isActive: editUser.status === "active",
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
    setToast(null);
  }, [open, editUser]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!isValidEmail(form.email)) next.email = "Invalid email format";
    if (!isEdit && !form.password) next.password = "Password is required";
    else if (!isEdit && form.password.length < 6) next.password = "Password must be at least 6 characters";
    if (!form.portalAccess.length) next.portalAccess = "Select at least one portal";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await usersService.update(editUser!.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role as Role,
          status: form.isActive ? "active" as const : "inactive" as const,
        });
      } else {
        await usersService.create({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role as Role,
        });
      }
      setToast({ type: "success", message: `User ${isEdit ? "updated" : "created"} successfully` });
      setTimeout(() => { if (mountedRef.current) { onSave(); onClose(); } }, 800);
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Operation failed" });
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  function togglePortalAccess(portal: string) {
    setField(
      "portalAccess",
      form.portalAccess.includes(portal)
        ? form.portalAccess.filter((p) => p !== portal)
        : [...form.portalAccess, portal],
    );
  }

  return (
    <>
      <Modal
        open={open}
        title={isEdit ? "Edit User" : "Create User"}
        onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update User" : "Create User"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Name</label>
            <Input
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            {errors.name && <span style={errorTextStyle}>{errors.name}</span>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
          </div>

          {!isEdit && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Password</label>
              <Input
                type="password"
                required
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
              />
              {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
            </div>
          )}

          <div style={fieldStyle}>
            <label style={labelStyle}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setField("role", e.target.value as Role)}
              style={selectStyle}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Portal Access</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PORTAL_OPTIONS.map((opt) => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer", color: "#374151" }}>
                  <input
                    type="checkbox"
                    checked={form.portalAccess.includes(opt.value)}
                    onChange={() => togglePortalAccess(opt.value)}
                    style={{ accentColor: "#2563eb" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.portalAccess && <span style={errorTextStyle}>{errors.portalAccess}</span>}
          </div>

          <div style={fieldStyle}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
                style={{ accentColor: "#2563eb" }}
              />
              Active
            </label>
          </div>
        </form>

        {toast && (
          <div style={{
            padding: "10px 16px", borderRadius: 6, fontSize: 14, textAlign: "center",
            color: "#fff", marginTop: 12,
            background: toast.type === "success" ? "#166534" : "#991b1b",
          }}>
            {toast.message}
          </div>
        )}
      </Modal>
    </>
  );
}
