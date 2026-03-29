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
            <CloseBtn onClick={onClose} aria-label="Close">✕</CloseBtn>
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
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
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
  background: var(--bg-overlay);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: ${fadeIn} 0.15s ease;
`;

const Box = styled.div`
  background: var(--bg-modal);
  border: 1px solid var(--border-modal);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: ${scaleIn} 0.18s ease;
  transition: background 0.25s ease;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--modal-header-border);
`;

const Title = styled.div`
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 18px;
  line-height: 1;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s ease;
  &:hover { color: var(--text); background: var(--bg-interactive); }
`;

const Body = styled.div<{ $hasHeader: boolean; $hasFooter: boolean }>`
  padding: 24px;
  color: var(--text);
  font-family: 'Inter', sans-serif;
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid var(--modal-footer-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;
