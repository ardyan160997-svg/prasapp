# Family Finance App Implementation Plan + PRD

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Menyiapkan workflow produk dan PRD untuk aplikasi pencatat keuangan keluarga baru di dalam monorepo `prasapp`, sebelum masuk tahap UI/UX.

**Architecture:** Aplikasi baru dibuat sebagai project Next.js terpisah di dalam folder `prasapp`, mengikuti pola project lain di repo ini (`novia`, `prashoes`, `prastation`). Fokus fase ini bukan coding, tapi menyepakati alur bisnis, role user, struktur data inti, scope MVP, dan kebutuhan deployment supaya nanti build UI/API/DB bisa lurus dari awal.

**Tech Stack:** Monorepo folder-based, Next.js, Prisma, PostgreSQL (prod), Tailwind, static/simple auth atau invitation-based household access, deploy via subdomain + reverse proxy / Coolify.

---

## SELECTED_COMBO

```text
SELECTED_COMBO: plan
REASON: user minta workflow dan PRD dulu sebelum UI/UX; ini tahap arsitektur produk dan scope definition
SCOPE: dokumen workflow produk, PRD, data model awal, roadmap implementasi, deployment/subdomain plan untuk app baru di monorepo prasapp
RISK: medium
```

---

# 1. Ringkasan Produk

## Nama kerja
- Opsi internal: `prasfinance`, `rumah-finance`, atau `keluargakuangan`
- Rekomendasi folder monorepo: `prasfinance`
- Rekomendasi subdomain: `finance.prasapp.com` atau `keluarga.prasapp.com`

## Problem statement
Keluarga butuh satu tempat sederhana untuk mencatat:
- pemasukan,
- pengeluaran,
- tabungan,
- rencana keuangan ke depan,
- dan progres target,

agar suami/istri atau anggota keluarga yang diberi akses bisa input dari device masing-masing tanpa ribet spreadsheet manual.

## Product vision
Aplikasi keuangan keluarga yang ringan, gampang dipakai bareng, dan fokus ke kebiasaan harian: catat uang masuk, uang keluar, alokasi tabungan, dan tujuan masa depan dalam satu dashboard keluarga.

## Success outcome MVP
Dalam 1-2 menit user bisa:
1. masuk ke household,
2. tambah pemasukan/pengeluaran,
3. lihat saldo berjalan,
4. lihat tabungan per tujuan,
5. lihat rencana ke depan dan progresnya.

---

# 2. Workflow Produk

## 2.1 Role pengguna

### Primary roles
1. **Owner keluarga**
   - buat household
   - invite anggota
   - atur kategori utama
   - lihat semua data
   - set target tabungan dan rencana

2. **Member keluarga**
   - input pemasukan
   - input pengeluaran
   - input kontribusi tabungan
   - update progress rencana bila diizinkan
   - lihat dashboard household

### Future roles
3. **Viewer only**
   - hanya lihat ringkasan
4. **Child / limited member**
   - hanya bisa input kategori tertentu atau nominal terbatas

## 2.2 Workflow utama user

### A. Onboarding household
1. Owner buka app.
2. Owner buat household baru.
3. Owner isi nama keluarga.
4. Owner set mata uang default: IDR.
5. Owner tambah anggota awal.
6. Owner set kategori pemasukan dan pengeluaran default.
7. Owner masuk ke dashboard utama.

### B. Workflow catat pemasukan
1. User pilih menu `Pemasukan`.
2. Klik `Tambah pemasukan`.
3. Isi:
   - tanggal,
   - nominal,
   - kategori,
   - sumber pemasukan,
   - catatan opsional,
   - siapa yang input.
4. Simpan.
5. Sistem update saldo household dan ringkasan bulan berjalan.

### C. Workflow catat pengeluaran
1. User pilih menu `Pengeluaran`.
2. Klik `Tambah pengeluaran`.
3. Isi:
   - tanggal,
   - nominal,
   - kategori,
   - kebutuhan/keinginan,
   - metode bayar,
   - catatan,
   - siapa yang belanja.
4. Simpan.
5. Sistem kurangi saldo berjalan.
6. Sistem update insight per kategori.

### D. Workflow tabungan
1. User buka menu `Tabungan`.
2. Buat tujuan tabungan, misalnya:
   - dana darurat,
   - biaya sekolah,
   - liburan,
   - beli motor,
   - renovasi rumah.
