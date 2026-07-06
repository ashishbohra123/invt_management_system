import React, { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "#2563eb", color: "#fff", border: "none" },
  secondary: { background: "#fff", color: "#374151", border: "1px solid #d1d5db" },
  danger: { background: "#dc2626", color: "#fff", border: "none" },
  ghost: { background: "none", color: "#2563eb", border: "none", padding: "4px 8px" },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "4px 12px", fontSize: 12 },
  md: { padding: "8px 16px", fontSize: 14 },
  lg: { padding: "12px 24px", fontSize: 16 },
};

export function Button({
  children, variant = "primary", size = "md",
  disabled, style, ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontWeight: variant === "ghost" ? 500 : 600,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
