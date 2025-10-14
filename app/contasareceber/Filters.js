"use client";
/* eslint-env browser */
import styled from 'styled-components';
import * as FE from "../components/FormElements";
import BRDateInput from "../components/BRDateInput";
import { InputWrap, Label, PresetButton, Note, RowWrap, RowTopGap } from "../components/ui/primitives";

const Container = styled.div`
  display: grid;
  gap: var(--gap-xs, var(--gap-xs, var(--gap-xs, 6px))); /* ensure explicit fallback */
`;
const TopRow = styled(RowWrap)`
  flex-wrap: wrap;
`;
const WideField = styled.div`
  flex: 1;
  min-width: var(--small-input-width, 260px);
`;
const ControlsGrid = styled.div`
  display: grid;
  gap: var(--gap-xs);
`;
const ControlsRow = styled(RowWrap)`
  align-items: end;
  flex-wrap: wrap;
`;
const SmallField = styled.div`
  flex: 1;
  min-width: var(--small-input-width, 180px);
`;
const PresetsRow = styled(RowTopGap)`
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: var(--space-xs); /* keep previous smaller top gap */
`;
// PresetsGroup removed — use shared RowInline directly where needed
// (using shared primitives from ui/primitives)

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
    <Container>
      <TopRow>
        <WideField>
          <InputWrap>
            <FE.Input
              type="search"
              value={query}
              onChange={(e) => onChangeQuery(e.target.value)}
              placeholder="Buscar por cliente ou ação..."
            />
          </InputWrap>
        </WideField>
        <FE.SecondaryButton onClick={onGerarPDF} disabled={loading}>Gerar PDF</FE.SecondaryButton>
      </TopRow>

      <ControlsGrid>
        <ControlsRow>
          <SmallField>
            <Label>Filtrar por</Label>
            <InputWrap>
              <FE.Select value={mode} onChange={(e) => onChangeMode(e.target.value)}>
                <option value="venc">Vencimento</option>
                <option value="receb">Recebimento</option>
              </FE.Select>
            </InputWrap>
          </SmallField>
          <SmallField>
            <Label>De</Label>
            <InputWrap>
              <BRDateInput value={dateFrom} onChange={onChangeDateFrom} />
            </InputWrap>
          </SmallField>
          <SmallField>
            <Label>Até</Label>
            <InputWrap>
              <BRDateInput value={dateTo} onChange={onChangeDateTo} />
            </InputWrap>
          </SmallField>
        </ControlsRow>

        <PresetsRow>
          <RowWrap>
            <Note>Atalhos:</Note>
            <PresetButton type="button" aria-pressed={(() => { const s = fmt(new Date()); return dateFrom === s && dateTo === s; })()} onClick={() => { const s = fmt(new Date()); const same = (dateFrom === s && dateTo === s); onChangeDateFrom(same ? '' : s); onChangeDateTo(same ? '' : s); }}>Hoje</PresetButton>
            <PresetButton type="button" aria-pressed={(() => { const [st, en] = getSemana(); const s = fmt(st), e = fmt(en); return dateFrom === s && dateTo === e; })()} onClick={() => { const [st, en] = getSemana(); const s = fmt(st), e = fmt(en); const same = (dateFrom === s && dateTo === e); onChangeDateFrom(same ? '' : s); onChangeDateTo(same ? '' : e); }}>Esta semana</PresetButton>
            <PresetButton type="button" aria-pressed={(() => { const [st, en] = getMes(); const s = fmt(st), e = fmt(en); return dateFrom === s && dateTo === e; })()} onClick={() => { const [st, en] = getMes(); const s = fmt(st), e = fmt(en); const same = (dateFrom === s && dateTo === e); onChangeDateFrom(same ? '' : s); onChangeDateTo(same ? '' : e); }}>Este mês</PresetButton>
            <PresetButton type="button" aria-pressed={(() => { const start = new Date(); const end = new Date(); end.setDate(start.getDate() + 15); const s = fmt(start), e = fmt(end); return dateFrom === s && dateTo === e; })()} onClick={() => { const start = new Date(); const end = new Date(); end.setDate(start.getDate() + 15); const s = fmt(start), e = fmt(end); const same = (dateFrom === s && dateTo === e); onChangeDateFrom(same ? '' : s); onChangeDateTo(same ? '' : e); }}>Próximos 15 dias</PresetButton>
            <Note>Status:</Note>
            <PresetButton type="button" aria-pressed={statusFilter === 'ALL'} onClick={() => onChangeStatus('ALL')}>Todos</PresetButton>
            <PresetButton type="button" aria-pressed={statusFilter === 'ABERTO'} onClick={() => onChangeStatus('ABERTO')}>ABERTO</PresetButton>
            <PresetButton type="button" aria-pressed={statusFilter === 'RECEBIDO'} onClick={() => onChangeStatus('RECEBIDO')}>RECEBIDO</PresetButton>
          </RowWrap>
          <PresetButton type="button" onClick={onClear}>Limpar</PresetButton>
        </PresetsRow>
      </ControlsGrid>
    </Container>
  );
}
