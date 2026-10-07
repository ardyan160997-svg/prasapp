# PrasFinance — Family Finance Tracker

Aplikasi pencatat keuangan keluarga (pemasukan, pengeluaran, tabungan, rencana ke depan) dibangun di monorepo `prasapp` bersama sibling apps: `novia`, `prashoes`, `prastation`.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL via Prisma ORM
- **Styling:** Tailwind CSS v4
- **Fonts:** Nunito (sans), Quicksand (display)
- **Auth:** Simple household shared password (MVP), extensible to member-based
- **Deploy:** VPS / Coolify / reverse proxy, subdomain `finance.prasapp.com`

## Project Structure
```
prasfinance/
├── prisma/
│   ├── schema.prisma       # Data model per PRD
│   └── migrations/         # Generated
├── src/
│   ├── app/
│   │   ├── api/            # API routes (to be added)
│   │   ├── dashboard/      # Dashboard page
│   │   ├── login/          # Household login
│   │   ├── transactions/   # Ledger page
│   │   ├── savings/        # Savings goals page
│   │   ├── plans/          # Future plans page
│   │   ├── settings/       # Household settings
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Landing page
│   │   └── globals.css     # Tailwind + custom theme
│   ├── lib/
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── utils.ts        # Formatters (rupiah, date)
│   │   └── auth.ts         # Session helpers
│   └── components/         # Reusable UI (to be added)
├── .env.example            # Env template
├── .env                    # Local dev env (gitignored)
├── next.config.ts          # Standalone output for prod
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── prisma.config.ts
└── package.json
```

## Quick Start
```bash
cd prasapp/prasfinance

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run dev server (port 3002)
npm run dev
```

## Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase or self-hosted) |
| `HOUSEHOLD_PASSWORD` | Shared password for household access (MVP) |
| `NEXT_PUBLIC_SITE_URL` | Public URL for production |
| `PORT` / `HOST` | Dev server binding |

## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with webpack on port 3002 |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations in dev |

## Data Model Overview (from PRD)
- **Household** — Unit keluarga, punya banyak member
- **Member** — Anggota keluarga (owner/member)
- **Category** — Kategori pemasukan/pengeluaran per household
- **Transaction** — Pemasukan/pengeluaran, linked ke member & category
- **SavingsGoal** — Target tabungan per tujuan
- **SavingsEntry** — Setoran tabungan ke goal
- **FinancialPlan** — Rencana biaya masa depan (due date, priority)
- **InviteToken** — Token invite member (future)

## Deployment Notes
- Target subdomain: `finance.prasapp.com`
- Same VPS/Coolify pattern as `novia.prasapp.com`
- Output: `standalone` for Docker/Coolify
- SSL via Let's Encrypt via reverse proxy

## Related Docs
- PRD + Workflow: `.hermes/plans/2026-08-23_034021-family-finance-app-prd.md`