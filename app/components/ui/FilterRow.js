"use client";
import styled from 'styled-components';
import { RowWrap } from './primitives';

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;

export default function FilterRow({ children, className, ...rest }) {
  return <RowWrap className={className} {...rest}>{children}</RowWrap>;
}
