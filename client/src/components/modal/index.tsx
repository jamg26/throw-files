import { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
}

export const Modal = ({ visible, onClose, title, children, footer, width = 520 }: ModalProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (visible) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return ReactDOM.createPortal(
    <Overlay onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <Box style={{ maxWidth: width, width: '100%' }}>
        {title !== undefined && (
          <Header>
            <Title>{title}</Title>
            <CloseBtn onClick={onClose} aria-label="Close">
              <X size={18} />
            </CloseBtn>
          </Header>
        )}
        <Body $hasHeader={title !== undefined} $hasFooter={!!footer}>
          {children}
        </Body>
        {footer && <Footer>{footer}</Footer>}
      </Box>
    </Overlay>,
    document.body
  );
};

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: ${fadeIn} 0.15s ease;
`;

const Box = styled.div`
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  box-shadow: var(--shadow-lg), 0 0 80px rgba(99, 102, 241, 0.05);
  overflow: hidden;
  animation: ${scaleIn} 0.2s cubic-bezier(0.4, 0, 0.2, 1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle);
`;

const Title = styled.div`
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseBtn = styled.button`
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  
  &:hover {
    background: var(--bg-glass-hover);
    color: var(--text-primary);
    border-color: var(--border-medium);
  }
`;

const Body = styled.div<{ $hasHeader: boolean; $hasFooter: boolean }>`
  padding: 24px;
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);