3. Set target nominal dan target date.
4. User input setoran tabungan berkala.
5. Sistem hitung progres target, sisa target, dan estimasi tercapai.

### E. Workflow rencana ke depan
1. User buka menu `Rencana`.
2. Tambah plan finansial, contoh:
   - bayar kontrakan 6 bulan lagi,
   - persiapan kelahiran,
   - beli laptop,
   - mudik lebaran.
3. Isi:
   - nama rencana,
   - target biaya,
   - due date,
   - prioritas,
   - status,
   - catatan.
4. Sistem tampilkan kebutuhan dana bulanan agar target tercapai.
5. User review progres secara berkala.

### F. Workflow review bulanan
1. Buka dashboard bulan berjalan.
2. Lihat total pemasukan, pengeluaran, net flow.
3. Lihat kategori terbesar.
4. Lihat tabungan bertambah atau turun.
5. Lihat target/rencana yang on track atau tertinggal.
6. Tentukan tindakan bulan depan.

---

# 3. PRD

## 3.1 Product summary
Aplikasi web keuangan keluarga berbasis household bersama. Satu household punya banyak anggota. Semua anggota yang diizinkan bisa mencatat transaksi dan melihat ringkasan keuangan keluarga secara realtime.

## 3.2 Goals

### Business goals
- Menambah aplikasi baru di ekosistem `prasapp`.
- Siap deploy cepat ke subdomain sendiri.
- Bisa berkembang jadi produk internal keluarga dulu, lalu reusable untuk household lain.

### User goals
- Mencatat uang masuk/keluar dengan cepat.
- Mengetahui sisa uang keluarga saat ini.
- Memisahkan tabungan dari pengeluaran biasa.
- Menjaga rencana masa depan tetap terpantau.
- Bisa dipakai bersama pasangan/anggota keluarga.

## 3.3 Non-goals untuk MVP
- Integrasi bank otomatis.
- OCR struk.
- Multi-currency.
- Akuntansi double-entry lengkap.
- Budget AI recommendation.
- Integrasi WhatsApp/Telegram bot.
- Lampiran file bukti transaksi.

## 3.4 Target users
- Pasangan suami istri.
- Keluarga kecil 2-5 orang.
- User yang sebelumnya pakai catatan manual atau spreadsheet sederhana.

## 3.5 Core use cases
1. Sebagai suami/istri, saya ingin mencatat pemasukan agar saldo keluarga akurat.
2. Sebagai suami/istri, saya ingin mencatat pengeluaran harian agar tahu uang habis ke mana.
3. Sebagai keluarga, kami ingin punya tabungan per tujuan agar target besar lebih jelas.
4. Sebagai keluarga, kami ingin punya rencana biaya masa depan agar tidak kaget saat jatuh tempo.
5. Sebagai owner, saya ingin mengundang anggota keluarga agar pencatatan tidak bergantung satu orang.

---

# 4. MVP Scope

## 4.1 Modul MVP

### Modul 1 — Household & Access
- Buat household
- Join/invite member
- Role owner/member
- Session auth sederhana

### Modul 2 — Dashboard
- Ringkasan bulan ini
- Total pemasukan
- Total pengeluaran
- Net flow
- Total tabungan aktif
- Upcoming plans

### Modul 3 — Transaction Ledger
- Tambah/edit/hapus pemasukan
- Tambah/edit/hapus pengeluaran
- Filter by date/category/member
- Riwayat transaksi

### Modul 4 — Savings Goals
- Buat target tabungan
- Tambah setoran tabungan
- Progress bar
- Estimasi kekurangan

### Modul 5 — Future Plans
- Buat rencana biaya masa depan
- Target date
- Nominal kebutuhan
- Prioritas
- Status plan

### Modul 6 — Reports ringan
- Ringkasan bulanan
- Breakdown kategori pengeluaran
- Trend pemasukan vs pengeluaran

## 4.2 MVP screens list
1. Login / access page
2. Household setup page
3. Main dashboard
4. Transaction list page
5. Add transaction page / modal
6. Savings goals page
7. Savings goal detail
8. Plans page
9. Plan detail
10. Settings / members / categories

---

# 5. Functional Requirements

