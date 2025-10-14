"use client";
import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: var(--space-xs);
  table-layout: auto;
  
  /* Zebra striping for readability */
  tbody tr:nth-child(odd) {
    background-color: #ffffff;
  }
  tbody tr:nth-child(even) {
    background-color: #d1d5db; /* darker light grey for higher contrast on most panels */
  }
  /* Ensure left alignment even if raw th/td are used inside */
  th, td { text-align: left !important; vertical-align: top; box-sizing: border-box; }
  thead th * { text-align: left !important; }
  tbody td * { text-align: left !important; }
  tbody td a, tbody td button { text-align: left !important; }
  /* Subtle row divider for clarity even on low-contrast displays */
  tbody td { border-bottom: 1px solid #e2e8f0; }
`;
export const Th = styled.th`
  text-align: left !important;
  vertical-align: top;
  border-bottom: 1px solid #ccc;
  padding: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;
export const ThClickable = styled(Th)`
  cursor: pointer;
  user-select: none;
`;
export const Td = styled.td`
  padding: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
  text-align: left !important;
  vertical-align: top;
`;

// A compact table variant used on denser list pages (contas) to match /acoes density
export const CompactTable = styled(Table)`
  font-size: 0.95rem; /* slightly smaller for denser rows */
  thead th, tbody td {
    /* reduce vertical padding slightly for a tighter list */
    padding: calc(var(--space-xxs, 4px) * 0.75) !important;
  }
  tbody td {
    border-bottom-width: 1px;
  }
`;

export default { Table, Th, Td, CompactTable };
