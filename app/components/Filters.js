"use client";
import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import * as FE from "./FormElements";

const FiltersWrapper = styled.section`
  width: 100%;
  margin-top: 16px;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 8px;
  align-items: end;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const Label = styled.label`
  font-size: 0.85rem;
  color: #444;
`;

const PresetsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  flex-wrap: wrap;
`;
const PresetButton = styled.button`
  padding: 6px 10px;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  &:hover { background: #f7f7f7; }
  &[aria-pressed="true"] {
    background: var(--color-primary, #6C2BB0);
    color: #fff;
    border-color: var(--color-primary, #6C2BB0);
  }
`;

function FiltersComponent({
  q, setQ,
  rangeMode, setRangeMode,
  rangeFrom, setRangeFrom,
  rangeTo, setRangeTo,
}) {
  const inputRef = useRef(null);
  const inputSx = { height: 40 };
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
          <FE.Input ref={inputRef} placeholder="Buscar por Cliente ou Evento" value={q} onChange={e => setQ(e.target.value)} style={inputSx} />
        </Field>

        <Field>
          <Label>Período por</Label>
          <FE.Select value={rangeMode} onChange={e => setRangeMode(e.target.value)} style={inputSx}>
            <option value="inicio">Início Ação</option>
            <option value="fim">Fim Ação</option>
          </FE.Select>
        </Field>
        <Field>
          <Label>De</Label>
          <FE.Input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} style={inputSx} />
        </Field>
        <Field>
          <Label>Até</Label>
          <FE.Input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} style={inputSx} />
        </Field>
      </Grid>
      <PresetsRow>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>Atalhos:</span>
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
        <div style={{ flex: 1 }} />
        <PresetButton type="button" onClick={clearAll}>Limpar filtros</PresetButton>
      </PresetsRow>
    </FiltersWrapper>
  );
}

export default React.memo(FiltersComponent);