## 5.1 Household & membership
- User bisa membuat satu household.
- Household punya banyak member.
- Owner bisa invite member.
- Owner bisa deactivate member.
- Semua data terikat ke `householdId`.

## 5.2 Transactions
- Transaction punya type: `income` atau `expense`.
- Transaction wajib punya nominal, tanggal, kategori, dan creator.
- Expense bisa ditandai `needs` atau `wants`.
- Bisa tambah catatan.
- Bisa soft delete untuk audit ringan.

## 5.3 Savings goals
- Savings goal punya nama, target amount, current amount, target date, status.
- Setiap setoran tabungan terekam sebagai entry terpisah.
- Progress dihitung otomatis.

## 5.4 Future plans
- Plan punya title, estimated amount, due date, priority, status.
- Plan bisa dikaitkan ke savings goal, tapi optional di MVP.
- Sistem tampilkan monthly required saving estimate.

## 5.5 Dashboard
- Menampilkan current month summary.
- Menampilkan cashflow summary.
- Menampilkan top expense categories.
- Menampilkan active savings goals.
- Menampilkan plans due soon.

## 5.6 Reporting
- Filter per bulan.
- Ringkasan pemasukan vs pengeluaran.
- Ringkasan per kategori.
- Riwayat transaksi terbaru.

---

# 6. Non-Functional Requirements

## Performance
- Dashboard initial load target < 2 detik pada data household kecil-menengah.
- Input transaksi harus terasa instant.

## Security
- Data antar household harus terisolasi penuh.
- Session pakai cookie `httpOnly`.
- Semua query wajib scoped ke `householdId`.
- Role checks minimal owner/member.

## Reliability
- Create/edit/delete transaksi harus transactional bila mempengaruhi aggregate.
- Audit fields wajib: createdAt, updatedAt, createdBy.

## Usability
- Form input cepat di mobile.
- Nominal mudah dibaca format rupiah.
- Aksi paling sering maksimal 2 klik dari dashboard.

## Maintainability
- Struktur app mengikuti pola project `novia` agar cepat dirakit.
- Prisma schema rapi, extensible, tanpa over-engineering awal.

---

# 7. Data Model Draft

## Core entities

### Household
- id
- name
- currency
- createdAt
- updatedAt

### Member
- id
- householdId
- name
- emailOrPhone optional
- role (`owner`, `member`)
- isActive
- createdAt
- updatedAt

### Category
- id
- householdId
- type (`income`, `expense`)
- name
- icon optional
- color optional
- isDefault
- isActive

### Transaction
- id
- householdId
- memberId
- type (`income`, `expense`)
- categoryId
- amount
- transactionDate
- note optional
- expenseMode optional (`needs`, `wants`)
- paymentMethod optional
- isDeleted
- createdAt
- updatedAt

### SavingsGoal
- id
- householdId
- name
- targetAmount
- targetDate optional
- currentAmount cached/derived
- status (`active`, `completed`, `paused`, `cancelled`)
- note optional
- createdAt
- updatedAt

### SavingsEntry
- id
- householdId
- savingsGoalId
- memberId
- amount
- entryDate
- note optional
- createdAt

### FinancialPlan
- id
- householdId
- title
- estimatedAmount
- dueDate
- priority (`low`, `medium`, `high`)
- status (`planned`, `in_progress`, `ready`, `completed`, `cancelled`)
- linkedSavingsGoalId optional
- note optional
- createdAt
- updatedAt

### InviteToken
- id
- householdId
- token
- role
- expiresAt
- usedAt optional
- createdAt

---

# 8. Business Rules

1. Semua record wajib punya `householdId`.
2. Member nonaktif tidak bisa input transaksi baru.
3. Hanya owner yang bisa manage members dan categories default.
4. Savings goal progress dihitung dari total `SavingsEntry` yang valid.
5. Soft-deleted transaction tidak ikut summary.
6. Future plan tetap tampil meski belum terhubung ke savings goal.
7. Dashboard default ke bulan berjalan.

---

# 9. Recommended Information Architecture

## App sections
- `/` landing atau household dashboard
- `/login`
- `/setup`
- `/dashboard`
- `/transactions`
- `/transactions/new`
- `/savings`
- `/savings/[id]`
- `/plans`
- `/plans/[id]`
- `/settings/members`
- `/settings/categories`

