export const STATUS_COLORS = {
  ABERTO: { bg: '#fee2e2', fg: '#991b1b' },
  PAGO: { bg: '#dcfce7', fg: '#166534' },
  RECEBIDO: { bg: '#dcfce7', fg: '#166534' },
  PENDENTE: { bg: '#fef3c7', fg: '#92400e' },
  DEFAULT: { bg: '#e5e7eb', fg: '#374151' },
};

export function getStatusColors(value) {
  const key = String(value || '').toUpperCase();
  return STATUS_COLORS[key] || STATUS_COLORS.DEFAULT;
}
