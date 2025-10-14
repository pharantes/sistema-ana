"use client";
/* eslint-env browser */
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ClienteModal from '../../components/ClienteModal';
import * as FE from '../../components/FormElements';
import ClienteAcoesTable from "../components/ClienteAcoesTable";
import styled from 'styled-components';
import { RowWrap, ActionsInline } from '../../components/ui/primitives';
import { Loading } from '../../components/ui/primitives';

// use shared Table/Th/Td for consistency

/**
 * Fetches cliente data from API
 * @param {string} clienteId - Cliente ID
 * @returns {Promise<Object>} Cliente data
 * @throws {Error} If request fails
 */
async function fetchCliente(clienteId) {
  const response = await globalThis.fetch(`/api/cliente/${clienteId}`);
  if (!response.ok) throw new Error('Falha ao carregar cliente');
  return response.json();
}

/**
 * Fetches actions for a specific cliente
 * @param {string} clienteId - Cliente ID
 * @returns {Promise<Array>} Array of actions
 */
async function fetchClienteActions(clienteId) {
  try {
    const encodedId = encodeURIComponent(String(clienteId));
    const response = await globalThis.fetch(`/api/action?clientId=${encodedId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Updates cliente data via API
 * @param {Object} updatedData - Updated cliente data
 * @param {string} clienteId - Cliente ID
 * @returns {Promise<Object>} Updated cliente data
 * @throws {Error} If request fails
 */
async function updateCliente(updatedData, clienteId) {
  const response = await globalThis.fetch('/api/cliente', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updatedData, _id: clienteId })
  });

  if (!response.ok) throw new Error('Falha ao salvar');

  return fetchCliente(clienteId);
}

/**
 * Cliente details page with actions table
 */
export default function ClienteDetailsPage() {
  const params = useParams();
  const clienteId = params?.id;
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [cliente, setCliente] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clienteActions, setClienteActions] = useState([]);

  useEffect(() => {
    if (!clienteId) return;

    let isCancelled = false;

    (async () => {
      try {
        const clienteData = await fetchCliente(clienteId);
        if (isCancelled) return;
        setCliente(clienteData);

        // Fetch actions for this client
        const actionsList = await fetchClienteActions(clienteData._id);
        if (isCancelled) return;
        setClienteActions(actionsList);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error.message || 'Erro ao carregar');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [clienteId]);

  const PageWrap = styled.div`
  padding: 0;
  `;
  const HeaderRow = styled(RowWrap)`
    justify-content: space-between;
    margin-bottom: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
  `;
  const ButtonGroup = ActionsInline;
  const Grid2 = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: var(--gap-sm, var(--space-sm, var(--space-sm, 12px)));
  `;
  const H2 = styled.h2`
    margin-top: var(--space-md, var(--space-md, var(--space-md, 16px)));
    margin-bottom: var(--space-xxs, var(--gap-xs, var(--gap-xs, 6px)));
  `;

  const handleEditSubmit = async (updatedData) => {
    try {
      const freshData = await updateCliente(updatedData, cliente._id);
      setCliente(freshData);
      setIsEditModalOpen(false);
    } catch (error) {
      globalThis.alert(error.message || 'Erro ao salvar');
    }
  };

  if (sessionStatus === 'loading' || isLoading) {
    return <PageWrap><Loading /></PageWrap>;
  }

  if (errorMessage) {
    return <PageWrap>Erro: {errorMessage}</PageWrap>;
  }

  if (!cliente) {
    return <PageWrap>Cliente não encontrado</PageWrap>;
  }

  return (
    <PageWrap>
      <HeaderRow>
        <h1>Cliente</h1>
        <ButtonGroup>
          <FE.SecondaryButton onClick={() => router.back()}>
            Voltar
          </FE.SecondaryButton>
          <FE.Button onClick={() => setIsEditModalOpen(true)}>
            Editar
          </FE.Button>
        </ButtonGroup>
      </HeaderRow>
      <Grid2>
        <div><strong>Código</strong><div>{cliente.codigo}</div></div>
        <div><strong>Nome</strong><div>{cliente.nome}</div></div>
        <div><strong>Endereço</strong><div>{cliente.endereco}</div></div>
        <div><strong>Cidade</strong><div>{cliente.cidade}</div></div>
        <div><strong>UF</strong><div>{cliente.uf}</div></div>
        <div><strong>Telefone</strong><div>{cliente.telefone}</div></div>
        <div><strong>Email</strong><div>{cliente.email}</div></div>
        <div><strong>Contato</strong><div>{cliente.nomeContato}</div></div>
        <div><strong>Tipo</strong><div>{cliente.tipo}</div></div>
        <div><strong>CNPJ/CPF</strong><div>{cliente.cnpjCpf}</div></div>
      </Grid2>

      <H2>Ações deste cliente</H2>
      <ClienteAcoesTable actions={clienteActions} />

      {isEditModalOpen && (
        <ClienteModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initial={cliente}
          onSubmit={handleEditSubmit}
        />
      )}
    </PageWrap>
  );
}
