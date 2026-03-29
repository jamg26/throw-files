import styled from 'styled-components';
import { InputHTMLAttributes } from 'react';

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <StyledInput {...props} />
);

const StyledInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  color: var(--text);
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  padding: 0 14px;
  height: 40px;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: var(--text-placeholder);
  }

  &:hover {
    border-color: var(--border-input-hover);
    background: var(--bg-input-hover);
  }

  &:focus {
    border-color: var(--border-input-focus);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
    background: var(--bg-input-hover);
  }
`;
