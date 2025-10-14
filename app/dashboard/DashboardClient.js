"use client";
import styled from "styled-components";
import { RowBottomGap } from '../components/ui/primitives';
import { useEffect, useMemo, useState } from "react";
import FiltersClient from "./FiltersClient";
import { useSearchParams, useRouter } from "next/navigation";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import Skeleton from "../components/ui/Skeleton";
import Legend from "../components/ui/Legend";
import ErrorBanner from "../components/ui/ErrorBanner";

const Wrapper = styled.div`
  padding: var(--space-sm);
  display: grid;
  gap: var(--gap-xs);
`;
const Title = styled.h1`
  font-size: var(--font-h3, 1.6rem);
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--gap-xs);
  /* span helpers: apply grid-column span via className e.g. .span-4 */
  & > .span-1 { grid-column: span 1; }
  & > .span-2 { grid-column: span 2; }
  & > .span-3 { grid-column: span 3; }
  & > .span-4 { grid-column: span 4; }
  & > .span-5 { grid-column: span 5; }
  & > .span-6 { grid-column: span 6; }
  & > .span-7 { grid-column: span 7; }
  & > .span-8 { grid-column: span 8; }
  & > .span-9 { grid-column: span 9; }
  & > .span-10 { grid-column: span 10; }
  & > .span-11 { grid-column: span 11; }
  & > .span-12 { grid-column: span 12; }
`;
const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  height: auto;
  /* allow $height prop to control height in px (prefixed prop won't be forwarded to DOM) */
  ${(p) => p.$height ? `height: ${p.$height}px;` : ''}
`;
const KPI = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
`;
const KPILabel = styled.div`
  font-size: 0.74rem;
  text-align: center;
  color: #6b7280;
`;
const KPIValue = styled.div`
  text-align: center;
  font-size: 1.05rem;
  font-weight: 600;
  padding: var(--space-xs) 0;
`;

const CardTitle = styled.div`
  font-weight: 600;
  margin-bottom: var(--space-xs, var(--space-xs, var(--space-xs, 8px)));
`;

const ChartBox = styled.div`
  height: ${(p) => (p.$height ? `${p.$height}px` : 'var(--chart-height, 260px)')};
`;

const ChartPlaceholder = styled.div`
  padding: var(--space-xs);
  color: #6b7280;
`;

// LegendRow replaced by shared RowBottomGap primitive

// using shared Skeleton component (app/components/ui/Skeleton.js)

/**
 * Fetches JSON data from URL
 * @param {string} url - URL to fetch
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} If request fails
 */
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

/**
 * Checks if a date is within the filter range
 * @param {string|Date} date - Date to check
 * @param {string} filterFrom - Start date (ISO)
 * @param {string} filterTo - End date (ISO)
 * @returns {boolean} Whether date is in range
 */
function isDateInRange(date, filterFrom, filterTo) {
  if (!date) return true;

  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return true;

  if (filterFrom) {
    const fromDate = new Date(filterFrom);
    if (dateObj < fromDate) return false;
  }

  if (filterTo) {
    const toDate = new Date(filterTo);
    // Include end day
    toDate.setHours(23, 59, 59, 999);
    if (dateObj > toDate) return false;
  }

  return true;
}

/**
 * Checks if a client matches the filter
 * @param {string} clientId - Client ID
 * @param {string} clientName - Client name
 * @param {string} filterClient - Filter client ID
 * @returns {boolean} Whether client matches
 */
function matchesClientFilter(clientId, clientName, filterClient) {
  if (!filterClient) return true;
  if (clientId && String(clientId) === String(filterClient)) return true;
  if (clientName && String(clientName).toLowerCase() === String(filterClient).toLowerCase()) return true;
  return false;
}

/**
 * Gets the action for a conta a pagar row
 * @param {Object} row - Conta a pagar row
 * @param {Array} acoesList - List of actions
 * @returns {Object|null} Action object or null
 */
