"use client";
/* eslint-env browser */
import { useEffect, useState, use as useUnwrap } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { RowWrap, ActionsInline, Loading } from '../../components/ui/primitives';
import ContasReceberModal from '../ContasReceberModal';
import { formatDateBR, formatDateTimeBR } from '@/lib/utils/dates';
import { formatBRL } from '../../utils/currency';
import * as FE from '../../components/FormElements';

const Wrapper = styled.div`
  padding: var(--page-padding);
`;
const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-sm, var(--space-sm, var(--space-sm, 12px)));
`;
const HeaderRow = RowWrap;
const ActionButtons = ActionsInline;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: var(--gap-sm, var(--space-sm, var(--space-sm, 12px))) var(--space-lg, 24px);
`;
const Label = styled.div` font-weight: 600; `;
const Value = styled.div` color: #222; `;
const ClientSection = styled.div`
  margin-top: var(--space-sm);
`;
const ClientGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: var(--gap-sm) var(--space-lg);
`;

/**
 * Fetches receivable data by action ID
 * @param {string} actionId - Action ID
 * @returns {Promise<Object|null>} Receivable row or null
 * @throws {Error} If fetch fails
 */
async function fetchReceivableByActionId(actionId) {
  const url = new URL('/api/contasareceber', globalThis.location.origin);
  url.searchParams.set('actionId', actionId);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Falha ao carregar recebível');

  const data = await response.json();
  const itemsArray = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return itemsArray.find(r => String(r._id) === String(actionId)) || itemsArray[0] || null;
}

/**
 * Formats currency value with BRL prefix
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string
 */
function formatCurrencyBRL(value) {
  if (value == null) return '';
  return `R$ ${formatBRL(Number(value))}`;
}

/**
 * Receivable detail page showing single action's receivable information
 * @param {Object} props - Component props
 * @param {Object} props.params - Route parameters
 */
export default function RecebivelDetailPage({ params }) {
  const { actionId } = useUnwrap(params);
  const router = useRouter();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadReceivable() {
      setLoading(true);
      try {
        const receivableData = await fetchReceivableByActionId(actionId);
        if (!isCancelled) {
          setRow(receivableData);
        }
      } catch (error) {
        if (!isCancelled) {
          setError(error.message || 'Erro ao carregar');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    if (actionId) {
      loadReceivable();
    }

    return () => {
      isCancelled = true;
    };
  }, [actionId]);

  const handleSaved = async () => {
    setModalOpen(false);
    try {
      const updatedData = await fetchReceivableByActionId(actionId);
      setRow(updatedData);
    } catch {
      // Silently fail - data will be stale but modal closed
    }
  };

  if (loading) return <Wrapper><Loading /></Wrapper>;
  if (error) return <Wrapper>Erro: {error}</Wrapper>;
  if (!row) return <Wrapper>Nada encontrado.</Wrapper>;

  const receivable = row.receivable || {};
  const actionDate = formatDateBR(row?.date);
  const dueDate = formatDateBR(receivable?.dataVencimento);
  const receivedDate = formatDateBR(receivable?.dataRecebimento);
  const documentDate = formatDateBR(receivable?.reportDate);
  const createdAt = formatDateTimeBR(receivable?.createdAt);
  const updatedAt = formatDateTimeBR(receivable?.updatedAt);

  return (
    <Wrapper>
      <HeaderRow>
        <Title>Recebível</Title>
        <ActionButtons>
          <FE.SecondaryButton onClick={() => router.push('/contasareceber')}>
            Voltar
          </FE.SecondaryButton>
          <FE.Button onClick={() => setModalOpen(true)}>
            Editar
          </FE.Button>
        </ActionButtons>
      </HeaderRow>
      <Grid>
        <div><Label>ID</Label><Value>{row?._id || ''}</Value></div>
        <div><Label>Data do documento</Label><Value>{documentDate}</Value></div>
        <div><Label>Data</Label><Value>{actionDate}</Value></div>
        <div><Label>Status</Label><Value>{receivable?.status || 'ABERTO'}</Value></div>
        <div><Label>Ação</Label><Value>{row?.name || ''}</Value></div>
        <div><Label>Cliente</Label><Value>{row?.clientName || ''}</Value></div>
        <div><Label>Valor total</Label><Value>{formatCurrencyBRL(receivable?.valor)}</Value></div>
        <div><Label>Descrição</Label><Value>{receivable?.descricao || ''}</Value></div>
        <div><Label>Qtde Parcela</Label><Value>{receivable?.qtdeParcela ?? ''}</Value></div>
        <div><Label>Valor Parcela</Label><Value>{formatCurrencyBRL(receivable?.valorParcela)}</Value></div>
        <div><Label>Data Vencimento</Label><Value>{dueDate}</Value></div>
        <div><Label>Data Recebimento</Label><Value>{receivedDate}</Value></div>
        <div><Label>Banco (Recebido pelo banco)</Label><Value>{receivable?.banco || ''}</Value></div>
        <div><Label>Conta (Cliente no registro)</Label><Value>{receivable?.conta || ''}</Value></div>
        <div><Label>Forma Pgt (Cliente no registro)</Label><Value>{receivable?.formaPgt || ''}</Value></div>
        <div><Label>Criado em</Label><Value>{createdAt}</Value></div>
        <div><Label>Atualizado em</Label><Value>{updatedAt}</Value></div>
      </Grid>
      <ClientSection>
        <h3>Dados do Cliente (atual)</h3>
        <ClientGrid>
          <div><Label>PIX</Label><Value>{row?.clienteDetails?.pix || ''}</Value></div>
          <div><Label>Banco</Label><Value>{row?.clienteDetails?.banco || ''}</Value></div>
          <div><Label>Conta</Label><Value>{row?.clienteDetails?.conta || ''}</Value></div>
          <div><Label>Forma Pgt</Label><Value>{row?.clienteDetails?.formaPgt || ''}</Value></div>
        </ClientGrid>
      </ClientSection>
      <ContasReceberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        action={row}
        receivable={row?.receivable || null}
        clienteDetails={row?.clienteDetails || null}
        onSaved={handleSaved}
      />
    </Wrapper>
  );
}
