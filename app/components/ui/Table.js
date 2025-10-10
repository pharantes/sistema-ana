"use client";
import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  table-layout: auto;
  
  /* Zebra striping for readability */
  tbody tr:nth-child(odd) {
    background-color: #ffffff;
  }
  tbody tr:nth-child(even) {
    background-color: #f9fafb; /* light grey */
  }
  /* Ensure left alignment even if raw th/td are used inside */
  th, td { text-align: left !important; vertical-align: top; }
  thead th * { text-align: left !important; }
  tbody td * { text-align: left !important; }
  tbody td a, tbody td button { text-align: left !important; }
`;
export const Th = styled.th`
  text-align: left !important;
  vertical-align: top;
  border-bottom: 1px solid #ccc;
  padding: 6px;
`;
export const Td = styled.td`
  padding: 6px;
  text-align: left !important;
  vertical-align: top;
`;

export default { Table, Th, Td };
