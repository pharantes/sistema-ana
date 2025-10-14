"use client";
import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import { InputWrap, Label, PresetButton, Note, RowWrap, RowTopGap } from "./ui/primitives";
import * as FE from "./FormElements";
import BRDateInput from "../components/BRDateInput";

const FiltersWrapper = styled.section`
  width: 100%;
  margin-top: var(--space-md, var(--space-md, var(--space-md, 16px)));
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--gap-xs, var(--space-xs, var(--space-xs, 8px)));
  align-items: end;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;

const PresetsRow = RowTopGap;
const PresetGroup = RowWrap;

// Note, Label, InputWrap and PresetButton are imported from ui/primitives

// Spacer not needed in this component

function FiltersComponent({
  q, setQ,
  rangeMode, setRangeMode,
  rangeFrom, setRangeFrom,
  rangeTo, setRangeTo,
}) {
  const inputRef = useRef(null);
  // One-time controlled autofocus on mount
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      try { el.focus(); } catch { /* ignore focus errors */ }
    }
  }, []);

  // Helpers to format YYYY-MM-DD
  const fmt = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const getSemana = () => {
    const d = new Date();
    const day = d.getDay(); // 0 Sun ... 6 Sat
    // Consider week starting on Monday
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMon);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [start, end];
  };
  const getMes = () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return [start, end];
  };

  const applyHoje = () => {
    const s = fmt(new Date());
    // toggle if already active
    if (rangeFrom === s && rangeTo === s) {
      setRangeFrom("");
      setRangeTo("");
    } else {
      setRangeFrom(s);
      setRangeTo(s);
    }
  };
  const applySemana = () => {
    const [start, end] = getSemana();
    const s = fmt(start); const e = fmt(end);
    if (rangeFrom === s && rangeTo === e) {
      setRangeFrom("");
      setRangeTo("");
    } else {
      setRangeFrom(s);
      setRangeTo(e);
    }
  };
  const applyMes = () => {
    const [start, end] = getMes();
    const s = fmt(start); const e = fmt(end);
    if (rangeFrom === s && rangeTo === e) {
      setRangeFrom("");
      setRangeTo("");
    } else {
      setRangeFrom(s);
      setRangeTo(e);
    }
  };
  const clearAll = () => {
    setQ("");
    setRangeMode('inicio');
    setRangeFrom("");
    setRangeTo("");
    try { inputRef.current?.focus(); } catch { /* ignore focus errors */ }
  };

  return (
    <FiltersWrapper>
      <h3>Filtros</h3>
      <Grid>
        <Field>
          <Label>Buscar</Label>
          <InputWrap>
            <FE.Input ref={inputRef} placeholder="Buscar por Cliente ou Evento" value={q} onChange={e => setQ(e.target.value)} />
          </InputWrap>
        </Field>

        <Field>
          <Label>Período por</Label>
          <InputWrap>
            <FE.Select value={rangeMode} onChange={e => setRangeMode(e.target.value)}>
              <option value="inicio">Início Ação</option>
              <option value="fim">Fim Ação</option>
            </FE.Select>
          </InputWrap>
        </Field>

        <Field>
          <Label>De</Label>
          <InputWrap>
            <BRDateInput value={rangeFrom} onChange={(iso) => setRangeFrom(iso)} />
          </InputWrap>
        </Field>

        <Field>
          <Label>Até</Label>
          <InputWrap>
            <BRDateInput value={rangeTo} onChange={(iso) => setRangeTo(iso)} />
          </InputWrap>
        </Field>
      </Grid>

      <PresetsRow>
        <PresetGroup>
          <Note>Atalhos:</Note>
          <PresetButton
            type="button"
            aria-pressed={(() => { const s = fmt(new Date()); return rangeFrom === s && rangeTo === s; })()}
            onClick={applyHoje}
          >Hoje</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={(() => { const [st, en] = getSemana(); const s = fmt(st), e = fmt(en); return rangeFrom === s && rangeTo === e; })()}
            onClick={applySemana}
          >Esta semana</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={(() => { const [st, en] = getMes(); const s = fmt(st), e = fmt(en); return rangeFrom === s && rangeTo === e; })()}
            onClick={applyMes}
          >Este mês</PresetButton>
        </PresetGroup>
        <div>
          <PresetButton type="button" onClick={clearAll}>Limpar filtros</PresetButton>
        </div>
      </PresetsRow>
    </FiltersWrapper>
  );
}

export default React.memo(FiltersComponent);
