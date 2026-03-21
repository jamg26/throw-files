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
  <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', ...style }} {...props} />
);

const GlassCard = styled.div`
  background: rgba(18, 18, 40, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 24px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.55);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: rgba(124, 58, 237, 0.25);
    box-shadow: 0 8px 40px rgba(0,0,0,0.55), 0 0 24px rgba(124,58,237,0.08);
  }
`;
