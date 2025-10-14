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
  padding: var(--space-lg, var(--space-md, var(--space-md, 16px)));
  min-width: var(--modal-min-width, 420px);
  max-height: 90vh;
  overflow: auto;

    input, select, textarea {
    width: 100%;
    padding: var(--space-xs, var(--space-xs, var(--space-xs, 8px))) var(--space-md, var(--space-md, var(--space-md, 16px)));
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
    background: var(--color-surface, #fff);
    color: var(--color-text-primary, #111);
    font-size: var(--font-size-base, 1rem);
    box-sizing: border-box;
    margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
  }

  input[readonly] {
    background: var(--color-muted-surface, #f5f5f5);
  }

  label {
    display: block;
    margin-bottom: var(--space-xs, var(--gap-xs, var(--gap-xs, 6px)));
    font-size: var(--font-size-sm, 0.85rem);
    color: var(--color-text-muted, #333);
  }

    button {
    padding: var(--space-sm, var(--space-sm, var(--space-sm, 12px))) var(--space-md, var(--space-md, var(--space-md, 16px)));
    border-radius: var(--radius-sm, var(--gap-xs, var(--gap-xs, 6px)));
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

/**
 * Modal - Reusable modal overlay with backdrop click-to-close functionality
 */
export default function Modal({ children, onClose, ariaLabel }) {
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <ModalOverlay role="presentation" onMouseDown={handleBackdropClick}>
      <ModalContent role="dialog" aria-label={ariaLabel || 'Modal'}>
        {children}
      </ModalContent>
    </ModalOverlay>
  );
}
