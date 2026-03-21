import styled from 'styled-components';
import { InputHTMLAttributes } from 'react';

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <StyledInput {...props} />
);

const StyledInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: #E2E8F0;
  border-radius: 12px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  padding: 0 14px;
  height: 40px;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.28);
  }

  &:hover {
    border-color: rgba(124, 58, 237, 0.4);
    background: rgba(255, 255, 255, 0.06);
  }

  &:focus {
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
    background: rgba(255, 255, 255, 0.06);
  }
`;
