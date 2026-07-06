import React, { type InputHTMLAttributes } from "react";

const baseStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

export function Input({ style, onFocus, onBlur, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{ ...baseStyle, ...style }}
      onFocus={(e) => {
        e.target.style.borderColor = "#388e3c";
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#ccc";
        onBlur?.(e);
      }}
      {...props}
    />
  );
}
