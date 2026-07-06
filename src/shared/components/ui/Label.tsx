import React, { type LabelHTMLAttributes } from "react";

export function Label({ style, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 13,
        marginBottom: 4,
        color: "#333",
        fontWeight: 500,
        ...style,
      }}
      {...props}
    />
  );
}
