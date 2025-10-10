"use client";
import * as FE from "../FormElements";

export default function StatusSelect({
  value,
  options = [],
  onChange,
  style,
  disabled,
  ...rest
}) {
  const COLORS = {
    ABERTO: { bg: '#fee2e2', fg: '#991b1b' },
    PAGO: { bg: '#dcfce7', fg: '#166534' },
    RECEBIDO: { bg: '#dcfce7', fg: '#166534' },
    PENDENTE: { bg: '#fef3c7', fg: '#92400e' },
    DEFAULT: { bg: '#e5e7eb', fg: '#374151' },
  };
  const key = String(value || '').toUpperCase();
  const c = COLORS[key] || COLORS.DEFAULT;
  const colorStyle = {
    background: c.bg,
    color: c.fg,
    borderColor: 'rgba(0,0,0,0.05)'
  };
  return (
    <FE.Select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ ...colorStyle, ...style }}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </FE.Select>
  );
}
