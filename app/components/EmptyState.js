"use client";
import styled from 'styled-components';

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-lg);
  text-align: center;
  min-height: ${props => props.$minHeight || '300px'};
  background: ${props => props.$background || '#f9fafb'};
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: var(--space-md);
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: var(--space-sm);
`;

const EmptyMessage = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: var(--space-lg);
  max-width: 400px;
`;

const EmptyAction = styled.div`
  margin-top: var(--space-sm);
`;

/**
 * Empty State Component
 * Displays when there's no data to show
 * 
 * @param {Object} props
 * @param {string} [props.icon] - Optional icon/emoji to display
 * @param {string} [props.title] - Title text
 * @param {string} [props.message] - Descriptive message
 * @param {React.ReactNode} [props.action] - Optional action button/link
 * @param {string} [props.minHeight] - Minimum height of the container
 * @param {string} [props.background] - Background color
 */
export default function EmptyState({
  icon = "📭",
  title = "Nenhum item encontrado",
  message = "Não há dados para exibir no momento.",
  action,
  minHeight,
  background
}) {
  return (
    <EmptyContainer $minHeight={minHeight} $background={background}>
      {icon && <EmptyIcon>{icon}</EmptyIcon>}
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyMessage>{message}</EmptyMessage>
      {action && <EmptyAction>{action}</EmptyAction>}
    </EmptyContainer>
  );
}
