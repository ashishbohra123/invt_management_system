import { useEffect, useState, type ReactNode } from "react";
import { Modal, Button } from "@moc/shared";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmStyle?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmStyle = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button
            variant={confirmStyle === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
}
