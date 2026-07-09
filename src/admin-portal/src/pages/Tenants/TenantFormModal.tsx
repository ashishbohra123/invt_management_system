import { useState, useEffect, type FormEvent } from "react";
import { tenantsService, type Tenant, type CreateTenantInput } from "@moc/shared";
import { Modal, Input, Button } from "@moc/shared";

interface TenantFormModalProps {
  open: boolean;
  onClose: () => void;
  editTenant?: Tenant | null;
  onSave: () => void;
}

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14, color: "#374151",
};
const fieldStyle: React.CSSProperties = { marginBottom: 16 };

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

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Tenant" : "Create Tenant"}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Tenant" : "Create Tenant"}
          </Button>
        </div>
      }
    >
      {error && <p style={{ color: "#dc2626", fontSize: 14, margin: "0 0 12px" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Name</label>
          <Input
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Domains (comma-separated)</label>
          <Input
            value={(form.domains ?? []).join(", ")}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="example.com, example.org"
          />
        </div>
      </form>
    </Modal>
  );
}
