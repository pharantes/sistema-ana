"use client";
/* eslint-env browser */
import styled from "styled-components";
import BRDateInput from "../components/BRDateInput";
import { InputWrap, Label, PresetButton, Note, RowWrap, RowTopGap, GridTwoGap } from "../components/ui/primitives";

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs, var(--gap-xs, var(--gap-xs, 6px)));
`;
const ColStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;
const FlexWrap = styled.div`
  display: flex;
  gap: var(--gap-xs, var(--space-xs, var(--space-xs, 8px)));
  align-items: center;
  flex-wrap: wrap;
`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a date to YYYY-MM-DD format.
 * @param {Date} date - The date to format
 * @returns {string} The formatted date string
 */
function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the start and end dates for the current week (Monday to Sunday).
 * @returns {[Date, Date]} Array of [startDate, endDate]
 */
function getCurrentWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + daysToMonday);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return [startDate, endDate];
}

/**
 * Gets the start and end dates for the current month.
 * @returns {[Date, Date]} Array of [startDate, endDate]
 */
function getCurrentMonthRange() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return [startDate, endDate];
}

/**
 * Gets the start and end dates for the next 15 days.
 * @returns {[Date, Date]} Array of [startDate, endDate]
 */
function getNext15DaysRange() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 15);
  return [startDate, endDate];
}

/**
 * Checks if the current date range matches the given dates.
 * @param {string} currentFrom - Current from date
 * @param {string} currentTo - Current to date
 * @param {string} targetFrom - Target from date
 * @param {string} targetTo - Target to date
 * @returns {boolean} True if the ranges match
 */
function isDateRangeActive(currentFrom, currentTo, targetFrom, targetTo) {
  return currentFrom === targetFrom && currentTo === targetTo;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Filter controls for the Contas a Pagar page.
 * Provides date range selection, preset buttons, and status filters.
 */

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
  /**
   * Applies or clears the "today" date range filter.
   */
  const handleApplyToday = () => {
    const todayFormatted = formatDateISO(new Date());
    if (isDateRangeActive(dueFrom, dueTo, todayFormatted, todayFormatted)) {
      onChangeDueFrom('');
      onChangeDueTo('');
    } else {
      onChangeDueFrom(todayFormatted);
      onChangeDueTo(todayFormatted);
    }
  };

  /**
   * Applies or clears the "current week" date range filter.
   */
  const handleApplyWeek = () => {
    const [startDate, endDate] = getCurrentWeekRange();
    const startFormatted = formatDateISO(startDate);
    const endFormatted = formatDateISO(endDate);
    if (isDateRangeActive(dueFrom, dueTo, startFormatted, endFormatted)) {
      onChangeDueFrom('');
      onChangeDueTo('');
    } else {
      onChangeDueFrom(startFormatted);
      onChangeDueTo(endFormatted);
    }
  };

  /**
   * Applies or clears the "current month" date range filter.
   */
  const handleApplyMonth = () => {
    const [startDate, endDate] = getCurrentMonthRange();
    const startFormatted = formatDateISO(startDate);
    const endFormatted = formatDateISO(endDate);
    if (isDateRangeActive(dueFrom, dueTo, startFormatted, endFormatted)) {
      onChangeDueFrom('');
      onChangeDueTo('');
    } else {
      onChangeDueFrom(startFormatted);
      onChangeDueTo(endFormatted);
    }
  };

  /**
   * Applies or clears the "next 15 days" date range filter.
   */
  const handleApplyNext15Days = () => {
    const [startDate, endDate] = getNext15DaysRange();
    const startFormatted = formatDateISO(startDate);
    const endFormatted = formatDateISO(endDate);
    if (isDateRangeActive(dueFrom, dueTo, startFormatted, endFormatted)) {
      onChangeDueFrom('');
      onChangeDueTo('');
    } else {
      onChangeDueFrom(startFormatted);
      onChangeDueTo(endFormatted);
    }
  };

  // Compute active states for preset buttons
  const todayFormatted = formatDateISO(new Date());
  const isTodayActive = isDateRangeActive(dueFrom, dueTo, todayFormatted, todayFormatted);

  const [weekStart, weekEnd] = getCurrentWeekRange();
  const weekStartFormatted = formatDateISO(weekStart);
  const weekEndFormatted = formatDateISO(weekEnd);
  const isWeekActive = isDateRangeActive(dueFrom, dueTo, weekStartFormatted, weekEndFormatted);

  const [monthStart, monthEnd] = getCurrentMonthRange();
  const monthStartFormatted = formatDateISO(monthStart);
  const monthEndFormatted = formatDateISO(monthEnd);
  const isMonthActive = isDateRangeActive(dueFrom, dueTo, monthStartFormatted, monthEndFormatted);

  const [next15Start, next15End] = getNext15DaysRange();
  const next15StartFormatted = formatDateISO(next15Start);
  const next15EndFormatted = formatDateISO(next15End);
  const isNext15Active = isDateRangeActive(dueFrom, dueTo, next15StartFormatted, next15EndFormatted);

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
            aria-pressed={isTodayActive}
            onClick={handleApplyToday}
          >
            Hoje
          </PresetButton>
          <PresetButton
            type="button"
            aria-pressed={isWeekActive}
            onClick={handleApplyWeek}
          >
            Esta semana
          </PresetButton>
          <PresetButton
            type="button"
            aria-pressed={isMonthActive}
            onClick={handleApplyMonth}
          >
            Este mês
          </PresetButton>
          <PresetButton
            type="button"
            aria-pressed={isNext15Active}
            onClick={handleApplyNext15Days}
          >
            Próximos 15 dias
          </PresetButton>
          <Note>Status:</Note>
          <PresetButton
            type="button"
            aria-pressed={statusFilter === 'ALL'}
            onClick={() => onChangeStatus('ALL')}
          >
            Todos
          </PresetButton>
          <PresetButton
            type="button"
            aria-pressed={statusFilter === 'ABERTO'}
            onClick={() => onChangeStatus('ABERTO')}
          >
            ABERTO
          </PresetButton>
          <PresetButton
            type="button"
            aria-pressed={statusFilter === 'PAGO'}
            onClick={() => onChangeStatus('PAGO')}
          >
            PAGO
          </PresetButton>
        </RowWrap>
        <FlexWrap>
          {rightActions}
          <PresetButton onClick={onClear}>Limpar</PresetButton>
        </FlexWrap>
      </RowTopGap>
    </>
  );
}
