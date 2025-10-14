/**
 * Shared constants used across the application
 */

// Status options
export const STATUS_OPTIONS = {
  ALL: 'ALL',
  ABERTO: 'ABERTO',
  PAGO: 'PAGO',
  RECEBIDO: 'RECEBIDO',
  VENCIDO: 'VENCIDO',
  CANCELADO: 'CANCELADO'
};

export const STATUS_LABELS = {
  [STATUS_OPTIONS.ALL]: 'Todos',
  [STATUS_OPTIONS.ABERTO]: 'Aberto',
  [STATUS_OPTIONS.PAGO]: 'Pago',
  [STATUS_OPTIONS.RECEBIDO]: 'Recebido',
  [STATUS_OPTIONS.VENCIDO]: 'Vencido',
  [STATUS_OPTIONS.CANCELADO]: 'Cancelado'
};

export const PAYMENT_STATUS_OPTIONS = [
  { value: STATUS_OPTIONS.ALL, label: STATUS_LABELS.ALL },
  { value: STATUS_OPTIONS.ABERTO, label: STATUS_LABELS.ABERTO },
  { value: STATUS_OPTIONS.PAGO, label: STATUS_LABELS.PAGO }
];

export const RECEIVABLE_STATUS_OPTIONS = [
  { value: STATUS_OPTIONS.ALL, label: STATUS_LABELS.ALL },
  { value: STATUS_OPTIONS.ABERTO, label: STATUS_LABELS.ABERTO },
  { value: STATUS_OPTIONS.RECEBIDO, label: STATUS_LABELS.RECEBIDO }
];

// Payment types
export const PAYMENT_TYPES = {
  PIX: 'PIX',
  TED: 'TED',
  DINHEIRO: 'Dinheiro',
  BOLETO: 'Boleto',
  CARTAO: 'Cartão'
};

export const PAYMENT_TYPE_OPTIONS = [
  { value: PAYMENT_TYPES.PIX, label: 'PIX' },
  { value: PAYMENT_TYPES.TED, label: 'TED' },
  { value: PAYMENT_TYPES.DINHEIRO, label: 'Dinheiro' },
  { value: PAYMENT_TYPES.BOLETO, label: 'Boleto' },
  { value: PAYMENT_TYPES.CARTAO, label: 'Cartão' }
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date formats
export const DATE_FORMAT_BR = 'dd/MM/yyyy';
export const DATE_FORMAT_ISO = 'yyyy-MM-dd';
export const DATETIME_FORMAT_BR = 'dd/MM/yyyy HH:mm';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  COLABORADOR: 'colaborador',
  CLIENTE: 'cliente'
};

// Entity types
export const ENTITY_TYPES = {
  PF: 'PF', // Pessoa Física
  PJ: 'PJ'  // Pessoa Jurídica
};

export const ENTITY_TYPE_OPTIONS = [
  { value: ENTITY_TYPES.PF, label: 'Pessoa Física' },
  { value: ENTITY_TYPES.PJ, label: 'Pessoa Jurídica' }
];

// Dashboard date presets
export const DATE_PRESETS = {
  TODAY: 'today',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth',
  NEXT_15_DAYS: 'next15Days',
  LAST_30_DAYS: 'last30Days',
  LAST_90_DAYS: 'last90Days'
};

export const DATE_PRESET_LABELS = {
  [DATE_PRESETS.TODAY]: 'Hoje',
  [DATE_PRESETS.THIS_WEEK]: 'Esta semana',
  [DATE_PRESETS.THIS_MONTH]: 'Este mês',
  [DATE_PRESETS.NEXT_15_DAYS]: 'Próximos 15 dias',
  [DATE_PRESETS.LAST_30_DAYS]: 'Últimos 30 dias',
  [DATE_PRESETS.LAST_90_DAYS]: 'Últimos 90 dias'
};

// API endpoints
export const API_ENDPOINTS = {
  ACTIONS: '/api/action',
  CLIENTES: '/api/cliente',
  COLABORADORES: '/api/colaborador',
  CONTAS_PAGAR: '/api/contasapagar',
  CONTAS_RECEBER: '/api/contasareceber',
  CONTAS_FIXAS: '/api/contafixa',
  REPORTS: '/api/action/report'
};

// Table column widths
export const COLUMN_WIDTHS = {
  SMALL: '80px',
  MEDIUM: '120px',
  LARGE: '200px',
  DATE: '110px',
  CURRENCY: '130px',
  ACTIONS: '140px'
};
