/**
 * KPI Card component for dashboard metrics
 */
"use client";
import styled from 'styled-components';

const CardContainer = styled.div`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: var(--radius-sm, 6px);
  padding: var(--space-sm, 12px) var(--space-md, 16px);
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs, 6px);
  min-height: 90px;
  transition: box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const CardLabel = styled.div`
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CardValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${props => props.$color || '#111'};
  line-height: 1.2;
`;

const CardSubtext = styled.div`
  font-size: 0.8rem;
  color: #888;
  margin-top: auto;
`;

/**
 * KPI Card component for displaying dashboard metrics
 * @param {Object} props - Component props
 * @param {string} props.label - Card label/title
 * @param {string|number|React.ReactNode} props.value - Main value to display
 * @param {string} props.subtext - Optional subtext/description
 * @param {string} props.color - Optional color for value text
 * @param {Function} props.onClick - Optional click handler
 */
export default function KPICard({ label, value, subtext, color, onClick }) {
  return (
    <CardContainer
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <CardLabel>{label}</CardLabel>
      <CardValue $color={color}>{value}</CardValue>
      {subtext && <CardSubtext>{subtext}</CardSubtext>}
    </CardContainer>
  );
}
