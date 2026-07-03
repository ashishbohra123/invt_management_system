import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "#388e3c", color: "#fff", border: "none" },
  secondary: { background: "#fff", color: "#333", border: "1px solid #ccc" },
  danger: { background: "#d32f2f", color: "#fff", border: "none" },
  ghost: { background: "none", color: "#388e3c", border: "none", padding: "4px 8px" },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "4px 12px", fontSize: 12 },
  md: { padding: "8px 16px", fontSize: 14 },
  lg: { padding: "12px 24px", fontSize: 16 },
};

export function Button({
  children, variant = "primary", size = "md",
  disabled, onClick, style,
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontWeight: variant === "ghost" ? 500 : 600,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