## API sections
- `/api/auth/*`
- `/api/household/*`
- `/api/transactions/*`
- `/api/savings/*`
- `/api/plans/*`
- `/api/reports/*`

---

# 10. Monorepo Placement Plan

## Recommended folder
- `/Users/ardyan.prasetya/Documents/prasapp/prasfinance`

## Reason
- Konsisten dengan sibling apps: `novia`, `prashoes`, `prastation`
- Gampang deploy per app ke subdomain berbeda
- Dependency isolation tetap sederhana

## Proposed bootstrapping path
1. clone structure dasar dari app Next.js existing yang paling dekat
2. sesuaikan branding dan domain
3. buat Prisma schema baru khusus finance
4. buat auth + household access
5. lanjut ke transactions, savings, plans

---

# 11. Deployment & Subdomain Plan

## Recommended domain setup
- App name: `prasfinance`
- Subdomain recommended: `finance.prasapp.com`

## Infra assumptions
- Deploy target tetap VPS / Coolify / reverse proxy yang sudah dipakai `novia`
- SSL via Let's Encrypt
- Env terpisah per app
- PostgreSQL pakai Supabase atau DB terpusat lain

## DNS / cutover workflow
1. siapkan app di folder `prasfinance`
2. deploy preview / staging internal
3. build production config
4. tambah subdomain di DNS
5. arahkan reverse proxy / Coolify ke app baru
6. pasang SSL
7. smoke test:
   - homepage
   - login
   - create transaction
   - load dashboard

## Env minimum
- `DATABASE_URL`
- `EDITOR_PASSWORD` atau auth secret pengganti
- `APP_URL`
- `SESSION_SECRET`

---

# 12. Milestone Plan

## Phase 0 — Planning
- finalisasi PRD
- finalisasi naming app + subdomain
- finalisasi scope MVP

## Phase 1 — Foundation
- bootstrap app folder baru
- setup Next.js + Prisma + DB
- auth dasar
- household entity

## Phase 2 — Core Ledger
- income/expense CRUD
- categories
- dashboard summary

## Phase 3 — Savings
- savings goals
- savings entries
- progress calculation

## Phase 4 — Future Planning
- financial plans
- due-soon widget
- monthly target estimate

## Phase 5 — Reporting & hardening
- monthly report
- filters
- mobile polish
- deployment final

---

# 13. Step-by-Step Execution Plan

### Task 1: Finalize product naming and domain
**Objective:** Menentukan identitas app supaya folder, env, deployment, dan branding konsisten.

**Files:**
- Create later: `prasfinance/README.md`
- Reference: `/Users/ardyan.prasetya/Documents/prasapp/.hermes/plans/2026-08-23_034021-family-finance-app-prd.md`

**Steps:**
1. Pilih nama final app.
2. Pilih subdomain final.
3. Konfirmasi apakah app hanya untuk satu keluarga dulu atau multi-household reusable dari awal.

**Validation:**
- Nama folder, app title, dan subdomain sudah fixed.

### Task 2: Create new app folder in monorepo
**Objective:** Menambah project baru di `prasapp` tanpa mengganggu app existing.

**Files:**
- Create: `/Users/ardyan.prasetya/Documents/prasapp/prasfinance/*`
- Reference sibling apps:
  - `/Users/ardyan.prasetya/Documents/prasapp/novia`
  - `/Users/ardyan.prasetya/Documents/prasapp/prashoes`
  - `/Users/ardyan.prasetya/Documents/prasapp/prastation`

**Steps:**
1. Scaffold Next.js app baru.
2. Samakan baseline config dengan app sibling yang paling cocok.
3. Setup package scripts, lint, and deploy shape.

**Validation:**
- `npm install`
- `npm run lint`
- `npm run build`

### Task 3: Design Prisma schema and migrations
**Objective:** Menyusun model DB inti yang mendukung household finance.

**Files:**
- Create: `/Users/ardyan.prasetya/Documents/prasapp/prasfinance/prisma/schema.prisma`
- Create: migrations under `/Users/ardyan.prasetya/Documents/prasapp/prasfinance/prisma/migrations/`

**Steps:**
1. Implement entities dari section Data Model Draft.
2. Tambahkan indexes untuk household/date/category.
3. Buat migration awal.

