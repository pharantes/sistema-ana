"use client";
import * as FE from "../FormElements";
import { getStatusColors } from "./statusColors";

export default function StatusSelect({
  value,
  options = [],
  onChange,
  style,
  disabled,
  ...rest
}) {
  const key = String(value || '').toUpperCase();
  const c = getStatusColors(key);
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
