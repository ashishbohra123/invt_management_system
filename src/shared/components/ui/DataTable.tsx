import type { ReactNode } from "react";
import { Badge } from "./Badge.js";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  style?: React.CSSProperties;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px", fontWeight: 600,
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left", fontSize: 13,
  color: "#374151", background: "#f9fafb",
  textTransform: "uppercase", letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 16px", fontSize: 14,
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
};
const wrapperStyle: React.CSSProperties = {
  overflowX: "auto", borderRadius: 8,
  border: "1px solid #e5e7eb", background: "#fff",
};

export function DataTable<T>({
  columns, data, loading, error,
  emptyMessage = "No data found.", keyExtractor,
}: DataTableProps<T>) {
  if (loading) return <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>;
  if (error) return <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>;

  return (
    <div style={wrapperStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ ...thStyle, ...col.style }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((col) => (
                <td key={col.key} style={{ ...tdStyle, ...col.style }}>
                  {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
