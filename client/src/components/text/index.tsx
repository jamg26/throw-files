import { CSSProperties, ReactNode, HTMLAttributes } from 'react';

interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  small?: boolean;
  bold?: boolean;
  strong?: boolean;
  color?: string;
  fontSize?: string;
  mb?: string;
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  children?: ReactNode;
}

export const Text = ({
  small, bold, strong, color, fontSize, mb, type, children, style, ...props
}: TextProps) => {
  const s: CSSProperties = { color: 'var(--text)', fontFamily: 'Inter, sans-serif', ...style };

  if (small) s.fontSize = '12px';
  if (fontSize) s.fontSize = fontSize;
  if (mb) s.marginBottom = mb;
  if (bold || strong) s.fontWeight = 600;

  if (color === 'textSubtle' || color === 'secondary' || color === 'textDisabled') {
    s.color = 'var(--text-muted)';
  } else if (color) {
    s.color = color;
  }

  if (type === 'secondary') s.color = 'var(--text-muted)';
  if (type === 'success')   s.color = '#22C55E';
  if (type === 'warning')   s.color = '#F59E0B';
  if (type === 'danger')    s.color = '#F43F5E';

  return <span style={s} {...props}>{children}</span>;
};
