"use client";
/* eslint-env browser */
import styled from 'styled-components';
import * as FE from "../components/FormElements";
import BRDateInput from "../components/BRDateInput";

const PresetButton = styled.button`
  padding: 6px 10px;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-primary, #222);
  &:hover { background: #f7f7f7; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &[aria-pressed="true"] {
    background: var(--color-primary, #6C2BB0);
    color: #fff;
    border-color: var(--color-primary, #6C2BB0);
  }
`;

export default function Filters({
  query,
  onChangeQuery,
  onGerarPDF,
  loading,
  mode, // 'venc' | 'receb'
  onChangeMode,
  dateFrom,
  dateTo,
  onChangeDateFrom,
  onChangeDateTo,
  statusFilter, // 'ALL' | 'ABERTO' | 'RECEBIDO'
  onChangeStatus,
  onClear,
}) {
  const fmt = (d) => {
    try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
  };
  const getSemana = () => {
    const now = new Date();
    const day = now.getDay(); // 0 dom ... 6 sab
    const diffToMon = (day + 6) % 7;
    const start = new Date(now); start.setDate(now.getDate() - diffToMon);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return [start, end];
  };
  const getMes = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [start, end];
  };
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <FE.Input
            type="search"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Buscar por cliente ou ação..."
            style={{ height: 40, width: '100%' }}
          />
        </div>
        <FE.SecondaryButton onClick={onGerarPDF} disabled={loading}>Gerar PDF</FE.SecondaryButton>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 180 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Filtrar por</label>
            <FE.Select value={mode} onChange={(e) => onChangeMode(e.target.value)} style={{ height: 40 }}>
              <option value="venc">Vencimento</option>
              <option value="receb">Recebimento</option>
            </FE.Select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>De</label>
            <BRDateInput value={dateFrom} onChange={onChangeDateFrom} style={{ height: 40, width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Até</label>
            <BRDateInput value={dateTo} onChange={onChangeDateTo} style={{ height: 40, width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Atalhos:</span>
            <PresetButton type="button" aria-pressed={(() => { const s = fmt(new Date()); return dateFrom === s && dateTo === s; })()} onClick={() => { const s = fmt(new Date()); const same = (dateFrom === s && dateTo === s); onChangeDateFrom(same ? '' : s); onChangeDateTo(same ? '' : s); }}>Hoje</PresetButton>
            <PresetButton type="button" aria-pressed={(() => { const [st, en] = getSemana(); const s = fmt(st), e = fmt(en); return dateFrom === s && dateTo === e; })()} onClick={() => { const [st, en] = getSemana(); const s = fmt(st), e = fmt(en); const same = (dateFrom === s && dateTo === e); onChangeDateFrom(same ? '' : s); onChangeDateTo(same ? '' : e); }}>Esta semana</PresetButton>
            <PresetButton type="button" aria-pressed={(() => { const [st, en] = getMes(); const s = fmt(st), e = fmt(en); return dateFrom === s && dateTo === e; })()} onClick={() => { const [st, en] = getMes(); const s = fmt(st), e = fmt(en); const same = (dateFrom === s && dateTo === e); onChangeDateFrom(same ? '' : s); onChangeDateTo(same ? '' : e); }}>Este mês</PresetButton>
            <PresetButton type="button" aria-pressed={(() => { const start = new Date(); const end = new Date(); end.setDate(start.getDate() + 15); const s = fmt(start), e = fmt(end); return dateFrom === s && dateTo === e; })()} onClick={() => { const start = new Date(); const end = new Date(); end.setDate(start.getDate() + 15); const s = fmt(start), e = fmt(end); const same = (dateFrom === s && dateTo === e); onChangeDateFrom(same ? '' : s); onChangeDateTo(same ? '' : e); }}>Próximos 15 dias</PresetButton>
            <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: 8 }}>Status:</span>
            <PresetButton type="button" aria-pressed={statusFilter === 'ALL'} onClick={() => onChangeStatus('ALL')}>Todos</PresetButton>
            <PresetButton type="button" aria-pressed={statusFilter === 'ABERTO'} onClick={() => onChangeStatus('ABERTO')}>ABERTO</PresetButton>
            <PresetButton type="button" aria-pressed={statusFilter === 'RECEBIDO'} onClick={() => onChangeStatus('RECEBIDO')}>RECEBIDO</PresetButton>
          </div>
          <PresetButton type="button" onClick={onClear}>Limpar</PresetButton>
        </div>
      </div>
    </div>
  );
}
