import styled from 'styled-components';
import { CSSProperties, ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  isWarning?: boolean;
}

export const Card = ({ isWarning, style, ...props }: CardProps) => {
  const combinedStyle: CSSProperties = isWarning
    ? { ...style, border: '1px solid rgba(124, 58, 237, 0.4)' }
    : { ...style };
  return <GlassCard style={combinedStyle} {...props} />;
};

export const CardBody = ({ style, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div style={{ padding: '24px', ...style }} {...props} />
);

export const CardHeader = ({ style, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div style={{ padding: '24px', borderBottom: '1px solid var(--border-card-header)', ...style }} {...props} />
);

const GlassCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--box-shadow-card);
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.25s ease;
  overflow: hidden;

  /* backdrop-filter only in dark mode where glass effect adds value */
  [data-theme="dark"] & {
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }

  &:hover {
    border-color: rgba(124, 58, 237, 0.3);
    box-shadow: var(--box-shadow-card-hover);
  }
`;
