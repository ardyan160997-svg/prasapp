# RW6 Selor

Monorepo portal desa/kampung RW 6 Selor.

## Apps
- `apps/desa` — portal utama desa/kampung
- `apps/portal-unit` — portal subdomain RT dan Karang Taruna
- `apps/admin` — panel admin internal

## Packages
- `packages/ui` — komponen UI bersama
- `packages/shared` — utilitas, data mock, helper tenant
- `packages/config` — config bersama

## Commands
```bash
corepack pnpm install
corepack pnpm prisma generate
corepack pnpm lint
corepack pnpm build
```
