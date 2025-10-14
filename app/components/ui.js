/**
 * @fileoverview Common UI component styles and CSS utilities.
 * Provides base styled-components and CSS mixins for the application.
 */

import styled, { css } from 'styled-components';

/**
 * Shared CSS for input elements.
 */
export const inputCss = css`
  height: var(--control-height);
  padding: var(--space-xs) var(--space-md);
  border: 1px solid #d1d5db;
  border-radius: var(--radius-sm);
  outline: none;
  background: #fff;
  color: #111827;
  font-size: 0.95rem;
  line-height: 1.2;
  transition: border-color 120ms ease;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,.12); }
`;

export const buttonCss = css`
  height: var(--control-height);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.92rem;
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
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
  gap: var(--gap-xs);
  align-items: center;
  flex-wrap: wrap;
`;

// Re-export the PresetButton from the centralized primitives so callers
// importing from `components/ui` keep working while the implementation
// lives in `components/ui/primitives.js`.
export { PresetButton } from "./ui/primitives";

// NOTE: PresetButton is also provided in `./ui/primitives.js` to centralize
// small, reusable UI tokens used across filters and modals. Prefer using
// `import { PresetButton } from './ui/primitives'` instead of this local copy.
