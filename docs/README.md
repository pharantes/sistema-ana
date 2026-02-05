# Sistema ANA - Documentation

## Overview
Sistema ANA is a financial management system built with Next.js 14, MongoDB, and Next-Auth.

## Key Features
- **Authentication**: Role-based access control (Admin/Staff)
- **Client Management**: Track clients and their information
- **Collaborator Management**: Manage staff with PIX/bank details
- **Action Tracking**: Project actions with costs and staff assignments
- **Financial Tracking**: 
  - Contas a Pagar (Accounts Payable)
  - Contas a Receber (Accounts Receivable)
  - Contas Fixas (Fixed Costs)
- **Dashboard**: Financial overview with charts and KPIs
- **PDF Reports**: Generate filtered reports with PIX/bank information

## Tech Stack
- **Frontend**: React 19, Next.js 14 (App Router), Styled Components
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: NextAuth.js with credentials provider
- **Charts**: Nivo charts (@nivo/bar, @nivo/line, @nivo/pie)
- **PDF Generation**: pdf-lib (client-side)
- **Validation**: Zod schemas
- **Styling**: Styled Components

## Project Structure
```
app/
  ├── api/              # API routes
  │   ├── action/       # Action endpoints
  │   ├── auth/         # NextAuth endpoints
  │   ├── cliente/      # Client endpoints
  │   ├── colaborador/  # Collaborator endpoints
  │   ├── contafixa/    # Fixed costs endpoints
  │   ├── contasapagar/ # Payables endpoints
  │   └── contasareceber/ # Receivables endpoints
  ├── components/       # Reusable components
  │   ├── ui/           # UI primitives
  │   └── *.js          # Feature components
  ├── (features)/       # Feature pages
  │   ├── acoes/        # Actions
  │   ├── clientes/     # Clients
  │   ├── colaboradores/ # Collaborators
  │   ├── contasapagar/ # Payables
  │   ├── contasareceber/ # Receivables
  │   ├── dashboard/    # Dashboard
  │   └── documentation/ # In-app docs
  └── utils/            # Utility functions
lib/
  ├── api/              # API utilities (responses, rate limiting)
  ├── auth/             # Authentication config
  ├── db/               # Database models and connection
  ├── utils/            # Shared utilities (dates, currency, mongo)
  └── validators/       # Zod validation schemas
scripts/
  ├── seed-db.js        # Database seeding
  └── test-db-connection.js  # Connection testing
```

## Environment Variables
Required in `.env.local`:
```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Clean and reseed database

## Database Models
- **User**: Authentication and role management (admin/staff)
- **Cliente**: Client information (name, email, phone, bank details)
- **Colaborador**: Staff/collaborator details with PIX/bank info
- **Action**: Project actions with staff assignments and costs
- **ContasAPagar**: Accounts payable linked to actions/collaborators
- **ContasAReceber**: Accounts receivable linked to actions
- **ContaFixa**: Fixed recurring costs

## Authentication
- Admin users have full access to all features
- Staff users have limited access (read-only for financial data)
- Session-based authentication via NextAuth.js
- Protected API routes with session validation

## PDF Generation
PDF reports are generated client-side using pdf-lib with:
- Filter information displayed in header
- PIX/bank details from collaborator data
- Proper totals and summaries
- Currency formatting in BRL (R$)

## Code Patterns

### Component Structure
```javascript
// Use shared components
import { DataTable, Modal, DeleteModal } from '@/app/components';
import * as FE from '@/app/components/FormElements';
import * as FL from '@/app/components/FormLayout';
```

### API Response Format
```javascript
import { ok, badRequest, unauthorized, serverError } from '@/lib/api/responses';

// Success
return ok({ data: result });

// Error
return badRequest('Invalid input');
```

### Date Formatting
```javascript
import { formatDateBR, formatDateTimeBR, parseDateMaybe } from '@/lib/utils/dates';

const formatted = formatDateBR(date); // DD/MM/YYYY
```

### Currency Formatting
```javascript
import { formatBRL, parseCurrency } from '@/utils/currency';

const formatted = formatBRL(1234.56); // R$ 1.234,56
```

## Development

### Adding a New Feature
1. Create API route in `app/api/[feature]/route.js`
2. Add validation schema in `lib/validators/`
3. Create page in `app/[feature]/page.js`
4. Add components if needed in `app/components/`
5. Update navigation in `app/NavBar.js`

### Database Connection
- Uses Mongoose ODM with connection pooling
- Models auto-pluralize: `Colaborador` → `colaboradors`
- Connection string from `MONGODB_URI` env variable

### Error Handling
- API routes return standardized error responses
- Client-side error boundaries catch React errors
- Loading states for async operations
- Empty states for zero-data scenarios
- Link related documentation
- Use clear, concise language

## 📊 Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| CODE_ORGANIZATION.md | ✅ Current | 2025-10-14 |
| REFACTORING_SUMMARY.md | ✅ Current | 2025-10-14 |
| AUTH_FLOW_FIX.md | ✅ Current | 2025-10-14 |
| PASSWORD_TOGGLE_FEATURE.md | ✅ Current | 2025-10-14 |
| MIGRATION_EXAMPLE.js | ✅ Current | 2025-10-14 |

## 🆘 Getting Help

1. Check relevant documentation above
2. Review code examples in MIGRATION_EXAMPLE.js
3. Look for similar patterns in codebase
4. Ask team members

## 🔗 External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [styled-components](https://styled-components.com)
- [NextAuth.js](https://next-auth.js.org)
- [MongoDB](https://www.mongodb.com/docs)
