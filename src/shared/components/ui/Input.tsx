import React, { type InputHTMLAttributes } from "react";

const baseStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
  color: "#111",
  fontFamily: "inherit",
  background: "#fff",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export function Input({ style, onFocus, onBlur, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{ ...baseStyle, ...style }}
      onFocus={(e) => {
        e.target.style.borderColor = "#2563EB";
        e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#D1D5DB";
        e.target.style.boxShadow = "none";
        onBlur?.(e);
      }}
      {...props}
    />
  );
}
