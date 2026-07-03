import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 8,
  border: "1px solid #e0e0e0",
  overflow: "hidden",
};

export function Card({ children, style }: CardProps) {
  return <div style={{ ...cardStyle, ...style }}>{children}</div>;
}

export function CardHeader({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid #e0e0e0", background: "#fafafa" }}>
      {children}
    </div>
  );
}

export function CardContent({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ padding: 20, ...style }}>{children}</div>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: "12px 20px", borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "flex-end", gap: 8 }}>
      {children}
    </div>
  );
}
