import React, { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "#2563EB", color: "#fff", border: "none" },
  secondary: { background: "#fff", color: "#374151", border: "1px solid #D1D5DB" },
  danger: { background: "#DC2626", color: "#fff", border: "none" },
  ghost: { background: "none", color: "#2563EB", border: "none", padding: "4px 8px" },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: 13 },
  md: { padding: "10px 20px", fontSize: 14 },
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
        opacity: disabled ? 0.5 : 1,
        fontWeight: 500,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
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
