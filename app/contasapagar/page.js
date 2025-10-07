"use client";
import styled from "styled-components";


const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;
const Wrapper = styled.div`
  padding: 24px;
`;

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;
const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ccc;
  padding: 8px;
`;
const Td = styled.td`
  padding: 8px;
`;

export default function ContasAPagarPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    const res = await fetch("/api/contasapagar");
    const data = await res.json();
    setReports(data);
    setLoading(false);
  }

  // Removed delete functionality per new requirements

  async function handleStatusChange(id, next, current) {
    if (!session || session.user.role !== "admin") return;
    // Optimistically set to selected value
    setReports(prev => prev.map(r => (r._id === id ? { ...r, status: next } : r)));
    try {
      const res = await fetch("/api/contasapagar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status: next })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao atualizar status");
      }
      const updated = await res.json();
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status: updated.status } : r)));
    } catch (e) {
      alert(e.message || "Erro ao atualizar status");
      // revert on error
      setReports(prev => prev.map(r => (r._id === id ? { ...r, status: current } : r)));
    }
  }

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <Wrapper><Title>Acesso restrito</Title><p>Faça login para acessar.</p></Wrapper>;

  return (
    <Wrapper>
      <Title>Contas a Pagar</Title>
      <Table>
        <thead>
          <tr>
            <Th>Data</Th>
            <Th>Cliente</Th>
            <Th>Ação</Th>
            <Th>Vencimento</Th>
            <Th>Servidores</Th>
            <Th>PIX</Th>
            <Th>PDF</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report._id}>
              <Td>{report.reportDate ? new Date(report.reportDate).toLocaleDateString("pt-BR") : ""}</Td>
              <Td>{report.actionId?.client || ""}</Td>
              <Td>{report.actionId?.name || ""}</Td>
              <Td>{report.actionId?.dueDate ? new Date(report.actionId.dueDate).toLocaleDateString("pt-BR") : ""}</Td>
              <Td>
                {Array.isArray(report.actionId?.staff)
                  ? report.actionId.staff.map((s, idx) => (
                    <div key={report._id + "-staff-" + idx}>{s?.name || ""}</div>
                  ))
                  : ""}
              </Td>
              <Td>
                {Array.isArray(report.actionId?.staff)
                  ? report.actionId.staff.map((s, idx) => (
                    <div key={report._id + "-pix-" + idx}>{s?.pix || ""}</div>
                  ))
                  : ""}
              </Td>
              <Td>{report.pdfUrl ? <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">Download</a> : ""}</Td>
              <Td>
                {session.user.role === "admin" ? (
                  <select
                    value={(report.status || "ABERTO").toUpperCase()}
                    onChange={(e) => handleStatusChange(report._id, e.target.value, report.status || "ABERTO")}
                  >
                    <option value="ABERTO">ABERTO</option>
                    <option value="PAGO">PAGO</option>
                  </select>
                ) : (
                  (report.status || "ABERTO").toUpperCase()
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}
