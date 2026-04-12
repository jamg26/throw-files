import { useState, useEffect, useCallback, ReactNode, memo } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  content: ReactNode;
  variant: ToastVariant;
}

type AddToastFn = (content: ReactNode, variant: ToastVariant) => void;

let _addToast: AddToastFn | null = null;

export const toast = {
  success: (content: ReactNode) => _addToast?.(content, 'success'),
  error:   (content: ReactNode) => _addToast?.(content, 'error'),
  info:    (content: ReactNode) => _addToast?.(content, 'info'),
  warning: (content: ReactNode) => _addToast?.(content, 'warning'),
};

export const ToastProvider = memo(({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast: AddToastFn = useCallback((content, variant) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, content, variant }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  return (
    <>
      {children}
      {ReactDOM.createPortal(
        <Container>
          {toasts.map(t => (
            <Bubble key={t.id} $v={t.variant}>
              <Dot $v={t.variant} />
              <span>{t.content}</span>
            </Bubble>
          ))}
        </Container>,
        document.body
      )}
    </>
  );
});

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const Container = styled.div`
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
  pointer-events: none;
  width: max-content;
  max-width: min(480px, calc(100vw - 40px));
`;

const variantColor: Record<ToastVariant, string> = {
  success: 'var(--success)',
  error:   'var(--danger)',
  info:    'var(--accent-primary)',
  warning: 'var(--warning)',
};

const Bubble = styled.div<{ $v: ToastVariant }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  border-left: 3px solid ${p => variantColor[p.$v]};
  border-radius: 10px;
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  box-shadow: var(--shadow-lg);
  animation: ${slideIn} 0.2s ease forwards;
`;

const Dot = styled.div<{ $v: ToastVariant }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${p => variantColor[p.$v]};
  flex-shrink: 0;
`;
