# Prashoes HTML Sites

Project ini berisi dua aplikasi HTML/CSS/JS tanpa Next.js/React runtime.

## Struktur

```text
public/          # dashboard/public website untuk prashoes.prasapp.com
adminprashoes/   # dashboard admin + Node API untuk adminprashoes.prasapp.com
```

## Public site

Folder `public/` adalah static website murni:

```text
public/index.html
public/styles.css
public/app.js
public/data.js
public/images/
```

Data layanan, promo, benefit, gallery, pickup request, dan tracking terhubung ke API VPS:

```text
https://adminprashoes.prasapp.com/api/public
```

## Admin site

Folder `adminprashoes/` berisi static admin UI dan Node API PostgreSQL:

```text
adminprashoes/index.html
adminprashoes/styles.css
adminprashoes/app.js
adminprashoes/server.js
adminprashoes/scripts/import-data.js
```

API admin memakai environment runtime:

```text
DATABASE_URL
ADMIN_PASSWORD
ADMIN_SECRET
PORT
```

Jangan commit env/secret.

## Commands

```bash
npm run check
npm run build
```

Build output:

```text
dist/public/
dist/adminprashoes/
```

## Deploy target

```text
prashoes.prasapp.com      -> public/
adminprashoes.prasapp.com -> adminprashoes/
```
