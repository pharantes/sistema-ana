import styled, { css } from 'styled-components';

export const inputCss = css`
  height: 36px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  background: #fff;
  color: #111827;
  font-size: 0.95rem;
  line-height: 1.2;
  transition: border-color 120ms ease;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,.12); }
`;

export const buttonCss = css`
  height: 36px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const Button = styled.button`
  ${buttonCss}
  background: #2563eb; color: #fff;
  &:hover { background: #1e4ed8; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

export const SecondaryButton = styled.button`
  ${buttonCss}
  background: #f3f4f6; color: #111827; border-color: #e5e7eb;
  &:hover { background: #e5e7eb; }
`;

export const DangerButton = styled.button`
  ${buttonCss}
  background: #ef4444; color: #fff;
  &:hover { background: #dc2626; }
`;

export const Input = styled.input`
  ${inputCss}
`;

export const Select = styled.select`
  ${inputCss}
`;

export const SearchBar = styled.input`
  ${inputCss}
  width: 100%;
`;

export const DateInput = styled.input.attrs({ type: 'date' })`
  ${inputCss}
`;

export const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

export const PresetButton = styled.button`
  ${buttonCss}
  background: #fff; border-color: #d1d5db; color: #111827;
  &:hover { background: #f9fafb; }
  &[aria-pressed="true"] {
    background: #2563eb; color: #fff; border-color: #2563eb;
  }
`;
