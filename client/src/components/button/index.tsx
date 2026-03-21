import styled, { css, keyframes } from 'styled-components';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'text' | 'tertiary' | 'success';
  size?: 'small' | 'middle' | 'large';
  scale?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export const Button = ({
  variant = 'secondary',
  size,
  scale,
  loading,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const sz = scale === 'sm' ? 'small' : (size || 'middle');
  return (
    <Btn $variant={variant} $size={sz} $loading={!!loading} disabled={disabled || loading} {...props}>
      {loading ? <Spin /> : icon ? <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span> : null}
      {children}
    </Btn>
  );
};

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spin = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  flex-shrink: 0;
`;

type Size = 'small' | 'middle' | 'large';
type Variant = ButtonProps['variant'];

const sizeStyles: Record<Size, ReturnType<typeof css>> = {
  small:  css`padding: 4px 10px; font-size: 12px; height: 28px; border-radius: 7px;`,
  middle: css`padding: 7px 16px; font-size: 14px; height: 36px; border-radius: 10px;`,
  large:  css`padding: 10px 22px; font-size: 15px; height: 44px; border-radius: 11px;`,
};

const variantStyles: Record<NonNullable<Variant>, ReturnType<typeof css>> = {
  primary: css`
    background: linear-gradient(135deg, #7C3AED 0%, #F43F5E 100%);
    color: #fff;
    border: none;
    box-shadow: 0 4px 14px rgba(124,58,237,0.35);
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #8B5CF6 0%, #FB7185 100%);
      box-shadow: 0 6px 20px rgba(124,58,237,0.5);
      transform: translateY(-1px);
    }
    &:active:not(:disabled) { transform: translateY(0); }
  `,
  secondary: css`
    background: rgba(255,255,255,0.05);
    color: #E2E8F0;
    border: 1px solid rgba(255,255,255,0.11);
    &:hover:not(:disabled) {
      background: rgba(255,255,255,0.09);
      border-color: rgba(124,58,237,0.4);
      transform: translateY(-1px);
    }
  `,
  danger: css`
    background: linear-gradient(135deg, #dc2626 0%, #F43F5E 100%);
    color: #fff;
    border: none;
    box-shadow: 0 4px 14px rgba(244,63,94,0.3);
    &:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
  `,
  text: css`
    background: transparent;
    color: rgba(255,255,255,0.6);
    border: none;
    padding-left: 4px;
    padding-right: 4px;
    &:hover:not(:disabled) {
      color: #E2E8F0;
      background: rgba(255,255,255,0.07);
    }
  `,
  tertiary: css`
    background: transparent;
    color: #A78BFA;
    border: 1px dashed rgba(124,58,237,0.35);
    &:hover:not(:disabled) {
      background: rgba(124,58,237,0.08);
      border-color: rgba(124,58,237,0.6);
    }
  `,
  success: css`
    background: linear-gradient(135deg, #16a34a 0%, #22C55E 100%);
    color: #fff;
    border: none;
    box-shadow: 0 4px 14px rgba(34,197,94,0.3);
    &:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
  `,
};

const Btn = styled.button<{ $variant: NonNullable<Variant>; $size: Size; $loading: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  outline: none;
  box-sizing: border-box;

  ${p => sizeStyles[p.$size]}
  ${p => variantStyles[p.$variant]}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
  }

  ${p => p.$loading && css`cursor: wait; opacity: 0.7;`}
`;
