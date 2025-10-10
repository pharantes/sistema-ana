"use client";

export default function ColaboradorCell({ report }) {
  if (!report) return null;
  // staff row with colaboradorId
  if (report.staffName && report?.colaboradorId) {
    return (
      <button
        onClick={() => globalThis.location.assign(`/colaboradores/${report.colaboradorId}`)}
        style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
      >
        {report.staffName}
      </button>
    );
  }
  // staff row without id
  if (report.staffName) return report.staffName;
  // cost row possibly with colaboradorId and label
  if (report.colaboradorLabel && report?.colaboradorId) {
    return (
      <button
        onClick={() => globalThis.location.assign(`/colaboradores/${report.colaboradorId}`)}
        style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
      >
        {report.colaboradorLabel}
      </button>
    );
  }
  // fallback: cost description vendor name/empresa
  const costs = Array.isArray(report.actionId?.costs) ? report.actionId.costs : [];
  const ct = report.costId ? costs.find(c => String(c._id) === String(report.costId)) : null;
  if (!ct) return '';
  const n = ct.vendorName || '';
  const e = ct.vendorEmpresa || '';
  return `${n}${e ? ` (${e})` : ''}`;
}
