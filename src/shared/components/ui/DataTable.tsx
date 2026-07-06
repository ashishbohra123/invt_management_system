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
  footer?: ReactNode;
}

const tableWrap: React.CSSProperties = {
  background: "#fff", border: "1px solid #E5E7EB",
  borderRadius: 8, overflow: "hidden",
};
const thStyle: React.CSSProperties = {
  padding: "14px 16px", fontWeight: 600,
  borderBottom: "1px solid #F3F4F6",
  textAlign: "left", fontSize: 11,
  color: "#374151", background: "#F9FAFB",
  textTransform: "uppercase", letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "14px 16px", fontSize: 14,
  borderBottom: "1px solid #F3F4F6",
  color: "#374151",
};

export function DataTable<T>({
  columns, data, loading, error,
  emptyMessage = "No data found.", keyExtractor, footer,
}: DataTableProps<T>) {
  if (loading) return <p style={{ color: "#6B7280", fontSize: 14 }}>Loading...</p>;
  if (error) return <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>;

  return (
    <div style={tableWrap}>
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
              <td colSpan={columns.length} style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((item) => (
            <tr key={keyExtractor(item)} style={{ transition: "background 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
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
      {footer && <div>{footer}</div>}
    </div>
  );
}
