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
const Section = styled.div`
  margin-top: var(--space-lg, 24px);
  h3 {
    font-size: 1.2rem;
    margin-bottom: var(--space-sm, 12px);
  }
`;
const ActionsList = styled.ul`
  list-style: none;
  padding: 0;
  li {
    padding: var(--space-xs, 8px) 0;
    border-bottom: 1px solid #eee;
    &:last-child {
      border-bottom: none;
    }
  }
`;

/**
 * Fetches receivable data by receivable ID
 * @param {string} id - Receivable ID
 * @returns {Promise<Object|null>} Receivable object or null
 * @throws {Error} If fetch fails
 */
async function fetchReceivableById(id) {
  const url = new URL('/api/contasareceber', globalThis.location.origin);
  url.searchParams.set('id', id);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Falha ao carregar recebível');

  const data = await response.json();
  const itemsArray = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return itemsArray[0] || null;
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
 * Receivable detail page showing receivable information with multiple actions
 * @param {Object} props - Component props
 * @param {Object} props.params - Route parameters
 */
export default function RecebivelDetailPage({ params }) {
  const { id } = useUnwrap(params);
  const router = useRouter();
  const [receivable, setReceivable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadReceivable() {
      setLoading(true);
      try {
        const data = await fetchReceivableById(id);
        if (!isCancelled) {
          setReceivable(data);
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

    if (id) {
      loadReceivable();
    }

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleSaved = async () => {
    setModalOpen(false);
    try {
      const updatedData = await fetchReceivableById(id);
      setReceivable(updatedData);
    } catch {
      // Silently fail - data will be stale but modal closed
    }
  };

  if (loading) return <Wrapper><Loading /></Wrapper>;
  if (error) return <Wrapper>Erro: {error}</Wrapper>;
  if (!receivable) return <Wrapper>Nada encontrado.</Wrapper>;

  const dueDate = formatDateBR(receivable?.dataVencimento);
  const createdAt = formatDateTimeBR(receivable?.createdAt);
  const hasInstallments = receivable?.qtdeParcela && Number(receivable.qtdeParcela) > 1;

  return (
    <Wrapper>
      <HeaderRow>
        <Title>Conta a Receber</Title>
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
        <div><Label>Cliente</Label><Value>{receivable?.clientName || ''}</Value></div>
        <div><Label>Data Vencimento</Label><Value>{dueDate}</Value></div>
        <div><Label>Parcelado</Label><Value>{hasInstallments ? 'Sim' : 'Não'}</Value></div>
        <div><Label>Valor total</Label><Value>{formatCurrencyBRL(receivable?.valor)}</Value></div>
        <div><Label>Valor Parcela</Label><Value>{formatCurrencyBRL(receivable?.valorParcela)}</Value></div>
        <div><Label>Criado em</Label><Value>{createdAt}</Value></div>
        <div><Label>Status</Label><Value>{receivable?.status || 'ABERTO'}</Value></div>
      </Grid>

      <Section>
        <h3>Ações Vinculadas</h3>
        {Array.isArray(receivable.actions) && receivable.actions.length > 0 ? (
          <ActionsList>
            {receivable.actions.map(action => (
              <li key={action._id}>
                <strong>{action.name || action.event || 'Sem nome'}</strong>
                {action.date && ` - ${formatDateBR(action.date)}`}
              </li>
            ))}
          </ActionsList>
        ) : (
          <p>Nenhuma ação vinculada.</p>
        )}
      </Section>

      <ContasReceberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        action={null}
        receivable={receivable}
        clienteDetails={receivable?.clienteDetails || null}
        onSaved={handleSaved}
      />
    </Wrapper>
  );
}
