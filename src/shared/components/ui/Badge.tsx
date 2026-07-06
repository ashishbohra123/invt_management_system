import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: "#F1F5F9", color: "#475569" },
  success: { background: "#DCFCE7", color: "#16A34A" },
  warning: { background: "#FEF3C7", color: "#D97706" },
  danger: { background: "#FEE2E2", color: "#DC2626" },
  info: { background: "#DBEAFE", color: "#1E40AF" },
};

export function Badge({ children, variant = "default", style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: "20px",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
