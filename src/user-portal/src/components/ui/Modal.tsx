import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
  zIndex: 1001,
};
const modalStyle: React.CSSProperties = {
  position: "fixed", top: "50%", left: "50%",
  transform: "translate(-50%,-50%)",
  background: "#fff", borderRadius: 8, padding: 24,
  minWidth: 360, maxWidth: "90vw", width: "100%",
  zIndex: 1002, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};
const titleStyle: React.CSSProperties = {
  margin: "0 0 16px", fontSize: 18, fontWeight: 600,
};
const footerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20,
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
        <h3 style={titleStyle}>{title}</h3>
        <div>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </>
  );
}
