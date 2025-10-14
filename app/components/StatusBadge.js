/**
 * Reusable status badge component
 */
"use client";
import styled from 'styled-components';

const Badge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    const status = String(props.$status || '').toUpperCase();

    switch (status) {
      case 'ABERTO':
      case 'PENDENTE':
      case 'PENDING':
        return `
          background: #FEF3C7;
          color: #92400E;
        `;

      case 'PAGO':
      case 'RECEBIDO':
      case 'PAID':
      case 'RECEIVED':
      case 'COMPLETED':
        return `
          background: #D1FAE5;
          color: #065F46;
        `;

      case 'VENCIDO':
      case 'OVERDUE':
      case 'ATRASADO':
        return `
          background: #FEE2E2;
          color: #991B1B;
        `;

      case 'CANCELADO':
      case 'CANCELLED':
        return `
          background: #F3F4F6;
          color: #6B7280;
        `;

      default:
        return `
          background: #E5E7EB;
          color: #374151;
        `;
    }
  }}
`;

/**
 * Status badge component with predefined color schemes
 * @param {Object} props - Component props
 * @param {string} props.status - Status value (ABERTO, PAGO, RECEBIDO, etc.)
 * @param {string} props.label - Optional custom label (uses status if not provided)
 */
export default function StatusBadge({ status, label }) {
  const displayLabel = label || status || 'N/A';

  return (
    <Badge $status={status}>
      {displayLabel}
    </Badge>
  );
}
