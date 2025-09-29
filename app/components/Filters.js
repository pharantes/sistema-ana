"use client";
import styled from "styled-components";

const FiltersWrapper = styled.section`
  width: 100%;
  margin-top: 16px;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 8px;
`;

export default function Filters({ q, setQ, eventDate, setEventDate, dueDate, setDueDate }) {
  return (
    <FiltersWrapper>
      <h3>Filtros</h3>
      <Grid>
        <input placeholder="Buscar (evento/cliente/profissional)" value={q} onChange={e => setQ(e.target.value)} />
        <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </Grid>
    </FiltersWrapper>
  );
}
