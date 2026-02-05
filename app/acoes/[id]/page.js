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
import StaffTable from "../components/StaffTable";
import CostsTable from "../components/CostsTable";
import { formatDateBR } from '@/lib/utils/dates';

// Styled components
const Value = styled.div` color: #222; `;
const Wrapper = styled.div` padding: var(--space-lg); `;
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
const Section = styled.div` margin: var(--space-sm) 0; `;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: var(--gap-sm) var(--space-lg);
`;
const Label = styled.div` font-weight: 600; `;
const ActionsWrap = styled(ActionsInline)` margin-top: var(--space-xs); `;

/**
 * Fetches action details from API
 */
async function fetchActionById(actionId) {
  const response = await fetch(`/api/action/${actionId}`);
  if (!response.ok) {
    throw new Error('Falha ao carregar ação');
  }
  return await response.json();
}

/**
 * Fetches all colaboradores from API
 */
async function fetchColaboradores() {
  try {
    const response = await fetch('/api/colaborador');
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Checks if user has permission to edit the action
 */
function canUserEditAction(action, userSession) {
  if (userSession?.user?.role === 'admin') {
    return true;
  }

  if (Array.isArray(action?.staff)) {
    const staffNames = action.staff.map(staffMember => staffMember?.name);
    return staffNames.includes(userSession?.user?.username);
  }

  return false;
}

/**
 * Updates an action via the API
 */
async function updateAction(actionId, payload) {
  const response = await fetch('/api/action/edit', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: actionId, ...payload })
  });

  if (!response.ok) {
    throw new Error('Falha ao salvar');
  }
}

/**
 * Updates costs array for an action
 */
async function updateActionCosts(actionId, costs) {
  const response = await fetch('/api/action/edit', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: actionId, costs })
  });

  if (!response.ok) {
    throw new Error('Falha ao salvar custo');
  }
}

/**
 * Builds updated costs array with new/edited cost
 */
function buildUpdatedCosts(existingCosts, newCostData, editIndex) {
  if (editIndex != null) {
    return existingCosts.map((cost, index) =>
      index === editIndex ? { ...cost, ...newCostData } : cost
    );
  }
  return [...existingCosts, newCostData];
}

/**
 * Builds updated costs array with cost removed
 */
function buildCostsWithRemoval(existingCosts, removeIndex) {
  return existingCosts.filter((_, index) => index !== removeIndex);
}


export default function ActionDetailsPage({ params }) {
  const { id: actionId } = useUnwrap(params);
  const router = useRouter();
  const { data: userSession } = useSession();
  const ActionModal = dynamic(() => import('../../components/ActionModal'), { ssr: false });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [action, setAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [initialCostData, setInitialCostData] = useState(null);
  const [editingCostIndex, setEditingCostIndex] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);

  useEffect(() => {
    let isCancelled = false;

    async function loadActionData() {
      setIsLoading(true);
      try {
        const actionData = await fetchActionById(actionId);
        if (!isCancelled) setAction(actionData);
      } catch (error) {
        if (!isCancelled) setErrorMessage(error.message || 'Erro ao carregar ação');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    async function loadColaboradores() {
      const colaboradoresData = await fetchColaboradores();
      if (!isCancelled) setColaboradores(colaboradoresData);
    }

    if (actionId) {
      loadActionData();
      loadColaboradores();
    }

    return () => { isCancelled = true; };
  }, [actionId]);

  if (isLoading) return <Wrapper>Carregando…</Wrapper>;
  if (errorMessage) return <Wrapper>Erro: {errorMessage}</Wrapper>;
  if (!action) return <Wrapper>Nenhuma ação encontrada.</Wrapper>;

  const createdDate = formatDateBR(action.date);
  const startDate = formatDateBR(action.startDate);
  const endDate = formatDateBR(action.endDate);
  const dueDate = formatDateBR(action.dueDate);

  const hasEditPermission = canUserEditAction(action, userSession);

  const openEditModal = () => {
    setEditingAction(action);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingAction(null);
  };

  const handleActionSubmit = async (payload) => {
    try {
      await updateAction(action._id, payload);
      closeEditModal();

      // Refresh action details
      const updatedAction = await fetchActionById(actionId);
      setAction(updatedAction);
    } catch (error) {
      alert(error.message || 'Erro ao salvar ação');
    }
  };

  async function handleCostSave(costPayload) {
    try {
      const existingCosts = Array.isArray(action.costs) ? action.costs : [];
      const updatedCosts = buildUpdatedCosts(existingCosts, costPayload, editingCostIndex);

      await updateActionCosts(action._id, updatedCosts);

      setIsCostModalOpen(false);
      setInitialCostData(null);
      setEditingCostIndex(null);

      // Refresh action details
      const updatedAction = await fetchActionById(actionId);
      setAction(updatedAction);
    } catch (error) {
      alert(error.message || 'Erro ao salvar custo');
    }
  }

  async function handleCostDelete(costIndex) {
    if (!globalThis.confirm('Tem certeza que deseja excluir este custo?')) return;

    try {
      const existingCosts = Array.isArray(action.costs) ? action.costs : [];
      const updatedCosts = buildCostsWithRemoval(existingCosts, costIndex);

      await updateActionCosts(action._id, updatedCosts);

      // Refresh action details
      const updatedAction = await fetchActionById(actionId);
      setAction(updatedAction);
    } catch (error) {
      alert(error.message || 'Erro ao excluir custo');
    }
  }

  function openNewCostModal() {
    const defaultVencimento = action.dueDate
      ? String(action.dueDate).slice(0, 10)
      : '';
    setInitialCostData({ vencimento: defaultVencimento });
    setEditingCostIndex(null);
    setIsCostModalOpen(true);
  }

  function openEditCostModal(costData, costIndex) {
    setInitialCostData(costData);
    setEditingCostIndex(costIndex);
    setIsCostModalOpen(true);
  }

  return (
    <Wrapper>
      <HeaderRow>
        <Title>Detalhes da Ação</Title>
        <ButtonGroup>
          <FE.SecondaryButton onClick={() => router.back()}>Voltar</FE.SecondaryButton>
          {hasEditPermission && (
            <FE.Button onClick={openEditModal}>Editar</FE.Button>
          )}
        </ButtonGroup>
      </HeaderRow>

      <Section>
        <Grid>
          <div>
            <Label>Criado em</Label>
            <Value>{createdDate}</Value>
          </div>
          <div>
            <Label>Evento</Label>
            <Value>{action.name || action.event || ''}</Value>
          </div>
          <div>
            <Label>Início</Label>
            <Value>{startDate}</Value>
          </div>
          <div>
            <Label>Fim</Label>
            <Value>{endDate}</Value>
          </div>
          <div>
            <Label>Cliente</Label>
            <Value>{action.clientName || action.client || ''}</Value>
          </div>
          <div>
            <Label>Vencimento</Label>
            <Value>{dueDate}</Value>
          </div>
          <div>
            <Label>Pagamento</Label>
            <Value>{action.paymentMethod || ''}</Value>
          </div>
          <div>
            <Label>Criado por</Label>
            <Value>{action.createdBy || ''}</Value>
          </div>
        </Grid>
      </Section>

      <Section>
        <h3>Colaboradores</h3>
        <StaffTable
          acao={action}
          staff={action.staff}
          colaboradores={colaboradores}
        />
      </Section>

      <Section>
        <h3>Custos extras</h3>
        <ActionsWrap>
          <FE.TopButton onClick={openNewCostModal}>
            Novo Custo
          </FE.TopButton>
        </ActionsWrap>
        <CostsTable
          acao={action}
          costs={action.costs}
          colaboradores={colaboradores}
          onEdit={openEditCostModal}
          onDelete={handleCostDelete}
        />
        <CostModal
          open={isCostModalOpen}
          onClose={() => setIsCostModalOpen(false)}
          onSubmit={handleCostSave}
          initial={initialCostData}
        />
      </Section>

      {isModalOpen && (
        <ActionModal
          editing={editingAction}
          onClose={closeEditModal}
          onSubmit={handleActionSubmit}
        />
      )}
    </Wrapper>
  );
}
