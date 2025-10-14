/**
 * Reusable chart container component
 */
"use client";
import styled from 'styled-components';

const ChartContainer = styled.div`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: var(--radius-sm, 6px);
  padding: var(--space-md, 16px);
  height: ${props => props.$height || '400px'};
  display: flex;
  flex-direction: column;
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 var(--space-sm, 12px) 0;
  color: #333;
`;

const ChartContent = styled.div`
  flex: 1;
  min-height: 0; /* Important for flexbox child with height */
  position: relative;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 0.95rem;
`;

/**
 * Chart wrapper component with title and empty state
 * @param {Object} props - Component props
 * @param {string} props.title - Chart title
 * @param {React.ReactNode} props.children - Chart component
 * @param {string} props.height - Container height (CSS value)
 * @param {boolean} props.isEmpty - Whether to show empty state
 * @param {string} props.emptyMessage - Message to show when empty
 */
export default function ChartWrapper({
  title,
  children,
  height,
  isEmpty = false,
  emptyMessage = "Nenhum dado disponível"
}) {
  return (
    <ChartContainer $height={height}>
      {title && <ChartTitle>{title}</ChartTitle>}
      <ChartContent>
        {isEmpty ? (
          <EmptyState>{emptyMessage}</EmptyState>
        ) : (
          children
        )}
      </ChartContent>
    </ChartContainer>
  );
}
