import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: "#e0e0e0", color: "#333" },
  success: { background: "#e8f5e9", color: "#2e7d32" },
  warning: { background: "#fff3e0", color: "#e65100" },
  danger: { background: "#ffebee", color: "#c62828" },
  info: { background: "#e3f2fd", color: "#1565c0" },
};

export function Badge({ children, variant = "default", style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: "20px",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
