interface InputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const baseStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

export function Input({ value, onChange, placeholder, type = "text", style, ...rest }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...baseStyle, ...style }}
      onFocus={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#388e3c"; }}
      onBlur={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#ccc"; }}
      {...rest}
    />
  );
}