function getActionForContaPagar(row, acoesList = []) {
  // If actionId is populated (has action properties), return it
  if (row?.actionId?.staff || row?.actionId?.costs || row?.actionId?.name) {
    return row.actionId;
  }

  // Otherwise, extract the ID and look it up from acoesList
  let actionId = '';

  // Handle different possible formats of actionId
  if (!row?.actionId) {
    return null;
  }

  if (typeof row.actionId === 'string') {
    actionId = row.actionId;
  } else if (typeof row.actionId === 'object') {
    // Could be a Mongoose ObjectId object or a plain object with _id
    actionId = String(row.actionId._id || row.actionId);
  }

  if (!actionId || !acoesList.length) {
    return null;
  }

  // Find the action in the list
  const action = acoesList.find(a => String(a._id) === actionId);
  return action || null;
}

/**
 * Extracts value from conta a pagar row
 * @param {Object} row - Conta a pagar row
 * @param {Array} acoesList - List of actions to lookup values from
 * @returns {number} Value amount
 */
function extractContaPagarValue(row, acoesList = []) {
  const action = getActionForContaPagar(row, acoesList);
  if (!action) return 0;

  const staffList = Array.isArray(action.staff) ? action.staff : [];
  const costsList = Array.isArray(action.costs) ? action.costs : [];

  const staffItem = row?.staffName
    ? staffList.find((s) => s.name === row.staffName)
    : null;

  const costItem = !row?.staffName && row?.costId
    ? costsList.find((c) => String(c._id) === String(row.costId))
    : null;

  return Number((staffItem?.value ?? costItem?.value) || 0);
}

/**
 * Formats date to month key (YYYY-MM)
 * @param {string|Date} date - Date to format
 * @returns {string|null} Month key or null if invalid
 */
function toMonthKey(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) return null;
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Saves filters to localStorage
 * @param {string} client - Client ID
 * @param {string} from - Start date
 * @param {string} to - End date
 */
