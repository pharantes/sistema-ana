"use client";

const COLORS = {
  ABERTO: { bg: '#fee2e2', fg: '#991b1b' },
  PAGO: { bg: '#dcfce7', fg: '#166534' },
  RECEBIDO: { bg: '#dcfce7', fg: '#166534' },
  PENDENTE: { bg: '#fef3c7', fg: '#92400e' },
  DEFAULT: { bg: '#e5e7eb', fg: '#374151' },
};

export default function StatusBadge({ value, style }) {
  const key = String(value || '').toUpperCase();
  const c = COLORS[key] || COLORS.DEFAULT;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '0.75rem',
      padding: '2px 8px',
      borderRadius: 999,
      background: c.bg,
      color: c.fg,
      border: '1px solid rgba(0,0,0,0.05)',
      ...style,
    }}>
      {key || '-'}
    </span>
  );
}
