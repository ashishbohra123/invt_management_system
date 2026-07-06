const wrapperStyle: React.CSSProperties = {
  marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  width: "100%", maxWidth: 400,
  padding: "10px 16px",
  borderRadius: 20,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  fontFamily: "inherit",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function SearchBar({ value, onChange, placeholder = "Search...", style }: SearchBarProps) {
  return (
    <div style={{ ...wrapperStyle, ...style }}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => {
          e.target.style.borderColor = "#2563EB";
          e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#D1D5DB";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}