function saveFiltersToLocalStorage(client, from, to) {
  try {
    if (globalThis?.localStorage) {
      const filters = JSON.stringify({ client, from, to });
      globalThis.localStorage.setItem('dashboard_filters', filters);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Updates URL query parameters
 * @param {URLSearchParams} searchParams - Current search params
 * @param {Object} router - Next.js router
 * @param {Object} filters - Filter values
 * @param {boolean} replace - Use replace instead of push
 */
function updateURLParams(searchParams, router, filters, replace = false) {
  try {
    const queryParams = new URLSearchParams(Array.from(searchParams?.entries?.() || []));

    if (filters.client) {
      queryParams.set('client', filters.client);
    } else {
      queryParams.delete('client');
    }

    if (filters.from) {
      queryParams.set('from', filters.from);
    } else {
      queryParams.delete('from');
    }

    if (filters.to) {
      queryParams.set('to', filters.to);
    } else {
      queryParams.delete('to');
    }

    const newURL = `${globalThis.location.pathname}?${queryParams.toString()}`;

    if (router) {
      if (replace && router.replace) {
        router.replace(newURL);
      } else if (router.push) {
        router.push(newURL);
      }
    }
  } catch {
    // Ignore URL update errors
  }
}

/**
 * Dashboard client component with KPIs and charts
 */
export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acoes, setAcoes] = useState([]);
  const [pagar, setPagar] = useState([]);
  const [receber, setReceber] = useState({ items: [], total: 0 });
  const [clientes, setClientes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  // UI filters
  const [filterClient, setFilterClient] = useState(""); // client ID
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const searchParams = useSearchParams?.() ?? null;
  const router = useRouter?.() ?? null;

  // Handlers to avoid naming collisions in JSX props
  const handleSetFilterClient = (clientId) => {
    setFilterClient(clientId);
    updateURLParams(searchParams, router, {
      client: clientId,
      from: filterFrom,
      to: filterTo
    }, false);
    saveFiltersToLocalStorage(clientId, filterFrom, filterTo);
  };

  const handleSetFilterFrom = (dateValue) => {
    setFilterFrom(dateValue);
    saveFiltersToLocalStorage(filterClient, dateValue, filterTo);
  };

  const handleSetFilterTo = (dateValue) => {
    setFilterTo(dateValue);
    saveFiltersToLocalStorage(filterClient, filterFrom, dateValue);
  };

  // Apply filters but avoid pushing on every single input change; use router.replace for minimal history noise
  const applyFilters = () => {
    updateURLParams(searchParams, router, {
      client: filterClient,
      from: filterFrom,
      to: filterTo
    }, true);
    saveFiltersToLocalStorage(filterClient, filterFrom, filterTo);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      // restore date filters from query params or localStorage
      try {
        const qpClient = searchParams?.get?.('client');
        const qpFrom = searchParams?.get?.('from');
        const qpTo = searchParams?.get?.('to');

        // Only set client filter from URL params (not localStorage yet)
        if (qpClient) setFilterClient(qpClient);

        if (qpFrom) setFilterFrom(qpFrom);
        if (qpTo) setFilterTo(qpTo);
      } catch { /* ignore */ }
      try {
        const [a, p, r, c, col] = await Promise.allSettled([
          fetchJson("/api/action"),
          fetchJson("/api/contasapagar"),
          fetchJson("/api/contasareceber?pageSize=1000"), // Request all items for dashboard
          fetchJson("/api/cliente"),
          fetchJson("/api/colaborador"),
        ]);
        if (!mounted) return;
        setAcoes(Array.isArray(a.value) ? a.value : []);
        setPagar(Array.isArray(p.value) ? p.value : []);
        setReceber(r.value && typeof r.value === "object" ? r.value : { items: [], total: 0 });

        const clientsList = Array.isArray(c.value) ? c.value : [];
        setClientes(clientsList);

        const colaboradoresList = Array.isArray(col.value) ? col.value : [];
        setColaboradores(colaboradoresList);

        // Restore client filter from localStorage if not from URL
        if (!searchParams?.get?.('client') && globalThis?.localStorage) {
          const ls = globalThis.localStorage.getItem('dashboard_filters');
          if (ls) {
            try {
              const parsed = JSON.parse(ls);
              if (parsed.client) {
                // Only restore if the client exists in the list
                const clientExists = clientsList.some(client => String(client._id) === parsed.client);
                if (clientExists) {
                  setFilterClient(parsed.client);
                } else {
                  // Remove invalid client from localStorage
                  globalThis.localStorage.removeItem('dashboard_filters');
                }
              }
            } catch { /* ignore */ }
          }
        }
      } catch {
        if (mounted) setError("Erro ao carregar dados do dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Build client name lookup map
  const clientNameMap = useMemo(() => {
    const map = new Map();
    clientes.forEach(cliente => {
      const id = String(cliente._id);
      const codigo = cliente.codigo ? `${cliente.codigo} ` : '';
      const name = `${codigo}${cliente.nome || ''}`.trim();
      map.set(id, name);
    });
    return map;
  }, [clientes]);

  const kpis = useMemo(() => {
    // Count unique filtered items
    const uniqueActions = new Set();
    const uniqueClients = new Set();

    let receitaPrevista = 0;
    let receitaRecebida = 0;

    (receber.items || []).forEach((item) => {
      const clientId = item?.clientId || item?.receivable?.clientId || item?.cliente?._id || "";
      const clientName = item?.clientName || item?.cliente?.name || "";
      const actionId = item?.actionId || item?.receivable?.actionId || "";

      const receivableData = item?.receivable || item;
      const installments = receivableData?.installments || [];

      // If has installments, process each one individually
      if (installments.length > 0) {
        installments.forEach((inst) => {
          const instDate = inst.dueDate || receivableData?.dataVencimento || item?.date || item?.reportDate;

          if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(instDate, filterFrom, filterTo)) {
            return;
          }

          const instValue = Number(inst.value || 0);
          receitaPrevista += instValue;

          if (String(inst.status || "").toUpperCase() === "RECEBIDO") {
            receitaRecebida += instValue;
          }

          // Track unique entities
          if (actionId) uniqueActions.add(String(actionId));
          if (clientId) uniqueClients.add(String(clientId));
        });
      } else {
        // Single payment - use original logic
        const date = receivableData?.dataRecebimento || receivableData?.dataVencimento || item?.date || item?.reportDate;

        if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
          return;
        }

        // Fix: API returns 'value', not 'valor'
        const value = Number(item?.value ?? receivableData?.valor ?? 0) || 0;
        receitaPrevista += value;

        const status = String(receivableData?.status ?? "").toUpperCase();
        if (status === "RECEBIDO") {
          receitaRecebida += value;
        }

        // Track unique entities
        if (actionId) uniqueActions.add(String(actionId));
        if (clientId) uniqueClients.add(String(clientId));
      }
    });

    let custosPrevistos = 0;
    let custosPagos = 0;

    (pagar || []).forEach((row) => {
      const action = getActionForContaPagar(row, acoes);
      if (!action) return;

      const clientId = String(action.client || '');
      const clientName = clientNameMap.get(clientId) || row?.clientName || "";
      const date = action.date || row?.reportDate;
      const actionId = action._id || action.id;

      if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
        return;
      }

      const value = extractContaPagarValue(row, acoes);
      custosPrevistos += value;

      if (String(row?.status || "ABERTO").toUpperCase() === "PAGO") {
        custosPagos += value;
      }

      // Track unique entities
      if (actionId) uniqueActions.add(String(actionId));
      if (clientId) uniqueClients.add(clientId);
    }); const lucroPrev = receitaPrevista - custosPrevistos;
    const lucroReal = receitaRecebida - custosPagos;

    return {
      totalAcoes: uniqueActions.size,
      totalClientes: uniqueClients.size,
      totalColabs: colaboradores.length,
      receitaPrevista,
      receitaRecebida,
      custosPrevistos,
      custosPagos,
      lucroPrev,
      lucroReal,
    };
  }, [acoes, pagar, receber, colaboradores, clientNameMap, filterClient, filterFrom, filterTo]);

  const monthlySeries = useMemo(() => {
    const monthlyData = new Map();

    // Aggregate receita by month with filters
    (receber.items || []).forEach((item) => {
      const clientId = item?.clientId || item?.receivable?.clientId || item?.cliente?._id || "";
      const clientName = item?.clientName || item?.cliente?.name || "";
      const receivableData = item?.receivable || item;
      const installments = receivableData?.installments || [];

      // If has installments, aggregate each one by its due date
      if (installments.length > 0) {
        installments.forEach((inst) => {
          const date = inst.dueDate || receivableData?.dataVencimento || item?.date || item?.reportDate;

          if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
            return;
          }

          const monthKey = toMonthKey(date);
          if (!monthKey) return;

          const value = Number(inst.value || 0);
          const accumulated = monthlyData.get(monthKey) || { r: 0, c: 0 };
          accumulated.r += value;
          monthlyData.set(monthKey, accumulated);
        });
      } else {
        // Single payment
        const date = receivableData?.dataRecebimento || receivableData?.dataVencimento || item?.date || item?.reportDate;

        if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
          return;
        }

        const monthKey = toMonthKey(date);
        if (!monthKey) return;

        // Fix: API returns 'value', not 'valor'
        const value = Number(item?.value ?? receivableData?.valor ?? 0) || 0;
        const accumulated = monthlyData.get(monthKey) || { r: 0, c: 0 };
        accumulated.r += value;
        monthlyData.set(monthKey, accumulated);
      }
    });

    // Aggregate custos by month with filters
    (pagar || []).forEach((row) => {
      const action = getActionForContaPagar(row, acoes);
      if (!action) return;

      const clientId = String(action.client || '');
      const clientName = clientNameMap.get(clientId) || row?.clientName || "";
      const date = action?.date || row?.reportDate;

      if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
        return;
      }

      const monthKey = toMonthKey(date);
      if (!monthKey) return;

      const value = extractContaPagarValue(row, acoes);
      const accumulated = monthlyData.get(monthKey) || { r: 0, c: 0 };
      accumulated.c += value;
      monthlyData.set(monthKey, accumulated);
    });

    // Get last 12 months
    const monthKeys = Array.from(monthlyData.keys()).sort();
    const last12Months = monthKeys.slice(-12);

    const receitaSeries = {
      id: "Receita",
      color: "#22c55e",
      data: last12Months.map((key) => ({
        x: key,
        y: monthlyData.get(key)?.r || 0
      }))
    };

    const custosSeries = {
      id: "Custos",
      color: "#ef4444",
      data: last12Months.map((key) => ({
        x: key,
        y: monthlyData.get(key)?.c || 0
      }))
    };

    return [receitaSeries, custosSeries];
  }, [receber, pagar, acoes, clientNameMap, filterClient, filterFrom, filterTo]);

  const topClientes = useMemo(() => {
    const acc = new Map();

    (receber.items || []).forEach((item) => {
      const clientId = item?.clientId || item?.receivable?.clientId || item?.cliente?._id || "";
      const clientName = item?.clientName || item?.cliente?.name || "Cliente";
      const receivableData = item?.receivable || item;
      const installments = receivableData?.installments || [];

      // If has installments, aggregate each one
      if (installments.length > 0) {
        installments.forEach((inst) => {
          const date = inst.dueDate || receivableData?.dataVencimento || item?.date || item?.reportDate;

          if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
            return;
          }

          const value = Number(inst.value || 0);
          acc.set(clientName, (acc.get(clientName) || 0) + value);
        });
      } else {
        // Single payment
        const date = receivableData?.dataRecebimento || receivableData?.dataVencimento || item?.date || item?.reportDate;

        if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
          return;
        }

        const val = Number(item?.value ?? receivableData?.valor ?? 0) || 0;
        acc.set(clientName, (acc.get(clientName) || 0) + val);
      }
    });

    const entries = Array.from(acc.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return entries.map(([name, v]) => ({ cliente: name, valor: v }));
  }, [receber, filterClient, filterFrom, filterTo]);

  const marginsByClient = useMemo(() => {
    const receitaByClient = new Map();
    const custosByClient = new Map();

    // Aggregate receita by client
    (receber.items || []).forEach((item) => {
      const clientId = item?.clientId || item?.receivable?.clientId || item?.cliente?._id || "";
      const clientName = item?.clientName || item?.cliente?.name || "Cliente";
      const receivableData = item?.receivable || item;
      const installments = receivableData?.installments || [];

      // If has installments, aggregate each one
      if (installments.length > 0) {
        installments.forEach((inst) => {
          const date = inst.dueDate || receivableData?.dataVencimento || item?.date || item?.reportDate;

          if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
            return;
          }

          const value = Number(inst.value || 0);
          receitaByClient.set(clientName, (receitaByClient.get(clientName) || 0) + value);
        });
      } else {
        // Single payment
        const date = receivableData?.dataRecebimento || receivableData?.dataVencimento || item?.date || item?.reportDate;

        if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
          return;
        }

        // Fix: API returns 'value', not 'valor'
        const value = Number(item?.value ?? receivableData?.valor ?? 0) || 0;
        receitaByClient.set(clientName, (receitaByClient.get(clientName) || 0) + value);
      }
    });

    // Aggregate custos by client
    (pagar || []).forEach((row) => {
      const action = getActionForContaPagar(row, acoes);
      if (!action) return;

      const clientId = String(action.client || '');
      const clientName = clientNameMap.get(clientId) || row?.clientName || "Cliente";
      const date = action.date || row?.reportDate;

      if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
        return;
      }

      const value = extractContaPagarValue(row, acoes);
      custosByClient.set(clientName, (custosByClient.get(clientName) || 0) + value);
    });

    // Combine all clients
    const allClientNames = Array.from(new Set([
      ...receitaByClient.keys(),
      ...custosByClient.keys()
    ]));

    return allClientNames
      .map((clientName) => {
        const receita = receitaByClient.get(clientName) || 0;
        const custos = custosByClient.get(clientName) || 0;
        return {
          cliente: clientName,
          margin: receita - custos,
          receita,
          custos
        };
      })
      .sort((a, b) => b.margem - a.margem)
      .slice(0, 8);
  }, [receber, pagar, acoes, clientNameMap, filterClient, filterFrom, filterTo]);

  const statusDistrib = useMemo(() => {
    const pagarCounts = { ABERTO: 0, PAGO: 0 };

    // Filter contas a pagar
    (pagar || []).forEach((row) => {
      const action = getActionForContaPagar(row, acoes);
      if (!action) return;

      const clientId = String(action.client || '');
      const clientName = clientNameMap.get(clientId) || row?.clientName || "";
      const date = action.date || row?.reportDate;

      if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
        return;
      }

      const status = String(row?.status || "ABERTO").toUpperCase();
      if (status === "PAGO") {
        pagarCounts.PAGO++;
      } else {
        pagarCounts.ABERTO++;
      }
    });

    const recCounts = { ABERTO: 0, RECEBIDO: 0 };

    // Filter contas a receber
    (receber.items || []).forEach((item) => {
      const clientId = item?.clientId || item?.receivable?.clientId || item?.cliente?._id || "";
      const clientName = item?.clientName || item?.cliente?.name || "";
      const receivableData = item?.receivable || item;
      const installments = receivableData?.installments || [];

      // If has installments, count each one
      if (installments.length > 0) {
        installments.forEach((inst) => {
          const date = inst.dueDate || receivableData?.dataVencimento || item?.date || item?.reportDate;

          if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
            return;
          }

          const status = String(inst.status || "ABERTO").toUpperCase();
          if (status === "RECEBIDO") {
            recCounts.RECEBIDO++;
          } else {
            recCounts.ABERTO++;
          }
        });
      } else {
        // Single payment
        const date = receivableData?.dataRecebimento || receivableData?.dataVencimento || item?.date || item?.reportDate;

        if (!matchesClientFilter(clientId, clientName, filterClient) || !isDateInRange(date, filterFrom, filterTo)) {
          return;
        }

        const status = String(receivableData?.status || "ABERTO").toUpperCase();
        if (status === "RECEBIDO") {
          recCounts.RECEBIDO++;
        } else {
          recCounts.ABERTO++;
        }
      }
    });

    return {
      pagar: [
        { id: "ABERTO", label: "ABERTO", value: pagarCounts.ABERTO },
        { id: "PAGO", label: "PAGO", value: pagarCounts.PAGO },
      ],
      receber: [
        { id: "ABERTO", label: "ABERTO", value: recCounts.ABERTO },
        { id: "RECEBIDO", label: "RECEBIDO", value: recCounts.RECEBIDO },
      ],
    };
  }, [pagar, receber, acoes, clientNameMap, filterClient, filterFrom, filterTo]);

  // show placeholders inline while loading, and an inline error banner if any
  const showPlaceholder = loading;

  return (
    <Wrapper>
      <Title>Dashboard</Title>
      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {/* Filters (client id based) */}
      <FiltersClient
        clients={clientes}
        filterClient={filterClient}
        setFilterClient={handleSetFilterClient}
        filterFrom={filterFrom}
        setFilterFrom={handleSetFilterFrom}
        filterTo={filterTo}
        setFilterTo={handleSetFilterTo}
        onApply={applyFilters}
      />

      <Grid>
        <KPI as="div" className="span-1">
          <KPILabel>Clientes</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={60} height={20} /> : kpis.totalClientes}</KPIValue>
        </KPI>
        <KPI as="div" className="span-1">
          <KPILabel>Colaboradores</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={60} height={20} /> : kpis.totalColabs}</KPIValue>
        </KPI>
        <KPI as="div" className="span-1">
          <KPILabel>Ações</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={60} height={20} /> : kpis.totalAcoes}</KPIValue>
        </KPI>
        <KPI as="div" className="span-3">
          <KPILabel>Lucro previsto</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={140} height={20} /> : `R$ ${kpis.lucroPrev.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</KPIValue>
        </KPI>

        <KPI as="div" className="span-2">
          <KPILabel>Lucro real</KPILabel>
          <KPIValue>{showPlaceholder ? <Skeleton width={140} height={20} /> : `R$ ${kpis.lucroReal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</KPIValue>
        </KPI>
        <KPI as="div" className="span-2">
          <KPILabel>Receita (recebida)</KPILabel>
          <KPIValue style={{ color: '#22c55e' }}>{showPlaceholder ? <Skeleton width={140} height={20} /> : `R$ ${kpis.receitaRecebida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</KPIValue>
        </KPI>
        <KPI as="div" className="span-2">
          <KPILabel>Custos (pagos)</KPILabel>
          <KPIValue style={{ color: '#ef4444' }}>{showPlaceholder ? <Skeleton width={140} height={20} /> : `R$ ${kpis.custosPagos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</KPIValue>
        </KPI>
        <Card className="span-7" $height={320}>
          <CardTitle>Receita x Custos (12 meses)</CardTitle>
          <ChartBox $height={260}>
            {showPlaceholder ? (
              <ChartPlaceholder>Carregando gráfico…</ChartPlaceholder>
            ) : (
              <ResponsiveLine
                data={monthlySeries}
                margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
                xScale={{ type: "point" }}
                yScale={{ type: "linear", stacked: false, min: 0 }}
                axisBottom={{ tickRotation: -35 }}
                colors={(d) => d.color}
                pointSize={6}
                useMesh
                tooltip={({ point }) => (
                  <div style={{
                    background: 'white',
                    padding: '9px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <strong>{point.serieId}</strong>
                    <div>Mês: {point.data.xFormatted}</div>
                    <div>Valor: R$ {Number(point.data.yFormatted).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                )}
              />
            )}
          </ChartBox>
        </Card>
        <Card className="span-5" $height={320}>
          <CardTitle>Top clientes (valor previsto)</CardTitle>
          <ChartBox $height={260}>
            <ResponsiveBar
              data={topClientes}
              keys={["valor"]}
              indexBy="cliente"
              margin={{ top: 10, right: 10, bottom: 80, left: 60 }}
              axisBottom={{ tickRotation: -35 }}
              padding={0.3}
              colors={["#0ea5e9"]}
              enableLabel={false}
            />
          </ChartBox>
        </Card>

        <Card className="span-4" $height={320}>
          <CardTitle>Margens por cliente (top 8)</CardTitle>
          <RowBottomGap>
            <Legend items={[{ label: 'Receita', color: '#22c55e' }, { label: 'Custos', color: '#ef4444' }]} />
          </RowBottomGap>
          <ChartBox $height={260}>
            {showPlaceholder ? (
              <ChartPlaceholder><Skeleton width="100%" height={160} /></ChartPlaceholder>
            ) : marginsByClient.length === 0 ? (
              <ChartPlaceholder>Nenhum dado</ChartPlaceholder>
            ) : (
              <ResponsiveBar
                data={marginsByClient.map((m) => ({ cliente: m.cliente, receita: m.receita, custos: m.custos }))}
                keys={["receita", "custos"]}
                indexBy="cliente"
                margin={{ top: 10, right: 10, bottom: 80, left: 80 }}
                axisBottom={{ tickRotation: -35 }}
                padding={0.3}
                colors={['#22c55e', '#ef4444']}
                groupMode="stacked"
                enableLabel={false}
              />
            )}
          </ChartBox>
        </Card>

        <Card className="span-4" $height={320}>
          <CardTitle>Contas a pagar (status)</CardTitle>
          <RowBottomGap>
            <Legend items={[{ label: 'Aberto', color: '#f59e0b' }, { label: 'Pago', color: '#22c55e' }]} />
          </RowBottomGap>
          <ChartBox $height={220}>
            <ResponsivePie
              data={statusDistrib.pagar}
              margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
              innerRadius={0.5}
              padAngle={1}
              cornerRadius={3}
              colors={["#f59e0b", "#22c55e"]}
              enableArcLabels={true}
              arcLabelsSkipAngle={10}
              arcLabel={d => `${d.value}`}
              arcLabelsTextColor="#ffffff"
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 20,
                  itemsSpacing: 10,
                  itemWidth: 80,
                  itemHeight: 18,
                  itemTextColor: '#333',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 14,
                  symbolShape: 'circle'
                }
              ]}
            />
          </ChartBox>
        </Card>
        <Card className="span-4" $height={320}>
          <CardTitle>Contas a receber (status)</CardTitle>
          <RowBottomGap>
            <Legend items={[{ label: 'Aberto', color: '#f59e0b' }, { label: 'Recebido', color: '#22c55e' }]} />
          </RowBottomGap>
          <ChartBox $height={220}>
            <ResponsivePie
              data={statusDistrib.receber}
              margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
              innerRadius={0.5}
              padAngle={1}
              cornerRadius={3}
              colors={["#f59e0b", "#22c55e"]}
              enableArcLabels={true}
              arcLabelsSkipAngle={10}
              arcLabel={d => `${d.value}`}
              arcLabelsTextColor="#ffffff"
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 20,
                  itemsSpacing: 10,
                  itemWidth: 80,
                  itemHeight: 18,
                  itemTextColor: '#333',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 14,
                  symbolShape: 'circle'
                }
              ]}
            />
          </ChartBox>
        </Card>
      </Grid>
    </Wrapper>
  );
}
