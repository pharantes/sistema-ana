"use client";
import { useState, useEffect } from "react";
import styled from 'styled-components';
import { Label, RowGap6, ActionsInline, PresetButton, Note, RowWrap } from "../components/ui/primitives";
import * as FE from "../components/FormElements";
import BRDateInput from "../components/BRDateInput";
import Select from "react-select";
import FilterRow, { Field } from "../components/ui/FilterRow";

const ClientField = styled(Field)`
  min-width: var(--small-input-width, 190px);
`;

const DateRow = RowGap6;

const DateField = styled(Field)`
  input { height: calc(var(--control-height, 36px) - 2px); font-size: 0.88rem; }
`;

const LabelSmall = styled(Label)`
  display: inline-block;
  font-size: 0.76rem;
  line-height: 1;
`;

const ButtonsRow = styled(ActionsInline)`
  margin-left: var(--space-xxs, var(--gap-xs, var(--gap-xs, 6px)));
  & > button { height: calc(var(--control-height, 36px) - 2px); padding: var(--space-xxs, var(--gap-xs, var(--gap-xs, 6px))) var(--space-sm, 10px); font-size: 0.86rem; }
`;

const PresetsRow = styled(RowWrap)`
  margin-top: var(--space-lg, 24px);
  flex-wrap: wrap;
  gap: var(--gap-xs, 6px);
  align-items: center;
`;

/**
 * Formats a date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateISO(date) {
  try {
    return date.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/**
 * Gets the start and end dates for the current week (Monday to Sunday)
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
 * Gets the start and end dates for the current month
 * @returns {[Date, Date]} Array of [startDate, endDate]
 */
function getCurrentMonthRange() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return [startDate, endDate];
}

/**
 * Gets the start and end dates for the next 15 days
 * @returns {[Date, Date]} Array of [startDate, endDate]
 */
function getNext15DaysRange() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 15);
  return [startDate, endDate];
}

/**
 * Formats cliente for display in select option
 * @param {Object} cliente - Cliente object
 * @returns {string} Formatted label
 */
function formatClienteLabel(cliente) {
  const codigoPrefix = cliente.codigo ? `${cliente.codigo} ` : '';
  const clienteName = cliente.nome || cliente.name;
  return `${codigoPrefix}${clienteName}`;
}

/**
 * Finds selected cliente by ID
 * @param {Array} clientes - Array of clientes
 * @param {string} clienteId - Cliente ID to find
 * @returns {Object|null} Select option or null
 */
function findSelectedCliente(clientes, clienteId) {
  const foundCliente = clientes.find((c) => String(c._id) === String(clienteId));
  if (!foundCliente) return null;

  return {
    value: String(foundCliente._id),
    label: formatClienteLabel(foundCliente)
  };
}

/**
 * Dashboard filters component with cliente selector and date range
 * @param {Object} props - Component props
 * @param {Array} props.clients - Array of available clientes
 * @param {string} props.filterClient - Selected cliente ID
 * @param {Function} props.setFilterClient - Set cliente filter
 * @param {string} props.filterFrom - Start date (ISO)
 * @param {Function} props.setFilterFrom - Set start date
 * @param {string} props.filterTo - End date (ISO)
 * @param {Function} props.setFilterTo - Set end date
 * @param {Function} props.onApply - Apply filters callback
 */
