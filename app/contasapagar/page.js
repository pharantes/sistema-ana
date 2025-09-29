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

  async function handleDelete(id) {
    setLoading(true);
    await fetch("/api/contasapagar", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchReports();
    setLoading(false);
  }

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <Wrapper><Title>Acesso restrito</Title><p>Faça login para acessar.</p></Wrapper>;

  return (
    <Wrapper>
      <Title>Contas a Pagar</Title>
      <Table>
        <thead>
          <tr>
            <Th>Data do Relatório</Th>
            <Th>Ação</Th>
            <Th>PDF</Th>
            {session.user.role === "admin" && <Th>Ações</Th>}
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report._id}>
              <Td>{report.reportDate ? new Date(report.reportDate).toLocaleDateString("pt-BR") : ""}</Td>
              <Td>{report.actionId?.name || ""}</Td>
              <Td>{report.pdfUrl ? <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">Download</a> : ""}</Td>
              {session.user.role === "admin" && (
                <Td>
                  <button onClick={() => handleDelete(report._id)}>Excluir</button>
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}
