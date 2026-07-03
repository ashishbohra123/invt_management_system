const wrapperStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px 8px 32px",
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const iconStyle: React.CSSProperties = {
  position: "absolute",
  left: 10,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#999",
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
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#388e3c"; }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#ccc"; }}
      />
    </div>
  );
}
