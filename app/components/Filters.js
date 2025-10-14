"use client";
import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import { InputWrap, Label, PresetButton, Note, RowWrap, RowTopGap } from "./ui/primitives";
import * as FE from "./FormElements";
import BRDateInput from "../components/BRDateInput";

// Styled Components
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

// Date formatting and calculation helpers
function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + daysToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return [weekStart, weekEnd];
}

function getCurrentMonthRange() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return [monthStart, monthEnd];
}

function focusElement(element) {
  try {
    element?.focus();
  } catch {
    // Ignore focus errors
  }
}

/**
 * Filters component for date range and search filtering.
 * Provides preset shortcuts for common date ranges.
 */
function FiltersComponent({
  q, setQ,
  rangeMode, setRangeMode,
  rangeFrom, setRangeFrom,
  rangeTo, setRangeTo,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    focusElement(inputRef.current);
  }, []);

  const toggleDateRange = (startDate, endDate) => {
    const isActive = rangeFrom === startDate && rangeTo === endDate;

    if (isActive) {
      setRangeFrom("");
      setRangeTo("");
    } else {
      setRangeFrom(startDate);
      setRangeTo(endDate);
    }
  };

  const applyTodayFilter = () => {
    const todayFormatted = formatDateToISO(new Date());
    toggleDateRange(todayFormatted, todayFormatted);
  };

  const applyWeekFilter = () => {
    const [weekStart, weekEnd] = getCurrentWeekRange();
    const startFormatted = formatDateToISO(weekStart);
    const endFormatted = formatDateToISO(weekEnd);
    toggleDateRange(startFormatted, endFormatted);
  };

  const applyMonthFilter = () => {
    const [monthStart, monthEnd] = getCurrentMonthRange();
    const startFormatted = formatDateToISO(monthStart);
    const endFormatted = formatDateToISO(monthEnd);
    toggleDateRange(startFormatted, endFormatted);
  };

  const clearAllFilters = () => {
    setQ("");
    setRangeMode('inicio');
    setRangeFrom("");
    setRangeTo("");
    focusElement(inputRef.current);
  };

  const isTodayActive = () => {
    const todayFormatted = formatDateToISO(new Date());
    return rangeFrom === todayFormatted && rangeTo === todayFormatted;
  };

  const isWeekActive = () => {
    const [weekStart, weekEnd] = getCurrentWeekRange();
    const startFormatted = formatDateToISO(weekStart);
    const endFormatted = formatDateToISO(weekEnd);
    return rangeFrom === startFormatted && rangeTo === endFormatted;
  };

  const isMonthActive = () => {
    const [monthStart, monthEnd] = getCurrentMonthRange();
    const startFormatted = formatDateToISO(monthStart);
    const endFormatted = formatDateToISO(monthEnd);
    return rangeFrom === startFormatted && rangeTo === endFormatted;
  };

  return (
    <FiltersWrapper>
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
            aria-pressed={isTodayActive()}
            onClick={applyTodayFilter}
          >Hoje</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={isWeekActive()}
            onClick={applyWeekFilter}
          >Esta semana</PresetButton>
          <PresetButton
            type="button"
            aria-pressed={isMonthActive()}
            onClick={applyMonthFilter}
          >Este mês</PresetButton>
        </PresetGroup>
        <div>
          <PresetButton type="button" onClick={clearAllFilters}>Limpar filtros</PresetButton>
        </div>
      </PresetsRow>
    </FiltersWrapper>
  );
}

export default React.memo(FiltersComponent);
