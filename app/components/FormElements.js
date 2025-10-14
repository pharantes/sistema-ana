import styled from 'styled-components';
import { ActionsInline } from './ui/primitives';

export const Button = styled.button`
  padding: var(--space-xs, var(--space-xs, var(--space-xs, 8px))) var(--space-md, var(--space-sm, var(--space-sm, 12px)));
  border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
  border: 1px solid transparent; /* keep same box model as secondary */
  box-sizing: border-box;
  cursor: pointer;
  background: var(--color-primary, #6C2BB0);
  color: white;
  font-size: var(--font-size-base, 1rem);
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export const SecondaryButton = styled(Button)`
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid rgba(0,0,0,0.08);
`;

export const InlineButton = styled.button`
  margin-left: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  font-size: var(--font-size-base);
`;

export const TopButton = styled(Button)`
  margin-bottom: var(--space-md, var(--space-md, var(--space-md, 16px)));
`;

export const TopSecondaryButton = styled(SecondaryButton)`
  margin-bottom: var(--space-md, var(--space-md, var(--space-md, 16px)));
`;

export const Input = styled.input`
  padding: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  font-size: var(--font-size-base, 1rem);
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
  background: var(--color-surface, #fff);
  color: var(--color-text-primary);
  &:focus { outline: 2px solid rgba(108,43,176,0.12); }
`;

export const Select = styled.select`
  padding: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  font-size: var(--font-size-base, 1rem);
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
  background: var(--color-surface, #fff);
  color: var(--color-text-primary);
  &:focus { outline: 2px solid rgba(108,43,176,0.12); }
`;

// Compact actions row to keep Editar/Excluir on one line
export const ActionsRow = ActionsInline;

// Compact button variants for Opções columns
export const SmallSecondaryButton = styled(SecondaryButton)`
  padding: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px))) var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  font-size: var(--font-size-sm, 0.9rem);
  height: calc(var(--control-height, 36px) - var(--space-xs, var(--space-xs, 8px)));
  line-height: 1;
`;

export const SmallInlineButton = styled(InlineButton)`
  margin-left: 0;
  font-size: var(--font-size-sm, 0.9rem);
  height: calc(var(--control-height, 36px) - var(--space-xs, var(--space-xs, 8px)));
  line-height: 1;
`;

// named exports are already declared above
