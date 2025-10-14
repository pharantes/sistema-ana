"use client";
/* eslint-env browser */
import styled from "styled-components";
// import * as FE from "../components/FormElements"; // not needed now
import BRDateInput from "../components/BRDateInput";
import { InputWrap, Label, PresetButton, Note, RowWrap, RowTopGap, GridTwoGap } from "../components/ui/primitives";

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs, var(--gap-xs, var(--gap-xs, 6px)));
`;
// GridTwoGap, InputWrap, Label, Note, PresetButton are provided by ui/primitives
const ColStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;
// ShortRow removed — use RowTopGap/RowWrap primitives
// PresetsGroup replaced by shared RowWrap primitive


// Using primitives for Label and Note

const FlexWrap = styled.div`
  display: flex;
  gap: var(--gap-xs, var(--space-xs, var(--space-xs, 8px)));
  align-items: center;
  flex-wrap: wrap;
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
  rightActions,
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
      <Column>
        <Label>Vencimento</Label>
        <GridTwoGap>
          <ColStack>
            <label>De</label>
            <InputWrap>
              <BRDateInput value={dueFrom} onChange={onChangeDueFrom} />
            </InputWrap>
          </ColStack>
          <ColStack>
            <label>Até</label>
            <InputWrap>
              <BRDateInput value={dueTo} onChange={onChangeDueTo} />
            </InputWrap>
          </ColStack>
        </GridTwoGap>
      </Column>
      <RowTopGap>
        <RowWrap>
          <Note>Atalhos:</Note>
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
          <Note>Status:</Note>
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
        </RowWrap>
        <FlexWrap>
          {rightActions}
          <PresetButton onClick={onClear}>Limpar</PresetButton>
        </FlexWrap>
      </RowTopGap>
    </>
  );
}
