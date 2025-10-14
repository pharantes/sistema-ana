/**
 * @fileoverview Form layout components for consistent form styling.
 * Provides containers, labels, and layout utilities for forms and dropdowns.
 */

import styled from 'styled-components';
import { Note as PrimitiveNote } from './ui/primitives';

/**
 * Form label with consistent styling.
 */
export const Label = styled.label`
  font-weight: 600;
  display: block;
  margin-bottom: var(--space-xs, var(--gap-xs, var(--gap-xs, 6px)));
`;

export const FormRow = styled.div`
  display: flex;
  gap: var(--space-sm, var(--space-xs, var(--space-xs, 8px)));
  align-items: center;
`;

export const FormGrid = styled.div`
  display: grid;
  gap: var(--space-md, 10px);
`;

// Reuse shared primitives Note but preserve the small API used across the app
export const Note = styled(PrimitiveNote).attrs(() => ({ as: 'p' }))`
  margin: 0 0 var(--space-sm, var(--space-xs, var(--space-xs, 8px))) 0;
  color: ${p => (p.$error ? 'red' : undefined)};
  font-style: ${p => (p.$italic ? 'italic' : undefined)};
`;

export const Actions = styled.div`
  display: flex;
  gap: var(--space-sm, var(--space-xs, var(--space-xs, 8px)));
  justify-content: flex-end;
  margin-top: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
`;

export const DropdownWrapper = styled.div`
  position: relative;
`;

export const DropdownButton = styled.button`
  width: 100%;
  text-align: left;
  padding: var(--space-sm, var(--space-xs, var(--space-xs, 8px))) var(--space-md, 10px);
  background: var(--color-surface, #fff);
  border: 1px solid #ccc;
  border-radius: var(--radius-md, var(--gap-xs, var(--gap-xs, 6px)));
  cursor: pointer;
`;

export const DropdownPanel = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + var(--space-xs, var(--gap-xs, var(--gap-xs, 6px))));
  background: var(--color-surface, #fff);
  border: 1px solid #ccc;
  z-index: 50;
  max-height: 240px;
  overflow: auto;
  padding: var(--space-sm, var(--space-xs, var(--space-xs, 8px)));
  border-radius: var(--radius-md, var(--gap-xs, var(--gap-xs, 6px)));
  box-shadow: 0 var(--space-xs, var(--space-xs, var(--space-xs, 8px))) 20px rgba(0,0,0,0.08);
`;

export const DropdownInput = styled.input`
  margin-bottom: var(--space-sm, var(--space-xs, var(--space-xs, 8px)));
  width: 100%;
  padding: var(--space-xs, var(--gap-xs, var(--gap-xs, 6px)));
  border: 1px solid #ddd;
  border-radius: var(--radius-sm, var(--space-xxs, var(--space-xxs, 4px)));
`;

export const OptionItem = styled.div`
  padding: var(--space-xs, var(--gap-xs, var(--gap-xs, 6px))) var(--space-sm, var(--space-xs, var(--space-xs, 8px)));
  cursor: pointer;
  background: ${p => (p.$highlight ? 'var(--color-accent, #eef)' : 'transparent')};
`;

export const EmptyMessage = styled(PrimitiveNote)`
  display: block;
  padding: var(--space-sm, var(--space-xs, var(--space-xs, 8px)));
  color: var(--color-text-muted, #666);
`;

// Named exports are declared above using `export const ...` so no additional export block is needed here.
