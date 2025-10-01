import styled from 'styled-components';

export const Button = styled.button`
  padding: var(--space-xs, 8px) var(--space-md, 12px);
  border-radius: var(--radius-sm, 6px);
  border: none;
  cursor: pointer;
  background: var(--color-primary, #6C2BB0);
  color: white;
  font-size: var(--font-size-base, 1rem);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export const SecondaryButton = styled(Button)`
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid rgba(0,0,0,0.08);
`;

export const InlineButton = styled.button`
  margin-left: var(--space-xs, 8px);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  font-size: var(--font-size-base);
`;

export const TopButton = styled(Button)`
  margin-bottom: var(--space-md, 16px);
`;

export const Input = styled.input`
  padding: var(--space-xs, 8px);
  font-size: var(--font-size-base, 1rem);
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: var(--radius-sm, 6px);
  background: var(--color-surface, #fff);
  color: var(--color-text-primary);
  &:focus { outline: 2px solid rgba(108,43,176,0.12); }
`;

// named exports are already declared above
