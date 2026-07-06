import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  zIndex: 999,
};
const modalStyle: React.CSSProperties = {
  position: "fixed", top: "50%", left: "50%",
  transform: "translate(-50%,-50%)",
  background: "#fff", borderRadius: 8, padding: 0,
  minWidth: 400, maxWidth: "90vw", width: "100%",
  zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  maxHeight: "85vh", overflowY: "auto",
};
const headerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 20px", borderBottom: "1px solid #e5e7eb",
};
const titleStyle: React.CSSProperties = {
  margin: 0, fontSize: 18, fontWeight: 700, color: "#111",
};
const closeBtnStyle: React.CSSProperties = {
  background: "none", border: "none", fontSize: 24, cursor: "pointer",
  color: "#9ca3af", lineHeight: 1, padding: "0 4px",
};
const bodyStyle: React.CSSProperties = { padding: "20px" };
const footerWrapStyle: React.CSSProperties = {
  display: "flex", justifyContent: "flex-end", gap: 8,
  padding: "12px 20px", borderTop: "1px solid #e5e7eb",
};

export function Modal({ open, title, children, onClose, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle} role="dialog" aria-modal="true">
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerWrapStyle}>{footer}</div>}
      </div>
    </>
  );
}