export default function FiltersClient({
  clients = [],
  filterClient,
  setFilterClient,
  filterFrom,
  setFilterFrom,
  filterTo,
  setFilterTo,
  onApply
}) {
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (filterClient) {
      const selectedCliente = findSelectedCliente(clients, filterClient);
      setSelectedOption(selectedCliente);
    } else {
      setSelectedOption(null);
    }
  }, [filterClient, clients]);

  const clientOptions = clients.map((cliente) => ({
    value: String(cliente._id),
    label: formatClienteLabel(cliente)
  }));

  // Static styles to prevent hydration mismatches
  // Using fixed values instead of dynamic CSS property queries
  const controlStyles = {
    control: (baseStyles) => ({
      ...baseStyles,
      minHeight: '34px',
      height: '34px',
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.88rem',
      paddingLeft: '6px',
      paddingTop: 0,
      paddingBottom: 0,
      // Small upward nudge to better align with adjacent date inputs
      marginTop: '-6px',
    }),
    valueContainer: (baseStyles) => ({
      ...baseStyles,
      padding: '0 6px'
    }),
    indicatorsContainer: (baseStyles) => ({ ...baseStyles, height: '34px' }),
    input: (baseStyles) => ({ ...baseStyles, margin: 0, padding: 0 }),
    singleValue: (baseStyles) => ({ ...baseStyles, fontSize: '0.88rem' }),
    placeholder: (baseStyles) => ({ ...baseStyles, margin: 0 }),
    menu: (baseStyles) => ({ ...baseStyles, zIndex: 60 })
  };

  // Use stable ID for SSR hydration consistency
  const instanceId = 'dashboard-client-select';
  const inputId = `${instanceId}-input`;
  const placeholderId = `${instanceId}-placeholder`;

  const handleClienteChange = (selectedValue) => {
    setSelectedOption(selectedValue);
    setFilterClient(selectedValue ? selectedValue.value : "");
  };

  const handleClearFilters = () => {
    setFilterClient('');
    setFilterFrom('');
    setFilterTo('');
    setSelectedOption(null);
    if (onApply) onApply();
  };

  const handleApplyFilters = () => {
    if (onApply) onApply();
  };

  // Preset handlers
  const handleToday = () => {
    const today = formatDateISO(new Date());
    const isActive = filterFrom === today && filterTo === today;
    setFilterFrom(isActive ? '' : today);
    setFilterTo(isActive ? '' : today);
  };

  const handleThisWeek = () => {
    const [start, end] = getCurrentWeekRange();
    const startStr = formatDateISO(start);
    const endStr = formatDateISO(end);
    const isActive = filterFrom === startStr && filterTo === endStr;
    setFilterFrom(isActive ? '' : startStr);
    setFilterTo(isActive ? '' : endStr);
  };

  const handleThisMonth = () => {
    const [start, end] = getCurrentMonthRange();
    const startStr = formatDateISO(start);
    const endStr = formatDateISO(end);
    const isActive = filterFrom === startStr && filterTo === endStr;
    setFilterFrom(isActive ? '' : startStr);
    setFilterTo(isActive ? '' : endStr);
  };

  const handleNext15Days = () => {
    const [start, end] = getNext15DaysRange();
    const startStr = formatDateISO(start);
    const endStr = formatDateISO(end);
    const isActive = filterFrom === startStr && filterTo === endStr;
    setFilterFrom(isActive ? '' : startStr);
    setFilterTo(isActive ? '' : endStr);
  };

  // Check if presets are active
  const today = formatDateISO(new Date());
  const isTodayActive = filterFrom === today && filterTo === today;

  const [weekStart, weekEnd] = getCurrentWeekRange();
  const weekStartStr = formatDateISO(weekStart);
  const weekEndStr = formatDateISO(weekEnd);
  const isWeekActive = filterFrom === weekStartStr && filterTo === weekEndStr;

  const [monthStart, monthEnd] = getCurrentMonthRange();
  const monthStartStr = formatDateISO(monthStart);
  const monthEndStr = formatDateISO(monthEnd);
  const isMonthActive = filterFrom === monthStartStr && filterTo === monthEndStr;

  const [next15Start, next15End] = getNext15DaysRange();
  const next15StartStr = formatDateISO(next15Start);
  const next15EndStr = formatDateISO(next15End);
  const isNext15Active = filterFrom === next15StartStr && filterTo === next15EndStr;

  return (
    <FilterRow>
      <ClientField>
        <Label>Cliente</Label>
        <Select
          value={selectedOption}
          onChange={handleClienteChange}
          options={clientOptions}
          isClearable
          styles={controlStyles}
          instanceId={instanceId}
          inputId={inputId}
          aria-describedby={placeholderId}
          placeholder={<div id={placeholderId}>Pesquisar cliente...</div>}
        />
      </ClientField>

      <DateRow>
        <DateField>
          <LabelSmall>De</LabelSmall>
          <BRDateInput value={filterFrom} onChange={(iso) => setFilterFrom(iso)} />
        </DateField>
        <DateField>
          <LabelSmall>Até</LabelSmall>
          <BRDateInput value={filterTo} onChange={(iso) => setFilterTo(iso)} />
        </DateField>
        <ButtonsRow>
          <FE.SecondaryButton onClick={handleClearFilters}>
            Limpar
          </FE.SecondaryButton>
          <FE.Button onClick={handleApplyFilters}>
            Aplicar
          </FE.Button>
        </ButtonsRow>
      </DateRow>

      <PresetsRow>
        <Note>Atalhos:</Note>
        <PresetButton type="button" aria-pressed={isTodayActive} onClick={handleToday}>
          Hoje
        </PresetButton>
        <PresetButton type="button" aria-pressed={isWeekActive} onClick={handleThisWeek}>
          Esta semana
        </PresetButton>
        <PresetButton type="button" aria-pressed={isMonthActive} onClick={handleThisMonth}>
          Este mês
        </PresetButton>
        <PresetButton type="button" aria-pressed={isNext15Active} onClick={handleNext15Days}>
          Próximos 15 dias
        </PresetButton>
      </PresetsRow>
    </FilterRow>
  );
}
