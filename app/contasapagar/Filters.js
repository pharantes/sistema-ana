"use client";
/* eslint-env browser */
import styled from "styled-components";
// import * as FE from "../components/FormElements"; // not needed now
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

function fmt(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function getSemana() {
  const d = new Date();
  const day = d.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return [start, end];
}
function getMes() {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [start, end];
}

export default function Filters({
  dueFrom,
  dueTo,
  onChangeDueFrom,
  onChangeDueTo,
  statusFilter,
  onChangeStatus,
  onClear,
  inputSx,
}) {
  const applyHoje = () => {
    const s = fmt(new Date());
    if (dueFrom === s && dueTo === s) { onChangeDueFrom(''); onChangeDueTo(''); }
    else { onChangeDueFrom(s); onChangeDueTo(s); }
  };
  const applySemana = () => {
    const [start, end] = getSemana();
    const s = fmt(start), e = fmt(end);
    if (dueFrom === s && dueTo === e) { onChangeDueFrom(''); onChangeDueTo(''); }
    else { onChangeDueFrom(s); onChangeDueTo(e); }
  };
  const applyMes = () => {
    const [start, end] = getMes();
    const s = fmt(start), e = fmt(end);
    if (dueFrom === s && dueTo === e) { onChangeDueFrom(''); onChangeDueTo(''); }
    else { onChangeDueFrom(s); onChangeDueTo(e); }
  };
  const applyNext15 = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 15);
    const s = fmt(start), e = fmt(end);
    if (dueFrom === s && dueTo === e) { onChangeDueFrom(''); onChangeDueTo(''); }
    else { onChangeDueFrom(s); onChangeDueTo(e); }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontWeight: 600 }}>Vencimento</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label>De</label>
            <BRDateInput value={dueFrom} onChange={onChangeDueFrom} style={inputSx} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label>Até</label>
            <BRDateInput value={dueTo} onChange={onChangeDueTo} style={inputSx} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>Atalhos:</span>
          <PresetButton
            type="button"
            aria-pressed={(() => { const s = fmt(new Date()); return dueFrom === s && dueTo === s; })()}
            onClick={applyHoje}
          >Hoje</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={(() => { const [st, en] = getSemana(); const s = fmt(st), e = fmt(en); return dueFrom === s && dueTo === e; })()}
            onClick={applySemana}
          >Esta semana</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={(() => { const [st, en] = getMes(); const s = fmt(st), e = fmt(en); return dueFrom === s && dueTo === e; })()}
            onClick={applyMes}
          >Este mês</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={(() => { const start = new Date(); const end = new Date(); end.setDate(start.getDate() + 15); const s = fmt(start), e = fmt(end); return dueFrom === s && dueTo === e; })()}
            onClick={applyNext15}
          >Próximos 15 dias</PresetButton>
          <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: 8 }}>Status:</span>
          <PresetButton
            type="button"
            aria-pressed={statusFilter === 'ALL'}
            onClick={() => onChangeStatus('ALL')}
          >Todos</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={statusFilter === 'ABERTO'}
            onClick={() => onChangeStatus('ABERTO')}
          >ABERTO</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={statusFilter === 'PAGO'}
            onClick={() => onChangeStatus('PAGO')}
          >PAGO</PresetButton>
        </div>
        <PresetButton onClick={onClear}>Limpar</PresetButton>
      </div>
    </>
  );
}
