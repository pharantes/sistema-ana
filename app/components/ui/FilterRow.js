/**
 * @fileoverview Filter row component for consistent filter layouts.
 */

"use client";
import styled from 'styled-components';
import { RowWrap } from './primitives';

/**
 * Styled field container for filter inputs.
 */
export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;

/**
 * Filter row container component with responsive wrapping.
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to render
 * @param {string} [props.className] - Additional CSS class name
 * @returns {React.Element} Wrapped filter row
 */
export default function FilterRow({ children, className, ...rest }) {
  return <RowWrap className={className} {...rest}>{children}</RowWrap>;
}
