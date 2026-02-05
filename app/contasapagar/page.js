"use client";
/* eslint-env browser */
import styled from "styled-components";
import { Note as SmallNote, InputWrap, RowWrap, RowEnd, RowTopGap, RowInline } from '../components/ui/primitives';
import Filters from "./Filters";
import ContasFixasTable from "./components/ContasFixasTable";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useRef } from "react";
import * as FE from "../components/FormElements";
import { formatBRL, parseCurrency } from "../utils/currency";
import { formatDateBR } from "@/lib/utils/dates";
import BRDateInput from "../components/BRDateInput";
import BRCurrencyInput from "../components/BRCurrencyInput";
import ErrorModal from "../components/ErrorModal";
import AcoesTable from "./components/AcoesTable";
import { gerarPDFAcoes as gerarPDFAcoesUtil, gerarContasAPagarPDF } from "./utils/pdf";

const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;
const Wrapper = styled.div`
  padding: var(--page-padding);
`;
const PageSection = styled.div`
  margin-top: var(--space-sm);
`;
const SearchRow = styled(RowWrap)`
  justify-content: space-between;
  gap: var(--gap-sm);
  align-items: end;
  flex-wrap: wrap;
  margin-top: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;
const SearchCol = styled.div`
  display:flex;
  flex-direction: column;
  gap: var(--gap-xs);
  min-width: var(--min-col-width, 280px);
  flex: 1 1 320px;
`;
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display:flex; align-items:center; justify-content:center; z-index:50;
`;
const ModalCard = styled.div`
  background: #fff; padding: var(--space-md, var(--space-md, 16px)); border-radius: var(--radius-md); width: var(--modal-min-width, 420px); max-width: 90%;
`;
const ModalGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: var(--gap-xs); margin-top: var(--space-xs);
`;
const ModalField = styled(InputWrap)`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs, var(--space-xxs, var(--space-xxs, 4px)));
`;
const H2 = styled.h2`
  margin-top: var(--space-sm);
`;
const H2Large = styled.h2`
  margin-top: var(--space-lg);
`;
const SmallSecondaryButton = styled(FE.SecondaryButton)`
  height: var(--control-height, 36px);
