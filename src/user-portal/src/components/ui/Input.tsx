interface InputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const baseStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
  color: "#111111",
};

export function Input({ value, onChange, placeholder, type = "text", style, ...rest }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...baseStyle, ...style }}
      onFocus={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#2563EB"; }}
      onBlur={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#D1D5DB"; }}
      {...rest}
    />
  );
}
