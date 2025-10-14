/**
 * @fileoverview Status color mappings for UI consistency.
 * Defines background and foreground colors for different status values.
 */

/**
 * Color mappings for status values.
 * Each status has background (bg) and foreground (fg) color properties.
 * @type {Object<string, {bg: string, fg: string}>}
 */
export const STATUS_COLORS = {
  ABERTO: { bg: '#fee2e2', fg: '#991b1b' },
  PAGO: { bg: '#dcfce7', fg: '#166534' },
  RECEBIDO: { bg: '#dcfce7', fg: '#166534' },
  PENDENTE: { bg: '#fef3c7', fg: '#92400e' },
  DEFAULT: { bg: '#e5e7eb', fg: '#374151' },
};

/**
 * Gets color values for a status string.
 * @param {string} value - Status value (case-insensitive)
 * @returns {{bg: string, fg: string}} Background and foreground colors
 */
export function getStatusColors(value) {
  const key = String(value || '').toUpperCase();
  return STATUS_COLORS[key] || STATUS_COLORS.DEFAULT;
}
