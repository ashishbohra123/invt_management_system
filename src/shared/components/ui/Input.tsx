import React, { type InputHTMLAttributes } from "react";

const baseStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
  color: "#111",
  transition: "border-color 0.15s",
};

export function Input({ style, onFocus, onBlur, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{ ...baseStyle, ...style }}
      onFocus={(e) => {
        e.target.style.borderColor = "#2563eb";
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#d1d5db";
        onBlur?.(e);
      }}
      {...props}
    />
  );
}
