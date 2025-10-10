"use client";
/* eslint-env browser */

export default function Filters({ query, onChangeQuery, onGerarPDF, loading }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <input
        value={query}
        onChange={(e) => onChangeQuery(e.target.value)}
        placeholder="Buscar por cliente ou ação..."
        style={{ padding: 8, minWidth: 280 }}
      />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button onClick={onGerarPDF} disabled={loading}>Gerar PDF</button>
      </div>
    </div>
  );
}
