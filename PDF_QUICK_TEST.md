# PDF Reports - Quick Testing Reference

## 🚀 Quick Start

```bash
# 1. Validate database
node scripts/test-pdf-reports.js

# 2. Start dev server
npm run dev

# 3. Login and navigate to:
#    - /contasapagar (2 PDFs: actions + fixed)
#    - /contasareceber (1 PDF: receivables)
```

## ✅ What to Check in Each PDF

### All PDFs
- [ ] Title and date range displayed
- [ ] Filter information shown (search, date, status)
- [ ] Totals are accurate
- [ ] Dates in BR format (DD/MM/YYYY)
- [ ] Currency in BR format (R$ 1.234,56)
- [ ] Downloads successfully

### Contas a Pagar - Custos Ações
- [ ] **PIX column has data** (not empty, not ObjectIds)
- [ ] **Banco column has data** when pgt=TED
- [ ] Colaborador column shows names correctly
- [ ] Filtered rows match UI table
- [ ] Status column matches data

### Contas a Pagar - Contas Fixas
- [ ] Nome, Empresa, Tipo columns filled
- [ ] Vencimento dates correct
- [ ] Status (ABERTO/PAGO) accurate
- [ ] Totals match filtered data

### Contas a Receber
- [ ] **PIX column shows PIX keys**
- [ ] Multiple staff per action on separate lines
- [ ] Colaboradores column has names
- [ ] Filtered rows match UI table
- [ ] Total a receber is accurate

## 🧪 Test Combinations

### Priority 1 (Must Test)
1. ✅ **All data** (no filters)
2. ✅ **Date range filter**
3. ✅ **Status filter**

### Priority 2 (Should Test)
4. ✅ **Search filter**
5. ✅ **Combined filters** (search + date + status)

### Priority 3 (Nice to Test)
6. ✅ **Empty results** (restrictive filters)
7. ✅ **Single result**
8. ✅ **Large dataset** (100+ rows)

## 🐛 Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| PIX/Banco empty | Database missing data | Check MongoDB |
| Filters not shown | Parameters not passed | Check page.js calls |
| Wrong totals | Filter not applied | Check filteredReports |
| PDF won't download | Browser block | Check console errors |
| ObjectIds in PIX | Fallback chain broken | Check colaboradorData |

## 📊 Expected Results

### Example 1: All Data
```
Title: Custos ações
Período: 01/01/2024 - 31/01/2024
Total a pagar: R$ 15.430,00
Total pago: R$ 8.200,00

[Table with 23 rows, all with PIX/Banco filled]
```

### Example 2: With Filters
```
Title: Custos ações
Período: 15/01/2024 - 20/01/2024
Busca: Maria
Filtro Vencimento: 15/01/2024 até 20/01/2024
Status: ABERTO
Total a pagar: R$ 2.340,00
Total pago: R$ 0,00

[Table with 5 matching rows]
```

## 🎯 Success Criteria

**Pass**: All checkboxes ✅ for all 3 report types
**Fail**: Any empty PIX/Banco when data exists in DB
**Fail**: Filter mismatch between UI and PDF
**Fail**: Totals don't match
**Fail**: Console errors during generation

## 📝 Reporting Issues

If you find issues, note:
1. Which PDF type (contasapagar ações/fixas, contasareceber)
2. What filters were applied
3. What column is wrong
4. Expected vs Actual values
5. Screenshot of UI table
6. Screenshot of PDF output

## ⚡ Quick Commands

```bash
# Check database counts
node scripts/test-pdf-reports.js | grep "Database counts" -A 5

# Check for PIX data
node scripts/test-pdf-reports.js | grep "PIX" -A 10

# Check for staff data
node scripts/test-pdf-reports.js | grep "staff" -A 10
```

## 📚 Full Documentation

- Detailed guide: `docs/PDF_TESTING_GUIDE.md`
- Technical summary: `docs/PDF_FIX_SUMMARY.md`
- Testing plan: `TESTING_PLAN.md`
