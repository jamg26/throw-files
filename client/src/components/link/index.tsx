import { AnchorHTMLAttributes, CSSProperties, ReactNode } from "react";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  small?: boolean;
  bold?: boolean;
  color?: string;
  fontSize?: string;
  children?: ReactNode;
  external?: boolean;
}

export const Link = ({
  small,
  bold,
  color,
  fontSize,
  children,
  style,
  external,
  ...props
}: LinkProps) => {
  const s: CSSProperties = {
    color: "var(--accent-primary)",
    textDecoration: "none",
    cursor: "pointer",
    transition: "color 0.2s ease",
    ...style,
  };

  if (small) s.fontSize = "12px";
  if (fontSize) s.fontSize = fontSize;
  if (bold) s.fontWeight = 600;
  if (color) s.color = color;

  const linkProps: AnchorHTMLAttributes<HTMLAnchorElement> = { ...props };
  if (external) {
    linkProps.rel = "noopener noreferrer";
    linkProps.target = "_blank";
  }

  return (
    <a style={s} {...linkProps}>
      {children}
    </a>
  );
};
