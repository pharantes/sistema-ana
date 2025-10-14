"use client";
import styled from 'styled-components';

const Wrap = styled.div`
  padding: var(--space-sm);
  background: #fee2e2;
  color: #b91c1c;
  border-radius: var(--radius-sm);
`;

export default function ErrorBanner({ children }) {
  if (!children) return null;
  return <Wrap>{children}</Wrap>;
}
