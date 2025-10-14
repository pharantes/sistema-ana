"use client";
/* eslint-env browser */
import { useEffect, useState, use as useUnwrap } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CostModal from '../../components/CostModal';
import * as FE from '../../components/FormElements';
import { useSession } from 'next-auth/react';
import styled from 'styled-components';
import { ActionsInline } from '../../components/ui/primitives';
// Table extracted into components
import StaffTable from "../components/StaffTable";
import CostsTable from "../components/CostsTable";
import { formatDateBR } from '@/lib/utils/dates';
// Local styled value (avoid importing internals from react-select which breaks Next.js exports)
const Value = styled.div` color: #222; `;
const Wrapper = styled.div`
  padding: var(--space-lg);
`;
const Title = styled.h1`
  font-size: var(--font-h2);
  margin-bottom: var(--space-sm);
`;
const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-sm);
`;
const ButtonGroup = ActionsInline;
// Use shared FE buttons for consistent style
const Section = styled.div`
  margin: var(--space-sm) 0;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: var(--gap-sm) var(--space-lg);
`;
const Label = styled.div`
  font-weight: 600;
`;
const ActionsWrap = styled(ActionsInline)`
  margin-top: var(--space-xs);
`;
// Use shared Table, Th, Td (with zebra striping)


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
        <ButtonGroup>
          <FE.SecondaryButton onClick={() => router.back()}>Voltar</FE.SecondaryButton>
          {canEdit && (
            <FE.Button onClick={openEdit}>Editar</FE.Button>
          )}
        </ButtonGroup>
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
        <StaffTable acao={acao} staff={acao.staff} colaboradores={colaboradores} />
      </Section>

      <Section>
        <h3>Custos extras</h3>
        <ActionsWrap>
          <FE.TopButton onClick={() => { setCostInitial({ vencimento: acao.dueDate ? String(acao.dueDate).slice(0, 10) : '' }); setCostEditIndex(null); setCostModalOpen(true); }}>Novo Custo</FE.TopButton>
        </ActionsWrap>
        <CostsTable
          acao={acao}
          costs={acao.costs}
          colaboradores={colaboradores}
          onEdit={(c, idx) => { setCostInitial(c); setCostEditIndex(idx); setCostModalOpen(true); }}
          onDelete={(idx) => deleteCost(idx)}
        />
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
