/**
 * Central export for commonly used components
 */

// UI Components
export { default as DataTable } from './ui/DataTable';
export { default as KPICard } from './KPICard';
export { default as ChartContainer } from './ChartContainer';
export { default as StatusBadge } from './StatusBadge';
export { default as SearchFilterBar } from './SearchFilterBar';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as PageLoading } from './PageLoading';
export { default as EmptyState } from './EmptyState';

// Form Components
export * as FormElements from './FormElements';
export { default as BRDateInput } from './BRDateInput';
export { default as BRCurrencyInput } from './BRCurrencyInput';

// Modals
export { default as Modal } from './Modal';
export { default as DeleteModal } from './DeleteModal';

// Table Components
export * from './ui/Table';
export { default as HeaderControls } from './ui/HeaderControls';
export { default as Pager } from './ui/Pager';

// UI Primitives
export * from './ui/primitives';
