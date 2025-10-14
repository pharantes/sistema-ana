"use client";
import { useState, useEffect, useRef } from "react";
import styled from 'styled-components';
import { Label, RowGap6, ActionsInline } from "../components/ui/primitives";
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

export default function FiltersClient({ clients = [], filterClient, setFilterClient, filterFrom, setFilterFrom, filterTo, setFilterTo, onApply }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (filterClient) {
      const sel = clients.find((c) => String(c._id) === String(filterClient));
      if (sel) setSelected({ value: String(sel._id), label: `${sel.codigo ? sel.codigo + ' ' : ''}${sel.nome || sel.name}` });
      else setSelected(null);
    } else setSelected(null);
  }, [filterClient, clients]);

  const options = clients.map((c) => ({ value: String(c._id), label: `${c.codigo ? c.codigo + ' ' : ''}${c.nome || c.name}` }));
  // refined control styles to better vertically center the select and match date input height
  // compute values safely (avoid referencing window/document during SSR)
  let controlHeightVal = 34;
  let paddingLeftVal = 6;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const rootStyles = getComputedStyle(document.documentElement);
      const parsedControl = parseInt(rootStyles.getPropertyValue('--control-height') || '36', 10) - 2;
      controlHeightVal = Number.isFinite(parsedControl) && !Number.isNaN(parsedControl) ? parsedControl : 34;
      const parsedPad = parseInt(rootStyles.getPropertyValue('--space-xxs') || '6', 10);
      paddingLeftVal = Number.isFinite(parsedPad) && !Number.isNaN(parsedPad) ? parsedPad : 6;
    } catch {
      // fallback to defaults when getComputedStyle fails
      controlHeightVal = 34;
      paddingLeftVal = 6;
    }
  }

  const controlStyles = {
    control: (p) => ({ ...p, minHeight: controlHeightVal, height: 34, display: 'flex', alignItems: 'center', fontSize: '0.88rem', paddingLeft: paddingLeftVal }),
    valueContainer: (p) => ({ ...p, padding: `0 var(--space-xxs, var(--gap-xs, var(--gap-xs, 6px)))` }),
    indicatorsContainer: (p) => ({ ...p, height: 34 }),
    input: (p) => ({ ...p, margin: 0, padding: 0 }),
    singleValue: (p) => ({ ...p, fontSize: '0.88rem' }),
    placeholder: (p) => ({ ...p, margin: 0 }),
    menu: (p) => ({ ...p, zIndex: 60 })
  };

  const instanceRef = useRef(`client-select-${Math.random().toString(36).slice(2, 9)}`);
  const inputId = `${instanceRef.current}-input`;
  const placeholderId = `${instanceRef.current}-placeholder`;

  return (
    <FilterRow>
      <ClientField>
        <Label>Cliente</Label>
        <Select
          value={selected}
          onChange={(v) => { setSelected(v); setFilterClient(v ? v.value : ""); }}
          options={options}
          isClearable
          styles={controlStyles}
          instanceId={instanceRef.current}
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
          <FE.SecondaryButton onClick={() => { setFilterClient(''); setFilterFrom(''); setFilterTo(''); setSelected(null); if (onApply) onApply(); }}>Limpar</FE.SecondaryButton>
          <FE.Button onClick={() => { if (onApply) onApply(); }}>Aplicar</FE.Button>
        </ButtonsRow>
      </DateRow>
    </FilterRow>
  );

}
