# Database Seeding Scripts

This folder contains scripts to manage database operations including seeding, cleaning, and migrations.

## Available Scripts

### `seed-db.js` - Complete Database Seeding

**Purpose:** Seeds the database with realistic 1-year operational data for a marketing/advertising agency.

**What it creates:**
- **50 Colaboradores** (47 Pessoa Física + 3 Pessoa Jurídica service providers)
- **7 Clientes** (major brands in revenue order: Coca-Cola, Uberlandia Refrescos, Ambev, etc.)
- **12 months of Actions** (~60-70k monthly revenue)
- **Contas a Receber** (automatically created for all actions, 70% received for old actions)
- **Contas a Pagar** (automatically created for staff and costs, 75% paid for old costs)
- **8 Contas Fixas** (recurring monthly costs: rent, utilities, insurance, etc.)

**Financial Parameters:**
- Target monthly revenue: R$ 60,000 - 70,000
- Profit margin: 30-35%
- Client revenue distribution:
  - Coca-Cola: 30%
  - Uberlandia Refrescos: 20%
  - Ambev: 18%
  - Rede Bandeirantes: 12%
  - Center Shopping: 10%
  - Unitri: 7%
  - Flavio Calçados: 3%

**Usage:**
```bash
npm run db:seed
```

**⚠️ Warning:** This script will **DELETE ALL DATA** except User accounts before seeding.

**Output:**
The script provides a comprehensive financial summary including:
- Total actions and revenue
- Total costs and expenses
- Profit margin
- Contas a receber/pagar statistics
- Payment status breakdown

---

## Other Database Scripts

### `cleanDb.js`
Cleans all database collections except Users.
```bash
npm run db:clean
```

### `seedUsers.js`
Seeds only user accounts.
```bash
npm run db:seed:users
```

### `seedDemo.js`
Seeds minimal demo data (alternative to full seed).
```bash
npm run db:seed:demo
npm run db:reset:demo  # Clean + seed demo
```

### `lib/db/seedAll.mjs`
Legacy full database reset.
```bash
npm run db:reset
```

---

## Testing the Seeded Data

After running the seed script, test the following:

### 1. Dashboard Verification
- Navigate to `/dashboard`
- Check **Receita Prevista** shows ~R$ 60-70k/month average
- Verify **Margem de Lucro** is between 30-35%
- Review monthly charts for realistic distribution

### 2. Client Filtering
- Use the client dropdown to filter by each client
- Verify each client shows appropriate revenue
- Specially test **Unitri** (previously showed 0 due to bug)

### 3. Contas a Receber
- Navigate to contas a receber page
- Verify mix of RECEBIDO (received) and ABERTO (open) statuses
- Check that older actions (>45 days) are mostly received

### 4. Contas a Pagar
- Navigate to contas a pagar page
- Verify mix of PAGO (paid) and ABERTO (open) statuses
- Check that older costs (>30 days) are mostly paid

### 5. Actions
- Browse the actions list
- Verify actions span 12 months
- Check staff and costs are properly attached
- Verify different action types (Campanha Digital, Produção de Vídeo, etc.)

### 6. Colaboradores
- Check 50 colaboradores exist
- Verify 47 Pessoa Física (individuals)
- Verify 3 Pessoa Jurídica (service businesses)
- Check realistic Brazilian names, CPF/CNPJ, banking info

### 7. Clientes
- Verify 7 clients exist in correct order
- Check all contact and banking information is populated

---

## Data Structure

The seed script maintains proper relationships:

```
Action
├─→ staff[] (references Colaborador._id)
├─→ costs[] (subdocuments with category and value)
└─→ clientId (references Cliente._id)
    │
    ├─→ ContasAReceber (one per Action)
    │   └── value: action.value
    │
    └─→ ContasAPagar (multiple per Action)
        ├── for each staff member
        └── for each cost item
```

---

## Customization

To modify the seeded data, edit these sections in `seed-db.js`:

- **Line ~30-50**: Brazilian names pools
- **Line ~60-100**: Client definitions (7 companies)
- **Line ~110-130**: Contas fixas (recurring costs)
- **Line ~140-160**: Financial parameters (revenue targets, profit margins)
- **Line ~170-200**: Action types (event types offered by agency)

---

## Troubleshooting

### Script fails with connection error
Ensure MongoDB is running and `.env.local` has correct `MONGODB_URI`:
```env
MONGODB_URI=mongodb://localhost:27017/sistema-ana
```

### Financial totals don't match expectations
Check the summary output - the script calculates exact distributions to maintain:
- 60-70k monthly revenue
- 30-35% profit margins
- Realistic client distribution

### Dashboard shows incorrect data
1. Verify the seed completed successfully (check console output)
2. Refresh the dashboard page
3. Check browser console for any errors
4. Verify API endpoints are returning correct data structure

---

## Development Notes

**Created:** Based on production bug fixes and dashboard accuracy requirements

**Purpose:** Provide realistic test data for comprehensive application testing, especially dashboard financial metrics.

**Maintenance:** When adding new fields to models, update this script to include realistic data for those fields.
