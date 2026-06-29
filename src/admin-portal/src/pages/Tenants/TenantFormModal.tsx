import { useState, useEffect, type FormEvent } from "react";
import { tenantsService, type Tenant, type CreateTenantInput } from "@moc/shared";

interface TenantFormModalProps {
  open: boolean;
  onClose: () => void;
  editTenant?: Tenant | null;
  onSave: () => void;
}

const emptyForm: CreateTenantInput = { name: "", domains: [] };

export function TenantFormModal({ open, onClose, editTenant, onSave }: TenantFormModalProps) {
  const isEdit = Boolean(editTenant);
  const [form, setForm] = useState<CreateTenantInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setForm(emptyForm); setError(null); return; }
    if (editTenant) {
      setForm({
        name: editTenant.name,
        domains: editTenant.domains ?? [],
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [open, editTenant]);

  function setField<K extends keyof CreateTenantInput>(key: K, value: CreateTenantInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setDomainInput(raw: string) {
    const domains = raw.split(",").map((d) => d.trim()).filter(Boolean);
    setField("domains", domains);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && editTenant) {
        await tenantsService.update(editTenant.id, form);
      } else {
        await tenantsService.create(form);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div style={overlay} onClick={onClose} />
      <div style={modal}>
        <div style={header}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{isEdit ? "Edit Tenant" : "Create Tenant"}</h2>
          <button onClick={onClose} style={closeBtn}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={body}>
            {error && <p style={{ color: "#d32f2f", margin: "0 0 12px", fontSize: 14 }}>{error}</p>}

            <div style={field}>
              <label style={label}>Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                style={input}
              />
            </div>

            <div style={field}>
              <label style={label}>Domains (comma-separated)</label>
              <input
                value={(form.domains ?? []).join(", ")}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="example.com, example.org"
                style={input}
              />
            </div>
          </div>

          <div style={footer}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={submitBtn}>
              {saving ? "Saving..." : isEdit ? "Update Tenant" : "Create Tenant"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999,
};
const modal: React.CSSProperties = {
  position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
  background: "#fff", borderRadius: 8, width: 480, maxWidth: "90vw",
  maxHeight: "85vh", overflowY: "auto", zIndex: 1000,
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};
const header: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 20px", borderBottom: "1px solid #e0e0e0",
};
const closeBtn: React.CSSProperties = {
  background: "none", border: "none", fontSize: 24, cursor: "pointer",
  color: "#666", lineHeight: 1, padding: "0 4px",
};
const body: React.CSSProperties = { padding: "20px" };
const field: React.CSSProperties = { marginBottom: 16 };
const label: React.CSSProperties = {
  display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14,
};
const input: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #ccc",
  borderRadius: 4, boxSizing: "border-box", fontSize: 14, outline: "none",
};
const footer: React.CSSProperties = {
  display: "flex", justifyContent: "flex-end", gap: 8,
  padding: "12px 20px", borderTop: "1px solid #e0e0e0",
};
const cancelBtn: React.CSSProperties = {
  padding: "8px 16px", border: "1px solid #ccc", borderRadius: 4,
  background: "#fff", cursor: "pointer", fontSize: 14,
};
const submitBtn: React.CSSProperties = {
  padding: "8px 16px", border: "none", borderRadius: 4,
  background: "#1976d2", color: "#fff", cursor: "pointer", fontSize: 14,
};