`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Builds the API URL for fetching contas a pagar with optional date filters.
 * @param {string} fromDate - Start date filter (YYYY-MM-DD)
 * @param {string} toDate - End date filter (YYYY-MM-DD)
 * @returns {string} The constructed API URL
 */
function buildContasAPagarUrl(fromDate, toDate) {
  const params = new URLSearchParams();
  if (fromDate) params.set('vencFrom', fromDate);
  if (toDate) params.set('vencTo', toDate);
  return "/api/contasapagar" + (params.toString() ? `?${params.toString()}` : "");
}

/**
 * Converts a date value to milliseconds timestamp for comparison.
 * Handles ISO, YYYY-MM-DD, and DD/MM/YYYY formats.
 * @param {Date|string|null} dateValue - The date to convert
 * @returns {number} Timestamp in milliseconds, or 0 if invalid
 */
function dateToTime(dateValue) {
  if (!dateValue) return 0;
  try {
    if (dateValue instanceof Date && !isNaN(dateValue)) return dateValue.getTime();
    const dateString = String(dateValue);
    // ISO or YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const parsedDate = new Date(dateString);
      return isNaN(parsedDate) ? 0 : parsedDate.getTime();
    }
    // DD/MM/YYYY
    const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const parsedDate = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      return isNaN(parsedDate) ? 0 : parsedDate.getTime();
    }
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate) ? 0 : parsedDate.getTime();
  } catch {
    return 0;
  }
}

/**
 * Gets the cycle duration in days based on account type.
 * @param {string} accountType - The account type ('quizenal' or 'mensal')
 * @returns {number} Number of days in the cycle (15 or 30)
 */
function getCycleDays(accountType) {
  return String(accountType) === 'quizenal' ? 15 : 30;
}

/**
 * Calculates the next due date for a fixed account based on its cycle.
 * @param {object} fixedAccount - The fixed account object
 * @returns {Date|null} The next due date, or null if cannot be calculated
 */
function getNextDueDate(fixedAccount) {
  const baseDate = fixedAccount?.lastPaidAt
    ? new Date(fixedAccount.lastPaidAt)
    : (fixedAccount?.createdAt ? new Date(fixedAccount.createdAt) : null);
  if (!baseDate) return null;
  const cycleDays = getCycleDays(fixedAccount?.tipo);
  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + cycleDays);
  return dueDate;
}

/**
 * Gets the display status for a fixed account (auto-transitions from PAGO to ABERTO after cycle).
 * @param {object} fixedAccount - The fixed account object
 * @returns {string} The display status ('ABERTO' or 'PAGO')
 */
function getDisplayStatus(fixedAccount) {
  // TODO: REVIEW - This logic assumes that if status is not 'PAGO', it is always 'ABERTO'.
  // If new statuses are added in the future, this may break.
  const rawStatus = String(fixedAccount?.status || 'ABERTO').toUpperCase();
  if (rawStatus !== 'PAGO') return 'ABERTO';
  const nextDueDate = getNextDueDate(fixedAccount);
  if (!nextDueDate) return 'ABERTO';
  return (new Date() < nextDueDate) ? 'PAGO' : 'ABERTO';
}

/**
 * Extracts the due date from a report row by checking staff or cost data.
 * @param {object} reportRow - The report row object
 * @returns {string|null} The due date, or null if not found
 */
function getRowDueDate(reportRow) {
  if (!reportRow || !reportRow.actionId) return null;
  const staffList = Array.isArray(reportRow.actionId?.staff) ? reportRow.actionId.staff : [];
  const costsList = Array.isArray(reportRow.actionId?.costs) ? reportRow.actionId.costs : [];
  const staffItem = reportRow.staffName ? staffList.find(s => s.name === reportRow.staffName) : null;
  const costItem = (!reportRow.staffName && reportRow.costId)
    ? costsList.find(c => String(c._id) === String(reportRow.costId))
    : null;
  return staffItem?.vencimento || costItem?.vencimento || null;
}

/**
 * Checks if a report row matches the search query.
 * @param {object} reportRow - The report row to check
 * @param {string} queryLowerCase - The search query in lowercase
 * @returns {boolean} True if the row matches the query
 */
function rowMatchesQuery(reportRow, queryLowerCase) {
  if (!queryLowerCase) return true;
  const clienteName = String(reportRow?.actionId?.client || "").toLowerCase();
  const actionName = String(reportRow?.actionId?.name || "").toLowerCase();
  let serviceText = String(reportRow?.staffName || "").toLowerCase();
  if (!reportRow?.staffName && reportRow?.costId && Array.isArray(reportRow?.actionId?.costs)) {
    const costItem = reportRow.actionId.costs.find(c => String(c._id) === String(reportRow.costId));
    if (costItem && costItem.description) serviceText = String(costItem.description).toLowerCase();
  }
  return clienteName.includes(queryLowerCase)
    || actionName.includes(queryLowerCase)
    || serviceText.includes(queryLowerCase);
}

/**
 * Applies status filter to a list of report rows.
 * @param {Array} reportList - The list of report rows
 * @param {string} statusFilterValue - The status filter ('ALL', 'ABERTO', or 'PAGO')
 * @returns {Array} The filtered list
 */
function applyStatusFilter(reportList, statusFilterValue) {
  if (statusFilterValue === 'ABERTO' || statusFilterValue === 'PAGO') {
    return reportList.filter(r => (String(r?.status || 'ABERTO').toUpperCase() === statusFilterValue));
  }
  return reportList;
}

/**
 * Gets the value for a given sort key from a report row.
 * @param {object} reportRow - The report row
 * @param {string} sortKey - The sort key ('created', 'acao', 'colaborador', or 'due')
 * @returns {number|string} The extracted value for sorting
 */
function valueForSortKey(reportRow, sortKey) {
  if (!reportRow) return '';
  switch (sortKey) {
    case 'created': {
      const baseDate = reportRow?.actionId?.date || reportRow?.reportDate || null;
      return dateToTime(baseDate);
    }
    case 'acao':
      return String(reportRow?.actionId?.name || reportRow?.actionId?.event || '').toLowerCase();
    case 'colaborador':
      if (reportRow?.staffName) return String(reportRow?.colaboradorLabel || reportRow?.staffName || '').toLowerCase();
      if (reportRow?.costId) return String(reportRow?.colaboradorLabel || '').toLowerCase();
      return '';
    case 'descricao': {
      // Get description from cost item
      if (!reportRow.staffName && reportRow.costId) {
        const costsList = Array.isArray(reportRow.actionId?.costs) ? reportRow.actionId.costs : [];
        const costItem = costsList.find(c => String(c._id) === String(reportRow.costId));
        return String(costItem?.description || '').toLowerCase();
      }
      return '';
    }
    case 'due': {
      const dueDate = getRowDueDate(reportRow);
      return dateToTime(dueDate);
    }
    case 'valor': {
      // Get value from staff or cost
      const staffList = Array.isArray(reportRow.actionId?.staff) ? reportRow.actionId.staff : [];
      const costsList = Array.isArray(reportRow.actionId?.costs) ? reportRow.actionId.costs : [];
      const staffItem = reportRow.staffName ? staffList.find(s => s.name === reportRow.staffName) : null;
      const costItem = (!reportRow.staffName && reportRow.costId)
        ? costsList.find(c => String(c._id) === String(reportRow.costId))
        : null;
      const valueAmount = (staffItem && typeof staffItem.value !== 'undefined')
        ? Number(staffItem.value)
        : (costItem && typeof costItem.value !== 'undefined')
          ? Number(costItem.value)
          : 0;
      return valueAmount;
    }
    case 'pgt': {
      // Get payment type from staff or cost
      const staffList = Array.isArray(reportRow.actionId?.staff) ? reportRow.actionId.staff : [];
      const costsList = Array.isArray(reportRow.actionId?.costs) ? reportRow.actionId.costs : [];
      const staffItem = reportRow.staffName ? staffList.find(s => s.name === reportRow.staffName) : null;
      const costItem = (!reportRow.staffName && reportRow.costId)
        ? costsList.find(c => String(c._id) === String(reportRow.costId))
        : null;
      return String(staffItem?.pgt || costItem?.pgt || '').toLowerCase();
    }
    case 'pix': {
      // Get PIX from staff, cost, or colaborador
      const staffList = Array.isArray(reportRow.actionId?.staff) ? reportRow.actionId.staff : [];
      const costsList = Array.isArray(reportRow.actionId?.costs) ? reportRow.actionId.costs : [];
      const staffItem = reportRow.staffName ? staffList.find(s => s.name === reportRow.staffName) : null;
      const costItem = (!reportRow.staffName && reportRow.costId)
        ? costsList.find(c => String(c._id) === String(reportRow.costId))
        : null;
      const colaboradorInfo = reportRow?.colaboradorData;
      return String(staffItem?.pix || costItem?.pix || colaboradorInfo?.pix || '').toLowerCase();
    }
    case 'banco': {
      // Get bank from staff, cost, or colaborador
      const staffList = Array.isArray(reportRow.actionId?.staff) ? reportRow.actionId.staff : [];
      const costsList = Array.isArray(reportRow.actionId?.costs) ? reportRow.actionId.costs : [];
      const staffItem = reportRow.staffName ? staffList.find(s => s.name === reportRow.staffName) : null;
      const costItem = (!reportRow.staffName && reportRow.costId)
        ? costsList.find(c => String(c._id) === String(reportRow.costId))
        : null;
      const colaboradorInfo = reportRow?.colaboradorData;
      return String(staffItem?.bank || costItem?.bank || colaboradorInfo?.banco || '').toLowerCase();
    }
    case 'status':
      return String(reportRow?.status || 'ABERTO').toLowerCase();
    default:
      return '';
  }
}

/**
 * Compares two report rows for sorting.
 * @param {object} rowA - First row
 * @param {object} rowB - Second row
 * @param {string} sortKey - The sort key
 * @param {string} sortDirection - Sort direction ('asc' or 'desc')
 * @returns {number} Comparison result (-1, 0, or 1)
 */
function compareRows(rowA, rowB, sortKey, sortDirection) {
  const valueA = valueForSortKey(rowA, sortKey);
  const valueB = valueForSortKey(rowB, sortKey);
  if (typeof valueA === 'number' && typeof valueB === 'number') {
    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
  }
  const stringA = String(valueA || '');
  const stringB = String(valueB || '');
  const comparison = stringA.localeCompare(stringB);
  if (comparison === 0) {
    // Tie-break by created date for stable ordering
    const timeA = dateToTime(rowA?.actionId?.date || rowA?.reportDate);
    const timeB = dateToTime(rowB?.actionId?.date || rowB?.reportDate);
    return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
  }
  return sortDirection === 'asc' ? comparison : -comparison;
}

/**
 * Gets the sort value for a fixed account based on the sort key.
 * @param {object} fixedAccount - The fixed account object
 * @param {string} sortKey - The sort key
 * @returns {number|string} The extracted value for sorting
 */
function getFixedAccountSortValue(fixedAccount, sortKey) {
  switch (sortKey) {
    case 'nome': return String(fixedAccount?.name || '').toLowerCase();
    case 'empresa': return String(fixedAccount?.empresa || '').toLowerCase();
    case 'tipo': return String(fixedAccount?.tipo || '').toLowerCase();
    case 'valor': return Number(fixedAccount?.valor || 0);
    case 'status': return String(getDisplayStatus(fixedAccount) || '').toLowerCase();
    case 'vencimento':
    default:
      return dateToTime(fixedAccount?.vencimento);
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Main page component for 'Contas a Pagar' (Accounts Payable).
 * Manages accounts payable data, fixed accounts, filtering, sorting, and PDF generation.
 */
export default function ContasAPagarPage() {
  // --- State Hooks ---
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [fixas, setFixas] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageAcoes, setPageAcoes] = useState(1);
  const [pageSizeAcoes, setPageSizeAcoes] = useState(10);
  const [sortKeyAcoes, setSortKeyAcoes] = useState('created');
  const [sortDirAcoes, setSortDirAcoes] = useState('desc');
  const [pageFixas, setPageFixas] = useState(1);
  const [pageSizeFixas, setPageSizeFixas] = useState(10);
  const [sortKeyFixas, setSortKeyFixas] = useState('vencimento');
  const [sortDirFixas, setSortDirFixas] = useState('asc');
  const [showFixaModal, setShowFixaModal] = useState(false);
  const [fixaForm, setFixaForm] = useState({
    name: '',
    empresa: '',
    tipo: 'mensal',
    valor: '',
    status: 'ABERTO',
    vencimento: ''
  });
  const [fixaEditing, setFixaEditing] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const inputRef = useRef(null);
  const inputSx = { height: 36 };

  // --- Helper Functions ---

  /**
   * Fetches the list of contas a pagar from the API with date filters.
   */
  async function fetchReports() {
    try {
      const url = buildContasAPagarUrl(dueFrom, dueTo);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Erro ao carregar contas a pagar");
      }
      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorModal({ open: true, message: error.message || "Falha ao carregar contas a pagar" });
      setReports([]);
    }
  }

  /**
   * Fetches the list of fixed accounts (contas fixas) from the API.
   */
  async function fetchFixas() {
    try {
      const response = await fetch('/api/contafixa');
      if (!response.ok) throw new Error('Falha ao carregar contas fixas');
      const data = await response.json();
      setFixas(Array.isArray(data) ? data : []);
    } catch {
      setFixas([]);
    }
  }

  /**
   * Clears all filters and resets the search input.
   */
  const handleClearAll = () => {
    setSearchQuery("");
    setDueFrom("");
    setDueTo("");
    setStatusFilter('ALL');
    try { inputRef.current?.focus(); } catch { /* noop */ }
  };

  // --- Effects ---

  useEffect(() => {
    try { inputRef.current?.focus(); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [dueFrom, dueTo]);

  useEffect(() => {
    fetchReports();
    fetchFixas();
  }, []);

  /**
   * Handles status change for a contas a pagar row with optimistic UI update.
   * @param {string} reportId - The report ID
   * @param {string} newStatus - The new status value
   * @param {string} previousStatus - The previous status (for revert on error)
   */
  async function handleStatusChange(reportId, newStatus, previousStatus) {
    if (!session || session.user.role !== "admin") return;
    // Optimistic update
    setReports(previousReports => previousReports.map(report =>
      (report._id === reportId ? { ...report, status: newStatus } : report)
    ));
    try {
      const response = await fetch("/api/contasapagar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: reportId, status: newStatus })
      });
      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }
      const updatedReport = await response.json();
      setReports(previousReports => previousReports.map(report =>
        (report._id === reportId ? { ...report, status: updatedReport.status } : report)
      ));
    } catch (error) {
      setErrorModal({ open: true, message: error.message || "Erro ao atualizar status" });
      // Revert on error
      setReports(previousReports => previousReports.map(report =>
        (report._id === reportId ? { ...report, status: previousStatus } : report)
      ));
    }
  }

  /**
   * Handles status change for a fixed account with optimistic UI update.
   * @param {object} fixedAccount - The fixed account object
   * @param {string} newStatusValue - The new status value
   */
  async function handleFixaStatusChange(fixedAccount, newStatusValue) {
    const newStatus = String(newStatusValue || '').toUpperCase();
    const timestamp = new Date().toISOString();
    // Optimistic update
    setFixas(previousFixas => previousFixas.map(fixa =>
      fixa._id === fixedAccount._id
        ? { ...fixa, status: newStatus, lastPaidAt: (newStatus === 'PAGO' ? timestamp : undefined) }
        : fixa
    ));
    try {
      const patchData = { id: fixedAccount._id, status: newStatus };
      if (newStatus === 'PAGO') {
        patchData.lastPaidAt = timestamp;
      } else {
        patchData.lastPaidAt = null;
      }
      const response = await fetch('/api/contafixa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
      });
      if (!response.ok) throw new Error('Falha ao atualizar status');
      const updatedAccount = await response.json();
      setFixas(previousFixas => previousFixas.map(fixa =>
        fixa._id === fixedAccount._id ? updatedAccount : fixa
      ));
    } catch (error) {
      setErrorModal({ open: true, message: error.message || 'Erro ao atualizar status' });
      fetchFixas();
    }
  }

  // --- Data Processing (Filtering & Sorting) ---

  /**
   * Filters and sorts the accounts payable reports based on search query and status.
   */
  const filteredReports = useMemo(() => {
    const queryLowerCase = (searchQuery || "").trim().toLowerCase();
    const reportsArray = Array.isArray(reports) ? reports : [];
    let processedList = reportsArray.filter(row => rowMatchesQuery(row, queryLowerCase));
    processedList = applyStatusFilter(processedList, statusFilter);
    processedList = processedList.slice();
    processedList.sort((a, b) => compareRows(a, b, sortKeyAcoes, sortDirAcoes));
    return processedList;
  }, [reports, searchQuery, statusFilter, sortKeyAcoes, sortDirAcoes]);

  /**
   * Paginates the filtered reports for the current page.
   */
  const pageDataAcoes = useMemo(() => {
    const startIndex = (pageAcoes - 1) * pageSizeAcoes;
    return filteredReports.slice(startIndex, startIndex + pageSizeAcoes);
  }, [filteredReports, pageAcoes, pageSizeAcoes]);

  const totalAcoes = filteredReports.length;

  /**
   * Toggles sort direction or changes sort key for actions table.
   * @param {string} sortKey - The key to sort by
   */
  const handleToggleSortAcoes = (sortKey) => {
    if (sortKeyAcoes === sortKey) {
      setSortDirAcoes(currentDirection => (currentDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKeyAcoes(sortKey);
      setSortDirAcoes((sortKey === 'acao' || sortKey === 'colaborador') ? 'asc' : 'desc');
    }
  };

  /**
   * Filters fixed accounts by date range and status.
   */
  const filteredFixas = useMemo(() => {
    let processedList = Array.isArray(fixas) ? fixas.slice() : [];
    // Date filter on vencimento
    const fromDate = dueFrom ? new Date(`${dueFrom}T00:00:00`) : null;
    const toDate = dueTo ? new Date(`${dueTo}T23:59:59`) : null;
    if (fromDate || toDate) {
      processedList = processedList.filter(fixedAccount => {
        if (!fixedAccount?.vencimento) return false;
        const accountDate = new Date(fixedAccount.vencimento);
        if (fromDate && accountDate < fromDate) return false;
        if (toDate && accountDate > toDate) return false;
        return true;
      });
    }
    // Status filter using display status
    if (statusFilter === 'ABERTO' || statusFilter === 'PAGO') {
      processedList = processedList.filter(fixedAccount =>
        getDisplayStatus(fixedAccount) === statusFilter
      );
    }
    return processedList;
  }, [fixas, dueFrom, dueTo, statusFilter]);

  /**
   * Sorts the filtered fixed accounts.
   */
  const sortedFixas = useMemo(() => {
    const sortedList = filteredFixas.slice();
    sortedList.sort((accountA, accountB) => {
      const valueA = getFixedAccountSortValue(accountA, sortKeyFixas);
      const valueB = getFixedAccountSortValue(accountB, sortKeyFixas);
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirFixas === 'asc' ? valueA - valueB : valueB - valueA;
      }
      const stringA = String(valueA || '');
      const stringB = String(valueB || '');
      const comparison = stringA.localeCompare(stringB);
      return sortDirFixas === 'asc' ? comparison : -comparison;
    });
    return sortedList;
  }, [filteredFixas, sortKeyFixas, sortDirFixas]);

  /**
   * Toggles sort direction or changes sort key for fixed accounts table.
   * @param {string} sortKey - The key to sort by
   */
  const handleToggleSortFixas = (sortKey) => {
    if (sortKeyFixas === sortKey) {
      setSortDirFixas(currentDirection => currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKeyFixas(sortKey);
      setSortDirFixas('asc');
      setPageFixas(1);
    }
  };

  // --- PDF Generation ---

  /**
   * Generates a PDF report for the filtered actions (Custos ações).
   */
  async function handleGeneratePDFAcoes() {
    if (!filteredReports.length) {
      setErrorModal({ open: true, message: "Nenhum resultado para gerar o relatório" });
      return;
    }
    try {
      await gerarPDFAcoesUtil(filteredReports, { searchQuery, statusFilter, dueFrom, dueTo });
    } catch (error) {
      setErrorModal({ open: true, message: error.message || "Erro ao gerar PDF" });
    }
  }

  /**
   * Generates a PDF report for the filtered fixed accounts (Contas Fixas).
   */
  async function handleGeneratePDFFixas() {
    try {
      // Use fixas array directly if no filters are applied, otherwise use filteredFixas
      const fixasToUse = (dueFrom || dueTo || statusFilter !== 'ALL') ? filteredFixas : fixas;

      if (!fixasToUse.length) {
        setErrorModal({ open: true, message: "Nenhum resultado para gerar o relatório" });
        return;
      }

      await gerarContasAPagarPDF({
        rows: [],
        fixasRows: fixasToUse,
        dueFrom,
        dueTo,
        includeFixas: true,
        getDisplayStatus,
        searchQuery,
        statusFilter,
      });
    } catch (error) {
      setErrorModal({ open: true, message: error.message || "Erro ao gerar PDF" });
    }
  }

  // --- Fixed Accounts (Contas Fixas) CRUD Operations ---

  /**
   * Opens the modal to create a new fixed account.
   */
  function handleOpenNewFixa() {
    setFixaEditing(null);
    setFixaForm({
      name: '',
      empresa: '',
      tipo: 'mensal',
      valor: '',
      status: 'ABERTO',
      vencimento: ''
    });
    setShowFixaModal(true);
  }

  /**
   * Opens the modal to edit an existing fixed account.
   * @param {object} fixedAccount - The fixed account to edit
   */
  function handleOpenEditFixa(fixedAccount) {
    setFixaEditing(fixedAccount);
    setFixaForm({
      name: fixedAccount.name || '',
      empresa: fixedAccount.empresa || '',
      tipo: fixedAccount.tipo || 'mensal',
      valor: fixedAccount.valor != null ? formatBRL(Number(fixedAccount.valor)) : '',
      status: (fixedAccount.status || 'ABERTO').toUpperCase(),
      vencimento: fixedAccount.vencimento
        ? new Date(fixedAccount.vencimento).toISOString().slice(0, 10)
        : ''
    });
    setShowFixaModal(true);
  }

  /**
   * Saves the current fixed account form (create or update).
   */
  async function handleSaveFixa() {
    const parsedValue = parseCurrency(fixaForm.valor);
    const timestamp = new Date().toISOString();
    const payload = {
      name: (fixaForm.name || '').trim(),
      empresa: (fixaForm.empresa || '').trim(),
      tipo: (fixaForm.tipo || '').trim(),
      valor: typeof parsedValue === 'number' ? parsedValue : undefined,
      status: (fixaForm.status || 'ABERTO').toUpperCase(),
      vencimento: fixaForm.vencimento || undefined,
    };
    // TODO: REVIEW - If valor is not a number, it will be undefined. Should this be allowed?
    try {
      let response;
      if (fixaEditing && fixaEditing._id) {
        // Update existing
        if (payload.status === 'PAGO') {
          payload.lastPaidAt = timestamp;
        } else {
          payload.lastPaidAt = null;
        }
        response = await fetch('/api/contafixa', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: fixaEditing._id, ...payload })
        });
      } else {
        // Create new
        if (payload.status === 'PAGO') {
          payload.lastPaidAt = timestamp;
        }
        response = await fetch('/api/contafixa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }
      if (!response.ok) {
        throw new Error('Falha ao salvar conta fixa');
      }
      setShowFixaModal(false);
      setFixaEditing(null);
      fetchFixas();
    } catch (error) {
      setErrorModal({ open: true, message: error.message || 'Erro ao salvar conta fixa' });
    }
  }

  /**
   * Deletes a fixed account after user confirmation.
   * @param {string} fixedAccountId - The ID of the fixed account to delete
   */
  async function handleDeleteFixa(fixedAccountId) {
    if (!confirm('Tem certeza que deseja excluir esta conta fixa?')) return;
    try {
      const response = await fetch('/api/contafixa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fixedAccountId })
      });
      if (!response.ok) throw new Error('Falha ao excluir');
      fetchFixas();
    } catch (error) {
      setErrorModal({ open: true, message: error.message || 'Erro ao excluir conta fixa' });
    }
  }

  if (status === "loading") return (<Wrapper>Carregando…</Wrapper>);

  return (
    <Wrapper>
      <Title>Contas a pagar</Title>

      <PageSection>
        <Filters
          dueFrom={dueFrom}
          dueTo={dueTo}
          onChangeDueFrom={setDueFrom}
          onChangeDueTo={setDueTo}
          statusFilter={statusFilter}
          onChangeStatus={setStatusFilter}
          onClear={handleClearAll}
          inputSx={inputSx}
          rightActions={
            <SmallSecondaryButton onClick={handleGeneratePDFFixas}>
              Gerar PDF (com fixas)
            </SmallSecondaryButton>
          }
        />
      </PageSection>

      <H2>Custos ações</H2>
      <SearchRow>
        <SearchCol>
          <label>Buscar</label>
          <FE.Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Cliente, Ação ou Colaborador (somente Custos ações)"
          />
        </SearchCol>
        <RowInline>
          <SmallSecondaryButton onClick={handleGeneratePDFAcoes}>
            Gerar PDF (ações)
          </SmallSecondaryButton>
        </RowInline>
      </SearchRow>

      <PageSection>
        <AcoesTable
          rows={pageDataAcoes}
          page={pageAcoes}
          pageSize={pageSizeAcoes}
          total={totalAcoes}
          onChangePage={setPageAcoes}
          onChangePageSize={setPageSizeAcoes}
          sortKey={sortKeyAcoes}
          sortDir={sortDirAcoes}
          onToggleSort={handleToggleSortAcoes}
          onChangeStatus={handleStatusChange}
          session={session}
        />
      </PageSection>

      <H2Large>Contas Fixas</H2Large>
      {session?.user?.role === 'admin' && (
        <RowTopGap>
          <FE.TopButton onClick={handleOpenNewFixa}>Nova Conta Fixa</FE.TopButton>
        </RowTopGap>
      )}
      <SmallNote>
        Quando o status estiver "PAGO", mostramos o mês/ano do pagamento e ele volta para "ABERTO" automaticamente após o ciclo (15 dias para quinzenal, 30 dias para mensal).
      </SmallNote>
      <ContasFixasTable
        rows={sortedFixas}
        sortKey={sortKeyFixas}
        sortDir={sortDirFixas}
        onToggleSort={handleToggleSortFixas}
        page={pageFixas}
        pageSize={pageSizeFixas}
        onChangePage={setPageFixas}
        onChangePageSize={setPageSizeFixas}
        getDisplayStatus={getDisplayStatus}
        formatDateBR={formatDateBR}
        onEdit={handleOpenEditFixa}
        onDelete={handleDeleteFixa}
        onStatusChange={handleFixaStatusChange}
      />

      {showFixaModal && (
        <ModalOverlay>
          <ModalCard>
            <h3>{fixaEditing ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}</h3>
            <ModalGrid>
              <ModalField>
                <label>Nome</label>
                <FE.Input
                  value={fixaForm.name}
                  onChange={e => setFixaForm(previousForm => ({ ...previousForm, name: e.target.value }))}
                />
              </ModalField>
              <ModalField>
                <label>Empresa</label>
                <FE.Input
                  value={fixaForm.empresa}
                  onChange={e => setFixaForm(previousForm => ({ ...previousForm, empresa: e.target.value }))}
                />
              </ModalField>
              <ModalField>
                <label>Tipo</label>
                <FE.Select
                  value={fixaForm.tipo}
                  onChange={e => setFixaForm(previousForm => ({ ...previousForm, tipo: e.target.value }))}
                >
                  <option value="quizenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </FE.Select>
              </ModalField>
              <ModalField>
                <label>Status</label>
                <FE.Select
                  value={fixaForm.status}
                  onChange={e => setFixaForm(previousForm => ({ ...previousForm, status: e.target.value }))}
                >
                  <option value="ABERTO">ABERTO</option>
                  <option value="PAGO">PAGO</option>
                </FE.Select>
              </ModalField>
              <ModalField>
                <label>Vencimento</label>
                <BRDateInput
                  value={fixaForm.vencimento}
                  onChange={(isoDate) => setFixaForm(previousForm => ({ ...previousForm, vencimento: isoDate }))}
                />
              </ModalField>
              <ModalField>
                <label>Valor</label>
                <BRCurrencyInput
                  value={fixaForm.valor}
                  onChange={(value) => setFixaForm(previousForm => ({ ...previousForm, valor: value }))}
                />
              </ModalField>
            </ModalGrid>
            <RowEnd>
              <FE.SecondaryButton onClick={() => setShowFixaModal(false)}>
                Cancelar
              </FE.SecondaryButton>
              <FE.Button onClick={handleSaveFixa}>Salvar</FE.Button>
            </RowEnd>
          </ModalCard>
        </ModalOverlay>
      )}
      <ErrorModal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: "" })}
        message={errorModal.message}
      />
    </Wrapper>
  );
}

