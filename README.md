# Sistema Ana

A comprehensive business management system built with Next.js for managing clients, collaborators, actions, and financial accounts.

## 📚 Documentation

**Quick Links:**
- **[Documentation Index](./docs/README.md)** - Complete documentation catalog
- **[CODE_ORGANIZATION.md](./CODE_ORGANIZATION.md)** - Architecture & patterns (START HERE)
- **[Migration Examples](./docs/MIGRATION_EXAMPLE.js)** - Before/after refactoring examples
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - Summary of improvements

**Feature Guides:**
- [Authentication Flow](./docs/AUTH_FLOW_FIX.md) - Login, session management
- [Password Toggle](./docs/PASSWORD_TOGGLE_FEATURE.md) - Password visibility feature
- [Dashboard Fixes](./docs/DASHBOARD_FIX_REPORT.md) - KPI and chart improvements

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Maintenance

### Clean database (preserve users)

Delete all data except users (also clears NextAuth accounts/sessions) using a single script:

```bash
npm run db:clean
```

Requires `MONGODB_URI` in `.env.local`.

### Seed data

```bash
# Seed only users
npm run db:seed:users

# Clean then seed demo data
npm run db:reset
```
