# House Construction Management Web App

A production-minded Angular application for tracking a residential construction project from contract award to completion.

## What it covers

- Agency management for contractors and vendors
- Contract and milestone tracking
- Payment ledger and commitment tracking
- Daily site progress logging with evidence notes
- Expense recording by category and status
- Document/photo evidence list
- Project report summary for cost and progress visibility
- Protected app shell with sign-in flow and dashboard navigation

## Tech stack

- Angular 21
- TypeScript
- Standalone Angular components
- Signals for local state handling
- Supabase-ready service layer for future persistence

## Run locally

```bash
npm install
npm start
```

Then open:

http://localhost:4200/

## Production architecture

This project is designed to stay low-cost:

- Frontend: Angular app hosted on Vercel
- Backend/data layer: Supabase Auth + PostgreSQL + Storage
- Domain: your own custom domain or subdomain
- Estimated recurring cost: ₹0 beyond your domain and hosting subscriptions you already own

## Recommended deployment plan

1. Create a Supabase project
2. Add your auth URL and anon key to environment configuration
3. Create tables for agencies, contracts, milestones, payments, progress, expenses
4. Add row-level security rules for project owner access
5. Deploy the frontend to Vercel and connect your domain
6. Configure environment variables in Vercel

## Demo credential

This app includes a local demo login flow for initial development and testing.

## Build validation

```bash
npm run build
```

The current build passes successfully in the project.
