"use client";
import { getStatusColors } from "./statusColors";

export default function StatusBadge({ value, style }) {
  const key = String(value || '').toUpperCase();
  const c = getStatusColors(key);
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
