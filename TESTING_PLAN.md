# PDF Reports Testing Plan

## Reports to Test

### 1. Contas a Pagar - Custos Ações
**Location**: `/contasapagar` → "Gerar PDF (ações)" button
**Filters Available**:
- Search query (Cliente, Ação, Colaborador)
- Date range (Due date from/to)
- Status filter (ALL, ABERTO, PAGO)

**Test Scenarios**:
1. All data (no filters)
2. Filtered by date range
3. Filtered by status = ABERTO
4. Filtered by search query

### 2. Contas a Pagar - Contas Fixas
**Location**: `/contasapagar` → "Gerar PDF (fixas)" button
**Filters Available**:
- Status (auto-calculated based on date)

**Test Scenarios**:
1. All fixed accounts
2. With different date ranges
3. Mix of ABERTO and PAGO statuses

### 3. Contas a Receber
**Location**: `/contasareceber` → "Gerar PDF" button
**Filters Available**:
- Search query
- Mode (vencimento / recebimento)
- Date range
- Status filter

**Test Scenarios**:
1. All data (no filters)
2. Filtered by vencimento date range
3. Filtered by status = RECEBIDO
4. Filtered by search query

## Issues to Fix

### Critical
- [ ] PIX/Banco columns not showing colaboradorData fallback
- [ ] Date range display in PDF header
- [ ] Filter information not shown in PDF

### Nice to Have
- [ ] Add filter summary to PDF
- [ ] Better column alignment
- [ ] Page numbering for multi-page reports
