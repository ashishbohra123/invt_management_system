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
}

const thStyle: React.CSSProperties = {
  padding: 12, fontWeight: 600,
  borderBottom: "2px solid #e0e0e0",
  textAlign: "left", fontSize: 13,
  color: "#555",
};
const tdStyle: React.CSSProperties = { padding: 12, fontSize: 14 };
const wrapperStyle: React.CSSProperties = {
  overflowX: "auto", borderRadius: 8,
  border: "1px solid #e0e0e0",
};

export function DataTable<T>({
  columns, data, loading, error,
  emptyMessage = "No data found.", keyExtractor,
}: DataTableProps<T>) {
  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={wrapperStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
            {columns.map((col) => (
              <th key={col.key} style={{ ...thStyle, ...col.style }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: 24, textAlign: "center", color: "#888" }}>
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map((item) => (
            <tr key={keyExtractor(item)} style={{ borderBottom: "1px solid #e0e0e0" }}>
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
