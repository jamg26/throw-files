import { ReactNode } from "react";
import styled from "styled-components";

interface TooltipProps {
  title: ReactNode;
  children: ReactNode;
}

export const Tooltip = ({ title, children }: TooltipProps) => {
  if (title === undefined || title === null || title === "")
    return <>{children}</>;
  return (
    <Wrapper>
      {children}
      <Tip role="tooltip" aria-hidden="true">
        {title}
      </Tip>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;

  &:hover > span:last-child,
  &:focus-within > span:last-child {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
  }
`;

const Tip = styled.span`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(0);
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  color: var(--text-primary);
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 1.5;
  padding: 7px 10px;
  border-radius: 8px;
  white-space: pre-wrap;
  max-width: 260px;
  text-align: center;
  z-index: 500;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease,
    visibility 0.15s ease;
  box-shadow: var(--shadow-lg);

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--bg-elevated);
  }
`;
