"use client";
import styled from 'styled-components';
import Modal from './Modal';
import * as FE from './FormElements';

const ErrorIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-md, 16px);
  border-radius: 50%;
  background: #fee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d32f2f;
  font-size: 24px;
  font-weight: bold;
`;

const ErrorTitle = styled.h3`
  margin: 0 0 var(--space-sm, 12px);
  text-align: center;
  color: var(--color-text-primary, #111);
  font-size: var(--font-size-lg, 1.125rem);
`;

const ErrorMessage = styled.p`
  margin: 0 0 var(--space-lg, 24px);
  text-align: center;
  color: var(--color-text-muted, #666);
  font-size: var(--font-size-base, 1rem);
  line-height: 1.5;
  white-space: pre-line;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--space-sm, 12px);
`;

/**
 * ErrorModal - A reusable modal component for displaying errors
 * 
 * @param {boolean} open - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Error title (default: "Erro")
 * @param {string} message - Error message to display
 */
export default function ErrorModal({ open, onClose, title = "Erro", message }) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <ErrorIcon>!</ErrorIcon>
      <ErrorTitle>{title}</ErrorTitle>
      <ErrorMessage>{message}</ErrorMessage>
      <ButtonContainer>
        <FE.Button type="button" onClick={onClose}>
          OK, Entendi
        </FE.Button>
      </ButtonContainer>
    </Modal>
  );
}
