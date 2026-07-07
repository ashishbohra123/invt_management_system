import type { ReactNode } from "react";

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
  onRowClick?: (item: T) => void;
}

const thStyle: React.CSSProperties = {
  padding: "10px 16px", fontWeight: 600,
  borderBottom: "1px solid #E5E7EB",
  textAlign: "left", fontSize: 12,
  color: "#6B7280", textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const tdStyle: React.CSSProperties = { padding: "12px 16px", fontSize: 14, color: "#374151" };
const wrapperStyle: React.CSSProperties = {
  overflowX: "auto",
};

export function DataTable<T>({
  columns, data, loading, error,
  emptyMessage = "No data found.", keyExtractor, onRowClick,
}: DataTableProps<T>) {
  if (loading) return <p style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>Loading...</p>;
  if (error) return <p style={{ color: "#DC2626", padding: 16 }}>{error}</p>;

  return (
    <div style={wrapperStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F9FAFB", textAlign: "left" }}>
            {columns.map((col) => (
              <th key={col.key} style={{ ...thStyle, ...col.style }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              style={{
                borderBottom: "1px solid #E5E7EB",
                cursor: onRowClick ? "pointer" : undefined,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
              onMouseLeave={(e) => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = ""; }}
              onClick={() => onRowClick?.(item)}
            >
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
