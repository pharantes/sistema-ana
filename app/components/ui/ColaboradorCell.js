"use client";
import LinkButton from './LinkButton';

export default function ColaboradorCell({ report }) {
  if (!report) return null;
  // staff row with colaboradorId
  if (report.staffName && report?.colaboradorId) {
    return (
      <LinkButton onClick={() => globalThis.location.assign(`/colaboradores/${report.colaboradorId}`)}>
        {report.staffName}
      </LinkButton>
    );
  }
  // staff row without id
  if (report.staffName) return report.staffName;
  // cost row possibly with colaboradorId and label
  if (report.colaboradorLabel && report?.colaboradorId) {
    return (
      <LinkButton onClick={() => globalThis.location.assign(`/colaboradores/${report.colaboradorId}`)}>
        {report.colaboradorLabel}
      </LinkButton>
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