**Validation:**
- `npx prisma validate`
- `npx prisma migrate dev`
- `npx prisma generate`

### Task 4: Build auth and household access
**Objective:** Membatasi akses data per household dan per role.

**Files likely:**
- `src/lib/auth.ts`
- `src/lib/session.ts`
- `src/app/login/page.tsx`
- `src/app/api/auth/*`
- `src/middleware.ts`

**Validation:**
- unauthorized user tertolak
- authorized member bisa masuk
- owner-only actions diblok untuk member

### Task 5: Build transaction ledger MVP
**Objective:** Menyediakan CRUD pemasukan/pengeluaran yang usable duluan.

**Files likely:**
- `src/app/transactions/*`
- `src/app/api/transactions/*`
- `src/components/transactions/*`
- `src/lib/transactions/*`

**Validation:**
- create/edit/delete transaction works
- dashboard summary update benar

### Task 6: Build savings module
**Objective:** Menyediakan goal tabungan dan setoran berkala.

**Validation:**
- goal creation works
- savings entries update progress accurately

### Task 7: Build future plans module
**Objective:** Menyediakan planning biaya masa depan dan reminder kebutuhan dana.

**Validation:**
- plan creation works
- due date & monthly required estimate tampil benar

### Task 8: Build dashboard and reports
**Objective:** Menyatukan insight utama keluarga dalam satu layar.

**Validation:**
- summary numbers sesuai data source
- filters month/category/member berjalan

### Task 9: Deploy to subdomain
**Objective:** Menjadikan app live di subdomain keluarga.

**Validation:**
- DNS resolve
- SSL active
- login + CRUD basic tested live

---

# 14. Risks and Tradeoffs

## Risk 1 — Auth terlalu sederhana
Kalau pakai static password per keluarga, implementasi cepat tapi audit user dan keamanan lebih lemah.

**Mitigation:**
- MVP bisa mulai dari simple auth.
- V2 bisa upgrade ke invite-based member login.

## Risk 2 — Aggregation bug
Saldo, tabungan, dan report rawan beda jika aggregate disimpan manual.

**Mitigation:**
- Untuk MVP, hitung dari source of truth dengan query terkontrol.
- Cache aggregate hanya bila performa memang perlu.

## Risk 3 — Scope melebar
Budget, debt tracking, recurring bills, bank integration bisa bikin molor.

**Mitigation:**
- Kunci MVP ke 4 modul inti: transactions, savings, plans, dashboard.

## Risk 4 — Household privacy
Data keluarga sensitif.

**Mitigation:**
- Strict `householdId` scoping.
- `httpOnly` session cookie.
- No cross-household query path.

---

# 15. Open Questions to Confirm Before Build

1. Nama app final mau apa?
2. Subdomain final mau `finance.prasapp.com` atau nama lain?
3. Auth mau cepat dulu pakai satu password keluarga, atau per-member login dari awal?
4. Satu household dulu atau dari awal support banyak household?
5. Perlu fitur hutang/piutang di MVP atau nanti?
6. Perlu recurring monthly bills di MVP atau nanti?
7. Perlu export CSV/PDF di MVP atau nanti?

---

# 16. Recommendation

## Recommended MVP decision
- Folder app: `prasfinance`
- Domain: `finance.prasapp.com`
- Stack: Next.js + Prisma + PostgreSQL
- Auth: simple household auth dulu, lalu evolve ke member-based auth
- Scope MVP: dashboard + transactions + savings + plans

## Why this is the right cut
- paling cepat live,
- cocok untuk kebutuhan keluarga inti,
- masih gampang dikembangkan,
- konsisten dengan stack dan deployment pattern yang sudah dipakai di `prasapp`.

---

# 17. Handoff Summary

Dokumen ini sudah cukup untuk lanjut ke tahap berikut:
1. finalisasi nama app + subdomain,
2. scaffold project baru di monorepo,
3. bikin technical architecture dan schema detail,
4. baru lanjut wireframe/UI UX.

Kalau lanjut, tahap berikut paling pas:
- **opsi A:** bikin technical architecture + DB schema final
- **opsi B:** langsung scaffold app `prasfinance` di folder `prasapp`
- **opsi C:** bikin wireframe flow per page berdasarkan PRD ini
