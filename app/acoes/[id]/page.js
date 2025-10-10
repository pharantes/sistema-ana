"use client";
/* eslint-env browser */
import { useEffect, useState, use as useUnwrap } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CostModal from '../../components/CostModal';
import * as FE from '../../components/FormElements';
import { useSession } from 'next-auth/react';
import styled from 'styled-components';
import { formatDateBR } from '@/lib/utils/dates';

const Wrapper = styled.div`
  padding: 24px;
`;
const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 12px;
`;
const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;
// Use shared FE buttons for consistent style
const Section = styled.div`
  margin: 16px 0;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 12px 24px;
`;
const Label = styled.div`
  font-weight: 600;
`;
const Value = styled.div`
  color: #222;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
`;
const Th = styled.th`
  text-align: left;
  border-bottom: 1px solid #ddd;
  padding: 8px;
`;
const Td = styled.td`
  padding: 8px;
`;


export default function ActionDetailsPage({ params }) {
  // Next.js 15: params is a Promise in client components
  const { id } = useUnwrap(params);
  const router = useRouter();
  const { data: session } = useSession();
  const ActionModal = dynamic(() => import('../../components/ActionModal'), { ssr: false });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [acao, setAcao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [costInitial, setCostInitial] = useState(null);
  const [costEditIndex, setCostEditIndex] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchAction() {
      setLoading(true);
      try {
        const res = await fetch(`/api/action/${id}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Falha ao carregar ação');
        }
        const data = await res.json();
        if (!cancelled) setAcao(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Erro ao carregar ação');
      }
      if (!cancelled) setLoading(false);
    }
    if (id) fetchAction();
    // fetch colaboradores for resolving linked nomes/empresa
    fetch('/api/colaborador').then(r => r.json()).then(setColaboradores).catch(() => setColaboradores([]));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Wrapper>Carregando…</Wrapper>;
  if (error) return <Wrapper>Erro: {error}</Wrapper>;
  if (!acao) return <Wrapper>Nenhuma ação encontrada.</Wrapper>;

  const criadoEm = formatDateBR(acao.date);
  const inicio = formatDateBR(acao.startDate);
  const fim = formatDateBR(acao.endDate);
  const venc = formatDateBR(acao.dueDate);

  const canEdit = session?.user?.role === 'admin' || (
    Array.isArray(acao?.staff) && acao.staff.map(s => s?.name).includes(session?.user?.username)
  );

  const openEdit = () => { setEditing(acao); setModalOpen(true); };
  const closeEdit = () => { setModalOpen(false); setEditing(null); };
  const handleModalSubmit = async (payload) => {
    try {
      const res = await fetch('/api/action/edit', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: acao._id, ...payload }) });
      if (!res.ok) throw new Error('Falha ao salvar');
      closeEdit();
      // refresh details
      const r = await fetch(`/api/action/${id}`);
      if (r.ok) setAcao(await r.json());
    } catch (e) {
      alert(e.message || 'Erro ao salvar ação');
    }
  };

  async function saveCost(payload) {
    try {
      let costs;
      if (costEditIndex != null) {
        const existing = Array.isArray(acao.costs) ? acao.costs : [];
        costs = existing.map((c, i) => (i === costEditIndex ? { ...c, ...payload } : c));
      } else {
        costs = [...(acao.costs || []), payload];
      }
      const res = await fetch('/api/action/edit', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: acao._id, costs }) });
      if (!res.ok) throw new Error('Falha ao salvar custo');
      setCostModalOpen(false);
      setCostInitial(null);
      setCostEditIndex(null);
      const r = await fetch(`/api/action/${id}`);
      if (r.ok) setAcao(await r.json());
    } catch (e) {
      alert(e.message || 'Erro ao salvar custo');
    }
  }

  async function deleteCost(index) {
    if (!globalThis.confirm('Tem certeza que deseja excluir este custo?')) return;
    try {
      const existing = Array.isArray(acao.costs) ? acao.costs : [];
      const costs = existing.filter((_, i) => i !== index);
      const res = await fetch('/api/action/edit', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: acao._id, costs }) });
      if (!res.ok) throw new Error('Falha ao excluir custo');
      const r = await fetch(`/api/action/${id}`);
      if (r.ok) setAcao(await r.json());
    } catch (e) {
      alert(e.message || 'Erro ao excluir custo');
    }
  }

  return (
    <Wrapper>
      <HeaderRow>
        <Title>Detalhes da Ação</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <FE.SecondaryButton onClick={() => router.back()} style={{ height: 40 }}>Voltar</FE.SecondaryButton>
          {canEdit && (
            <FE.Button onClick={openEdit} style={{ height: 40 }}>Editar</FE.Button>
          )}
        </div>
      </HeaderRow>

      <Section>
        <Grid>
          <div>
            <Label>Criado em</Label>
            <Value>{criadoEm}</Value>
          </div>
          <div>
            <Label>Evento</Label>
            <Value>{acao.name || acao.event || ''}</Value>
          </div>
          <div>
            <Label>Início</Label>
            <Value>{inicio}</Value>
          </div>
          <div>
            <Label>Fim</Label>
            <Value>{fim}</Value>
          </div>
          <div>
            <Label>Cliente</Label>
            <Value>{acao.clientName || acao.client || ''}</Value>
          </div>
          <div>
            <Label>Vencimento</Label>
            <Value>{venc}</Value>
          </div>
          <div>
            <Label>Pagamento</Label>
            <Value>{acao.paymentMethod || ''}</Value>
          </div>
          <div>
            <Label>Criado por</Label>
            <Value>{acao.createdBy || ''}</Value>
          </div>
        </Grid>
      </Section>

      <Section>
        <h3>Colaboradores</h3>
        <Table>
          <thead>
            <tr>
              <Th>Profissional</Th>
              <Th>Valor</Th>
              <Th>Pgt</Th>
              <Th>Banco/PIX</Th>
              <Th>Vencimento</Th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(acao.staff) ? acao.staff : []).map((s, idx) => (
              <tr key={`${acao._id}-s-${idx}`}>
                <Td>{s?.name || ''}</Td>
                <Td>{`R$ ${Number(s?.value || 0).toFixed(2)}`}</Td>
                <Td>{(s?.pgt || acao.paymentMethod || '')}</Td>
                <Td>{(() => {
                  const m = String(s?.pgt || acao.paymentMethod || '').toUpperCase();
                  const colab = colaboradores.find(v => String(v?.nome || '').toLowerCase() === String(s?.name || '').toLowerCase());
                  const pixVal = s?.pix || colab?.pix || '';
                  const bankVal = s?.bank || (colab ? `${colab.banco || ''}${colab.conta ? ` ${colab.conta}` : ''}`.trim() : '');
                  if (m === 'PIX') return pixVal;
                  if (m === 'TED') return bankVal;
                  return '';
                })()}</Td>
                <Td>{(s?.vencimento ? formatDateBR(s.vencimento) : formatDateBR(acao.dueDate))}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <Section>
        <h3>Custos extras</h3>
        <div style={{ marginTop: 8 }}>
          <FE.TopButton onClick={() => { setCostInitial({ vencimento: acao.dueDate ? String(acao.dueDate).slice(0, 10) : '' }); setCostEditIndex(null); setCostModalOpen(true); }}>Novo Custo</FE.TopButton>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Empresa</Th>
              <Th>Descrição</Th>
              <Th>Valor</Th>
              <Th>Pgt</Th>
              <Th>Banco/PIX</Th>
              <Th>Vencimento</Th>
              <Th>Opções</Th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(acao.costs) ? acao.costs : []).map((c, idx) => {
              const linkId = c?.colaboradorId || '';
              const sel = linkId ? colaboradores.find(s => String(s._id) === String(linkId)) : null;
              const nome = sel?.nome || c?.vendorName || '';
              const empresa = sel?.empresa || c?.vendorEmpresa || '';
              return (
                <tr key={`${acao._id}-c-${idx}`}>
                  <Td>{nome}</Td>
                  <Td>{empresa}</Td>
                  <Td>{c?.description || ''}</Td>
                  <Td>{`R$ ${Number(c?.value || 0).toFixed(2)}`}</Td>
                  <Td>{c?.pgt || ''}</Td>
                  <Td>{(() => { const m = String(c?.pgt || '').toUpperCase(); if (m === 'PIX') return c?.pix || ''; if (m === 'TED') return c?.bank || ''; return ''; })()}</Td>
                  <Td>{formatDateBR(c?.vencimento)}</Td>
                  <Td>
                    <FE.SecondaryButton onClick={() => { setCostInitial(c); setCostEditIndex(idx); setCostModalOpen(true); }}>Editar</FE.SecondaryButton>
                    <FE.InlineButton onClick={() => deleteCost(idx)}>Excluir</FE.InlineButton>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <CostModal open={costModalOpen} onClose={() => setCostModalOpen(false)} onSubmit={saveCost} initial={costInitial} />
      </Section>
      {modalOpen && (
        <ActionModal
          editing={editing}
          onClose={closeEdit}
          onSubmit={handleModalSubmit}
        />
      )}
    </Wrapper>
  );
}
