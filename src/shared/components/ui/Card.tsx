import React, { type ReactNode, type MouseEvent } from "react";

interface CardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLDivElement>) => void;
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  overflow: "hidden",
};

export function Card({ children, style, onClick, onMouseEnter, onMouseLeave }: CardProps) {
  return <div style={{ ...cardStyle, ...style }} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{children}</div>;
}

export function CardContent({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ padding: 20, ...style }}>{children}</div>;
}
