import { useState, useEffect, type ReactNode } from "react";

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
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      <div style={overlayStyle} onClick={onCancel} />
      <div style={dialogStyle} role="dialog" aria-modal="true">
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 14, color: "#555", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button onClick={onCancel} style={cancelBtnStyle}>{cancelLabel}</button>
          <button onClick={onConfirm} style={confirmStyle === "danger" ? dangerBtnStyle : primaryBtnStyle}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1001,
};

const dialogStyle: React.CSSProperties = {
  position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
  background: "#fff", borderRadius: 8, padding: 24, minWidth: 360,
  maxWidth: "90vw", zIndex: 1002, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px", border: "1px solid #ccc", borderRadius: 4,
  background: "#fff", cursor: "pointer", fontSize: 14,
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "8px 16px", border: "none", borderRadius: 4,
  background: "#d32f2f", color: "#fff", cursor: "pointer", fontSize: 14,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "8px 16px", border: "none", borderRadius: 4,
  background: "#1976d2", color: "#fff", cursor: "pointer", fontSize: 14,
};
