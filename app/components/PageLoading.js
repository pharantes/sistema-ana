"use client";
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: ${props => props.$minHeight || '300px'};
  padding: var(--space-lg);
`;

const Spinner = styled.div`
  width: ${props => props.$size || '48px'};
  height: ${props => props.$size || '48px'};
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingText = styled.p`
  margin-top: var(--space-md);
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
`;

/**
 * Page Loading Component
 * Shows a centered loading spinner with optional text
 * 
 * @param {Object} props
 * @param {string} [props.text] - Optional loading text to display
 * @param {string} [props.minHeight] - Minimum height of the container
 * @param {string} [props.size] - Size of the spinner
 */
export default function PageLoading({ text = "Carregando...", minHeight, size }) {
  return (
    <LoadingContainer $minHeight={minHeight}>
      <Spinner $size={size} />
      {text && <LoadingText>{text}</LoadingText>}
    </LoadingContainer>
  );
}
