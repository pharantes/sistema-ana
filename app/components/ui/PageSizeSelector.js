"use client";

export default function PageSizeSelector({
  pageSize,
  total,
  onChange,
  options = [10, 25, 50],
  label = "Mostrar:",
  style,
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', ...(style || {}) }}>
      <span style={{ fontSize: '0.9rem', color: '#555' }}>{label}</span>
      <select value={pageSize} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <span style={{ fontSize: '0.9rem', color: '#555' }}>Total: {total}</span>
    </div>
  );
}
