# TravelDesk Pro

**The all-in-one SaaS platform for modern travel agencies.**

Built for Omani travel agencies. Manage customers, bookings, invoices, agents, and commissions — all in one place.

## What's Inside
- ✅ Real-time booking management (Air tickets, Visa, Hotel, Group tours)
- ✅ Customer database with passport & contact details
- ✅ Invoice generation with PDF print
- ✅ Agent commission tracking & performance reports
- ✅ Multi-tenant isolation (each agency sees only its own data)
- ✅ Role-based access control (Owner, Admin, Manager, Agent, Accountant, Viewer)
- ✅ Arabic + English language support
- ✅ Cloud database with Supabase
- ✅ Ready for Vercel deployment

## Files You Need to Read

| File | What it is |
|------|-----------|
| `DEPLOY.md` | Step-by-step guide to put your software on the internet (Vercel + Supabase + Domain) |
| `BUSINESS.md` | How you make money, how to get your first customer, pricing strategy |
| `FIRST_CUSTOMER.md` | Exact copy-paste steps to create an agency account when they say YES |
| `supabase_schema.sql` | Database schema — copy-paste into Supabase SQL Editor |

## Quick Start (No Coding)

1. **Buy domain**: `traveldeskpro.app` (Namecheap or GoDaddy)
2. **Create Supabase project**: [supabase.com](https://supabase.com) → paste `supabase_schema.sql`
3. **Push to GitHub**: upload this folder to a new private repository
4. **Deploy to Vercel**: [vercel.com/new](https://vercel.com/new) → import your repo → add Supabase keys
5. **Connect domain**: Vercel settings → add `traveldeskpro.app`

Detailed instructions in `DEPLOY.md`.

## Technology Stack
- Next.js 14 + React 18 + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Vercel hosting

## Business Model
- Monthly SaaS subscription
- Plans: Starter 30 OMR / Professional 40 OMR / Enterprise 150 OMR
- Target: Travel agencies in Oman
- Goal: 50 paying agencies = 2,000 OMR/month

Read `BUSINESS.md` for the full customer acquisition plan.

---

**Stop building. Start selling.**
