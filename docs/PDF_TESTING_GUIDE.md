# PDF Reports - Testing Guide

## Overview
This guide provides comprehensive testing scenarios for the PDF report generation feature after fixing PIX/Banco data display and adding filter information.

## What Was Fixed

### 1. PIX/Banco Data Display
- **Problem**: PIX and Banco columns were empty or showing MongoDB ObjectIds
- **Solution**: 
  - Enhanced `contasapagar` helpers to attach full `colaboradorData` (including PIX, banco, conta)
  - Updated PDF generation to prioritize `colaboradorData` over direct staff/cost fields
  - Added colaborador enrichment to `contasareceber` API endpoint

### 2. Filter Information Display
- **Problem**: PDF reports didn't show which filters were applied
- **Solution**:
  - Added filter parameter passing from page components to PDF functions
  - Display active filters (search query, date range, status) in PDF header
  - Better visual clarity on what data is included in the report

### 3. Staff Data in Contas a Receber
- **Problem**: Staff information not included in ContasAReceber API response
- **Solution**:
  - Modified API to select and return staff array from Action model
  - Added `enrichStaffWithColaboradorData` helper to match staff by name and attach PIX/banco info
  - Updated PDF to use enriched staff data

## Test Scenarios

### Scenario 1: Contas a Pagar - Custos Ações (All Data)
**Objective**: Verify all action costs are displayed with correct PIX/Banco info

**Steps**:
1. Navigate to `/contasapagar`
2. Clear all filters (search, date, status)
3. Click "Gerar PDF (ações)" button
4. Verify PDF contains:
   - ✅ Title: "Custos ações"
   - ✅ Date range from first to last action
   - ✅ No filter information (since no filters applied)
   - ✅ Total a pagar and Total pago values
   - ✅ Table with columns: Data, Cliente, Ação, Colaborador, Vencimento, Valor total, Pgt, Banco/PIX, Status
   - ✅ PIX column shows PIX keys (not ObjectIds or empty)
   - ✅ Banco column shows bank names when pgt=TED
   - ✅ All rows match the filtered table on the page

### Scenario 2: Contas a Pagar - Custos Ações (Date Filter)
**Objective**: Verify date filtering works correctly

**Steps**:
1. Navigate to `/contasapagar`
2. Set "Vencimento de" to 30 days ago (e.g., 2024-01-01)
3. Set "Vencimento até" to today (e.g., 2024-01-31)
4. Click "Gerar PDF (ações)" button
5. Verify PDF contains:
   - ✅ Title: "Custos ações"
   - ✅ Date range matching your filter
   - ✅ Filter line: "Filtro Vencimento: 01/01/2024 até 31/01/2024"
   - ✅ Only rows with vencimento within the date range
   - ✅ Totals calculated only for filtered rows

### Scenario 3: Contas a Pagar - Custos Ações (Status Filter)
**Objective**: Verify status filtering works correctly

**Steps**:
1. Navigate to `/contasapagar`
2. Set Status filter to "ABERTO"
3. Click "Gerar PDF (ações)" button
4. Verify PDF contains:
   - ✅ Filter line: "Status: ABERTO"
   - ✅ Only rows with status = ABERTO
   - ✅ Total pago should be R$ 0,00 (no paid items)

### Scenario 4: Contas a Pagar - Custos Ações (Search Filter)
**Objective**: Verify search filtering works correctly

**Steps**:
1. Navigate to `/contasapagar`
2. Enter a client name in the search box (e.g., "Maria")
3. Click "Gerar PDF (ações)" button
4. Verify PDF contains:
   - ✅ Filter line: "Busca: Maria"
   - ✅ Only rows matching the search query
   - ✅ PIX/Banco information still populated correctly

### Scenario 5: Contas a Pagar - Custos Ações (Combined Filters)
**Objective**: Verify multiple filters work together

**Steps**:
1. Navigate to `/contasapagar`
2. Set search query: "test"
3. Set date range: last 30 days
4. Set status: "PAGO"
5. Click "Gerar PDF (ações)" button
6. Verify PDF contains:
   - ✅ All three filter lines displayed
   - ✅ Only rows matching ALL filters
   - ✅ Correct totals

### Scenario 6: Contas a Pagar - Contas Fixas
**Objective**: Verify fixed accounts report works

**Steps**:
1. Navigate to `/contasapagar`
2. Scroll to "Contas Fixas" section
3. Click "Gerar PDF (fixas)" button
4. Verify PDF contains:
   - ✅ Title: "Contas a Pagar"
   - ✅ Section: "Contas Fixas"
   - ✅ Table with columns: Nome, Empresa, Tipo, Valor total, Vencimento, Status, Pago em
   - ✅ Correct totals for fixed accounts
   - ✅ Date filter information if applied

### Scenario 7: Contas a Receber (All Data)
**Objective**: Verify receivables report with staff PIX info

**Steps**:
1. Navigate to `/contasareceber`
2. Clear all filters
3. Click "Gerar PDF" button
4. Verify PDF contains:
   - ✅ Title: "Relatório - Contas a Receber"
   - ✅ Date range from first to last action
   - ✅ No filter information
   - ✅ Table with columns: Evento, Cliente, Data, Colaboradores, PIX, Valor total (R$)
   - ✅ **PIX column populated with PIX keys from colaboradorData**
   - ✅ Multiple staff members shown on separate lines for same action
   - ✅ Correct total a receber value

