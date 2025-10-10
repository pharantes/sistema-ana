"use client";
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: var(--color-surface, white);
  color: var(--color-text-primary, black);
  padding: var(--space-md, 20px);
  min-width: 420px;
  max-height: 90vh;
  overflow: auto;

  input, select, textarea {
    width: 100%;
    padding: var(--space-sm, 8px) var(--space-md, 10px);
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: var(--radius-sm, 4px);
    background: var(--color-surface, #fff);
    color: var(--color-text-primary, #111);
    font-size: var(--font-size-base, 14px);
    box-sizing: border-box;
    margin-bottom: var(--space-xs, 6px);
  }

  input[readonly] {
    background: var(--color-muted-surface, #f5f5f5);
  }

  label {
    display: block;
    margin-bottom: var(--space-xs, 6px);
    font-size: var(--font-size-sm, 12px);
    color: var(--color-text-muted, #333);
  }

  button {
    padding: var(--space-sm, 8px) var(--space-md, 12px);
    border-radius: var(--radius-sm, 4px);
    border: 1px solid transparent;
    background: var(--color-primary, #1976d2);
    color: var(--color-surface, white);
    cursor: pointer;
  }

  button[type="button"] {
    background: var(--color-muted-surface, #ccc);
    color: var(--color-text-primary, #111);
  }
`;

export default function Modal({ children, onClose, ariaLabel }) {
  return (
    <ModalOverlay role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <ModalContent role="dialog" aria-label={ariaLabel || 'Modal'}>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
}
