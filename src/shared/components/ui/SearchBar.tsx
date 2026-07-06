const wrapperStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 14px 10px 36px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 14,
  outline: "none",
  width: 320,
  boxSizing: "border-box",
  color: "#111",
  transition: "border-color 0.15s",
};

const iconStyle: React.CSSProperties = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
  fontSize: 14,
  pointerEvents: "none",
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
      <span style={iconStyle}>&#128269;</span>
      <input
        type="text"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#2563eb"; }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#d1d5db"; }}
      />
    </div>
  );
}