### Scenario 8: Contas a Receber (Date Filter - Vencimento)
**Objective**: Verify vencimento date filtering

**Steps**:
1. Navigate to `/contasareceber`
2. Select "Vencimento" mode
3. Set date range (e.g., last 30 days)
4. Click "Gerar PDF" button
5. Verify PDF contains:
   - ✅ Filter line: "Filtro Vencimento: [from] até [to]"
   - ✅ Only rows with vencimento in date range
   - ✅ PIX information still displayed correctly

### Scenario 9: Contas a Receber (Date Filter - Recebimento)
**Objective**: Verify recebimento date filtering

**Steps**:
1. Navigate to `/contasareceber`
2. Select "Recebimento" mode
3. Set date range
4. Click "Gerar PDF" button
5. Verify PDF contains:
   - ✅ Filter line: "Filtro Recebimento: [from] até [to]"
   - ✅ Only rows with recebimento in date range

### Scenario 10: Contas a Receber (Status Filter)
**Objective**: Verify status filtering for receivables

**Steps**:
1. Navigate to `/contasareceber`
2. Set Status to "RECEBIDO"
3. Click "Gerar PDF" button
4. Verify PDF contains:
   - ✅ Filter line: "Status: RECEBIDO"
   - ✅ Only received payments shown
   - ✅ Total matches sum of received amounts

### Scenario 11: Contas a Receber (Search Filter)
**Objective**: Verify search works for receivables

**Steps**:
1. Navigate to `/contasareceber`
2. Enter search query (client name or event name)
3. Click "Gerar PDF" button
4. Verify PDF contains:
   - ✅ Filter line: "Busca: [query]"
   - ✅ Only matching rows
   - ✅ PIX data from colaboradorData

### Scenario 12: Empty Results
**Objective**: Verify handling of no results

**Steps**:
1. Navigate to `/contasapagar` or `/contasareceber`
2. Set very restrictive filters (e.g., date range with no data)
3. Click "Gerar PDF" button
4. Verify: Alert message "Nenhum resultado para gerar o relatório"

## Data Validation Checklist

For each PDF generated, verify:

### PIX/Banco Data
- [ ] PIX column shows actual PIX keys (CPF, phone, email, random key)
- [ ] Banco column shows bank names when payment type is TED
- [ ] No MongoDB ObjectIds (`_id:...`) displayed
- [ ] No empty columns when data exists in database
- [ ] Fallback chain works: colaboradorData → staff → empty

### Filter Information
- [ ] Applied filters shown in PDF header
- [ ] Date ranges displayed in BR format (DD/MM/YYYY)
- [ ] Search query displayed correctly
- [ ] Status filter displayed when not "ALL"
- [ ] No filter lines shown when no filters applied

### Data Accuracy
- [ ] Row count matches filtered table
- [ ] Totals are accurate
- [ ] Date formatting consistent (DD/MM/YYYY)
- [ ] Currency formatting correct (R$ 1.234,56)
- [ ] All columns aligned properly
- [ ] Text truncation with ellipsis (…) when too long

## Known Edge Cases

1. **Staff without Colaborador record**: 
   - Should show staff name but empty PIX/Banco
   - No error should occur

2. **Colaborador without PIX/Banco**:
   - Columns should be empty (not show error)
   - Other data should display correctly

3. **Large datasets**:
   - PDF page height calculated dynamically
   - May result in very tall single-page PDFs
   - Consider pagination for production enhancement

4. **Special characters in names**:
   - Should be displayed correctly
   - No encoding issues

## Running the Test Script

Before manual testing, run the validation script:

```bash
node scripts/test-pdf-reports.js
```

This will verify:
- Database connectivity
- Colaboradores have PIX/banco data
- Actions have staff arrays
- ContasAPagar has colaboradorId references
- ContasAReceber exists and links to actions
- Collection counts

## Troubleshooting

### Issue: PIX/Banco still empty
**Solution**: 
- Check if colaboradorData is attached in API response
- Verify helper functions are called
- Check MongoDB for actual PIX/banco values

### Issue: Filter information not showing
**Solution**:
- Verify filter parameters passed to PDF function
- Check PDF page height calculation includes filter lines
- Ensure formatDateBR works correctly

### Issue: Wrong data in PDF
**Solution**:
- Compare filtered rows in UI with PDF rows
- Check useMemo dependencies for filteredReports
- Verify API endpoint applies correct filters

## Success Criteria

All scenarios pass when:
1. ✅ PIX/Banco columns always show correct data (never ObjectIds or empty when data exists)
2. ✅ Filter information accurately reflects applied filters
3. ✅ Row counts and totals match filtered UI table
4. ✅ PDFs generate without errors
5. ✅ All date/currency formatting is correct
6. ✅ No console errors during PDF generation
7. ✅ Generated PDFs download successfully

## Production Deployment Checklist

Before deploying to production:
- [ ] All 12 test scenarios pass
- [ ] Validation script runs successfully
- [ ] No errors in browser console during PDF generation
- [ ] PDFs verified on different browsers (Chrome, Firefox, Safari)
- [ ] Test with real production data subset
- [ ] Performance acceptable (< 3 seconds for typical report)
- [ ] Code review completed
- [ ] Changes committed to git with clear commit message
