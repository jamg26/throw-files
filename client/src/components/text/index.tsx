import { CSSProperties, ReactNode, HTMLAttributes } from "react";

interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  small?: boolean;
  bold?: boolean;
  strong?: boolean;
  color?: string;
  fontSize?: string;
  mb?: string;
  type?: "secondary" | "success" | "warning" | "danger";
  children?: ReactNode;
}

export const Text = ({
  small,
  bold,
  strong,
  color,
  fontSize,
  mb,
  type,
  children,
  style,
  ...props
}: TextProps) => {
  const s: CSSProperties = {
    color: "var(--text-primary)",
    fontFamily: "Inter, sans-serif",
    ...style,
  };

  if (small) s.fontSize = "12px";
  if (fontSize) s.fontSize = fontSize;
  if (mb) s.marginBottom = mb;
  if (bold || strong) s.fontWeight = 600;

  // Type prop takes precedence over color prop for consistency
  if (type === "secondary") {
    s.color = "var(--text-secondary)";
  } else if (type === "success") {
    s.color = "var(--success)";
  } else if (type === "warning") {
    s.color = "var(--warning)";
  } else if (type === "danger") {
    s.color = "var(--danger)";
  } else if (color === "secondary") {
    s.color = "var(--text-secondary)";
  } else if (color === "textDisabled") {
    s.color = "var(--text-muted)";
  } else if (color) {
    s.color = color;
  }

  return (
    <span style={s} {...props}>
      {children}
    </span>
  );
};
