"use client";
import styled from "styled-components";

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
`;
export const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 6px;
`;
export const Td = styled.td`
  padding: 6px;
`;

export default { Table, Th, Td };
