import styled from 'styled-components';
import { CSSProperties, ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  isWarning?: boolean;
}

export const Card = ({ isWarning, style, ...props }: CardProps) => {
  const combinedStyle: CSSProperties = isWarning
    ? { ...style, border: '1px solid rgba(99, 102, 241, 0.3)' }
    : { ...style };
  return <GlassCard style={combinedStyle} {...props} />;
};

export const CardBody = ({ style, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div style={{ padding: '28px', ...style }} {...props} />
);

export const CardHeader = ({ style, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border-subtle)', ...style }} {...props} />
);

const GlassCard = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    border-color: var(--border-medium);
    box-shadow: var(--shadow-lg), 0 0 60px rgba(99, 102, 241, 0.08);
    
    &::before {
      opacity: 1;
    }
  }
`;