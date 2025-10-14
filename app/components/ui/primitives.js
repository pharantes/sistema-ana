import React from 'react';
import styled from 'styled-components';

// Small wrappers used across modals and filters to standardize spacing/sizes
export const InputWrap = styled.div`
  & > * { height: var(--control-height); width: 100%; box-sizing: border-box; }
`;

export const SmallInputWrap = styled.div`
  width: var(--small-input-width, 120px);
`;

export const RowInline = styled.div`
  display: flex;
  gap: var(--gap-xs);
  align-items: center;
`;

// Common single-property variants built from RowInline to avoid small file-local wrappers
export const RowWrap = styled(RowInline)`
  flex-wrap: wrap;
`;

export const RowTopGap = styled(RowInline)`
  margin-top: var(--space-xs);
`;

export const RowEnd = styled(RowInline)`
  justify-content: flex-end;
`;

export const RowGap6 = styled(RowInline)`
  gap: var(--gap-xs);
  align-items: flex-end;
`;

// small bottom gap variant used by some cards/headers
export const RowBottomGap = styled(RowInline)`
  margin-bottom: var(--space-xs);
`;

// common variant used across detail pages to size inline action buttons
export const ActionsInline = styled(RowInline)`
  & > * { height: var(--control-height); }
`;

export const GridTwoGap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-sm);
`;

export const Note = styled.span`
  color: #666;
  font-size: 0.85rem;
  margin-top: var(--space-xxs);
`;

export const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-xs);
  font-size: 0.88rem;
`;

export const PresetButton = styled.button`
  padding: var(--space-xs) var(--space-md);
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: var(--radius-sm);
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-primary, #222);
  &:hover { background: #f7f7f7; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &[aria-pressed="true"] {
    background: var(--color-primary, #6C2BB0);
    color: #fff;
    border-color: var(--color-primary, #6C2BB0);
  }
`;

// Minimal loading placeholder (compact)
export const LoadingRoot = styled.div`
  display: flex;
  gap: var(--gap-sm);
  align-items: center;
  color: var(--color-text-muted, #666);
  font-size: 0.95rem;
`;

export const LoadingDot = styled.span`
  width: var(--loading-dot-size, 10px);
  height: var(--loading-dot-size, 10px);
  border-radius: 50%;
  background: var(--color-primary, #6C2BB0);
  animation: loading-anim 1s linear infinite;
  @keyframes loading-anim {
    0% { transform: translateY(0); opacity: 0.9; }
    50% { transform: translateY(-var(--loading-jump, var(--space-xxs, var(--space-xxs, 4px)))); opacity: 0.5; }
    100% { transform: translateY(0); opacity: 0.9; }
  }
`;

export const VisuallyHidden = styled.span`
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export function Loading({ children = 'Carregando…' }) {
  // include accessible status role and visually-hidden label
  return React.createElement(
    LoadingRoot,
    { role: 'status', 'aria-live': 'polite' },
    React.createElement(LoadingDot, { 'aria-hidden': 'true' }),
    React.createElement('span', null, children),
    React.createElement(VisuallyHidden, null, children)
  );
}
