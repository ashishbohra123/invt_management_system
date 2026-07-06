import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: "#f3f4f6", color: "#374151" },
  success: { background: "#dcfce7", color: "#166534" },
  warning: { background: "#fef3c7", color: "#92400e" },
  danger: { background: "#fef2f2", color: "#991b1b" },
  info: { background: "#eff6ff", color: "#1e40af" },
};

export function Badge({ children, variant = "default", style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 9999,
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
