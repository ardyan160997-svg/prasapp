# Prashine

Aplikasi laundry antar-jemput dengan public member, tracking, dan dashboard admin.

## Struktur

- `public/` — storefront/member, request pickup GPS, pesanan, tracking
- `adminprashine/` — admin static UI + Node.js API
- `migrations/` — schema PostgreSQL dan rollback
- `tests/` — domain tests

## Menjalankan lokal

```bash
npm install
PORT=3030 ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me TOKEN_SECRET=change-me node adminprashine/server.js
```

Buka:

```text
Public: http://localhost:3030/public/index.html
Admin:  http://localhost:3030/
```

Tanpa `DATABASE_URL`, server memakai data sementara dalam memory untuk development. Production wajib memakai database PostgreSQL Prashine terpisah.

## Production environment

```text
PORT=3030
DATABASE_URL=postgresql://...
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
TOKEN_SECRET=...
```

Jalankan migration:

```bash
psql "$DATABASE_URL" -f migrations/001_initial.sql
```

Rollback awal ini menghapus seluruh tabel Prashine dan hanya boleh digunakan pada database Prashine yang memang ingin dihapus:

```bash
psql "$DATABASE_URL" -f migrations/001_initial.rollback.sql
```

## Validasi

```bash
npm run check
npm run build
```
