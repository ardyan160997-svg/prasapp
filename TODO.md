# Project Tasks

Add one block for each task. Do not remove completed tasks unless the project owner
requests cleanup.

---

## TASK-001 — Pisahkan file website admin dan website utama

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: medium
- Risk: medium
- Dependencies: none

### Objective

Memisahkan implementasi halaman website utama dan dashboard admin ke file masing-masing
agar struktur proyek lebih jelas dan mudah dirawat.

### Context

Proyek memakai Next.js App Router. Route `/` dan `/admin` tetap dipertahankan,
namun isi halamannya dipindahkan ke file fitur terpisah.

### Scope

#### In scope

- Files, directories, layers, or behavior that may be changed.
- `prashoes/src/app/page.tsx`
- `prashoes/src/app/admin/page.tsx`
- `prashoes/src/features/main/components/MainWebsitePage.tsx`
- `prashoes/src/features/admin/components/AdminDashboardPage.tsx`
- `TODO.md`

#### Out of scope

- Items that must not be changed.
- API route
- Database schema
- Styling global di luar kebutuhan pemisahan file

### Requirements

- Website utama memakai file halaman terpisah sendiri.
- Website admin memakai file halaman terpisah sendiri.
- Route dan tampilan tetap berjalan seperti sebelumnya.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Route `/` dan `/admin` tetap merender komponen yang sama.
- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. Halaman utama dan admin sudah dipisah ke file masing-masing, sedangkan file
route di `app` sekarang hanya menjadi wrapper. Script Next juga diarahkan ke `webpack`
karena `Turbopack` crash saat aplikasi dibuka di environment ini.

---

## TASK-002 — Tambahkan endpoint health check

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: none

### Objective

Menambahkan endpoint `/health` agar health check tidak lagi `404`.

### Context

Server sudah hidup, tetapi ada request ke `/health` yang gagal karena route belum ada.

### Scope

#### In scope

- `prashoes/src/app/health/route.ts`
- `TODO.md`

#### Out of scope

- UI website
- Database
- Route API lain

### Requirements

- `GET /health` mengembalikan status sukses.
- Response ringan dan aman untuk health check.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.
- `npm run build` di folder `prashoes` berhasil.

### Result

Selesai. Endpoint `/health` ditambahkan dan mengembalikan respons JSON dengan status `ok`.

---

## TASK-003 — Tambahkan autentikasi login pada halaman admin

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-001

### Objective

Menambahkan login admin pada route `/admin` agar dashboard dan API admin tidak bisa
diakses tanpa autentikasi.

### Context

Dashboard admin saat ini masih terbuka dan beberapa endpoint admin memakai service
role Supabase tanpa proteksi session admin.

### Scope

#### In scope

- `TODO.md`
- `prashoes/.env.example`
- `prashoes/src/app/admin/page.tsx`
- `prashoes/src/app/api/admin/**`
- `prashoes/src/features/admin/components/**`
- `prashoes/src/lib/admin-auth.ts`

#### Out of scope

- Integrasi user management Supabase Auth penuh
- Role/permission bertingkat
- Perubahan schema database

### Requirements

- Route `/admin` menampilkan form login saat belum autentikasi.
- Login admin memvalidasi credential dari environment variable.
- Session admin disimpan dengan cookie `httpOnly`.
- Endpoint admin yang mengubah data menolak request tanpa session valid.
- Admin bisa logout.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.
- `npm run build` di folder `prashoes` berhasil.

### Result

Selesai. Route `/admin` sekarang menampilkan form login saat belum ada session valid,
session admin disimpan di cookie `httpOnly`, tersedia endpoint login/logout, dan
endpoint admin yang mengubah data sekarang menolak request tanpa autentikasi.

---

## TASK-004 — Update login admin untuk dua username

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-003

### Objective

Mengubah login admin agar menerima dua username nomor telepon berbeda dengan satu
password yang sama.

### Context

Login admin yang ada hanya menerima satu `ADMIN_USERNAME`, sedangkan operasional
butuh dua akun admin: `085601679005` dan `087728386861` dengan password yang sama.

### Scope

#### In scope

- `TODO.md`
- `prashoes/.env.example`
- `prashoes/src/lib/admin-auth.ts`
- `prashoes/src/lib/admin-auth.test.ts`
- `prashoes/src/features/admin/components/AdminLoginPage.tsx`

#### Out of scope

- Integrasi user management pihak ketiga
- Role/permission bertingkat
- Perubahan schema database

### Requirements

- Route `/admin` tetap menampilkan form login saat belum ada session valid.
- Login admin menerima username `085601679005` atau `087728386861`.
- Password bersama tetap diverifikasi sebelum session dibuat.
- Session cookie tetap `httpOnly` dan endpoint admin tetap menolak request tanpa session valid.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm test -- src/lib/admin-auth.test.ts` di folder `prashoes` berhasil.
- `npm run lint -- src/lib/admin-auth.ts src/features/admin/components/AdminLoginPage.tsx` di folder `prashoes` berhasil.
- `npm run build` di folder `prashoes` berhasil.

### Result

Selesai. Login admin sekarang mendukung banyak username lewat `ADMIN_USERNAMES`
(tetap fallback ke `ADMIN_USERNAME` lama), dua nomor admin aktif dengan satu password,
session valid untuk kedua akun, dan pesan konfigurasi login di UI sudah diperbarui.

---

## TASK-005 — Sembunyikan nomor admin pada dashboard

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: TASK-004

### Objective

Mengganti tampilan nomor admin pada badge dashboard menjadi nama agar identitas admin
lebih rapi saat login.

### Context

Dashboard admin menampilkan teks `Login sebagai <nomor telepon>`. Operasional butuh
nomor `085601679005` ditampilkan sebagai `Ardyan Prasetya` dan nomor `087728386861`
ditampilkan sebagai `Rochmad Agung`.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/features/admin/components/AdminDashboardPage.tsx`

#### Out of scope

- Logika autentikasi
- Environment variable admin
- API admin

### Requirements

- Badge login di dashboard tidak lagi menampilkan nomor mentah untuk dua akun admin.
- Username session tetap dipakai untuk autentikasi di belakang layar.
- Jika ada username lain, fallback tetap menampilkan nilai aslinya.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Pemeriksaan kode memastikan badge login memakai nama tampilan hasil mapping username.

### Result

Selesai. Badge login dashboard sekarang menampilkan `Ardyan Prasetya` untuk
`085601679005` dan `Rochmad Agung` untuk `087728386861`, sementara session auth
tetap memakai username aslinya.

---

## TASK-006 — Sederhanakan halaman login admin

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: TASK-004

### Objective

Menyederhanakan tampilan halaman login admin agar hanya menampilkan judul login dan
form input username serta password.

### Context

Halaman login admin sebelumnya masih menampilkan hero, deskripsi, dan kartu informasi
proteksi. Operasional hanya membutuhkan box login sederhana dengan judul `Login admin`.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/features/admin/components/AdminLoginPage.tsx`

#### Out of scope

- Logika autentikasi
- API login admin
- Session cookie admin

### Requirements

- Hilangkan hero, deskripsi, dan kartu informasi dari halaman login admin.
- Tampilkan box input username dan password saja.
- Gunakan judul `Login admin`.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Pemeriksaan kode memastikan halaman login hanya merender card form dengan judul
  `Login admin`, input username, input password, dan tombol submit.

### Result

Selesai. Halaman login admin sekarang disederhanakan menjadi satu card form dengan
judul `Login admin`, input username, input password, dan tombol login.

---

## TASK-007 — Tambahkan logo pada form login admin

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: TASK-006

### Objective

Menambahkan logo Prashoes di tengah atas form login admin sebelum judul.

### Context

Form login admin sudah disederhanakan. Logo `logo:iconnav.avif` perlu ditampilkan
di tengah atas judul `Login admin`.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/features/admin/components/AdminLoginPage.tsx`

#### Out of scope

- Logika autentikasi
- API login admin
- Asset gambar

### Requirements

- Tampilkan logo dari `/images/logo:iconnav.avif` di tengah atas judul `Login admin`.
- Jaga layout form tetap rapi pada desktop dan mobile.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Pemeriksaan kode memastikan form login merender komponen `Image` di atas judul
  `Login admin` dengan posisi tengah.

### Result

Selesai. Form login admin sekarang menampilkan logo Prashoes di tengah atas judul
`Login admin`.

---

## TASK-008 — Naikkan posisi hero content dan gambar

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: none

### Objective

Menaikkan sedikit posisi konten hero dan gambar sepatu agar tidak terlihat terlalu
turun di halaman utama.

### Context

Hero utama pada homepage terlihat terlalu rendah secara visual, baik pada teks CTA
maupun focal point gambar sepatu di kanan bawah.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/components/HeroVisual.tsx`

#### Out of scope

- Struktur section lain
- Copywriting hero
- CTA link dan perilaku tombol

### Requirements

- Konten hero naik sedikit secara vertical.
- Focal point gambar sepatu ikut naik agar komposisi lebih seimbang.
- Layout desktop dan mobile tetap rapi.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Pemeriksaan kode memastikan top padding hero dikurangi dan `object-position`
  gambar background disesuaikan ke area yang lebih tinggi.

### Result

Direvisi lagi. Hero image mobile sekarang di-anchor ke atas dengan `object-top`
agar sepatu naik jelas pada viewport kecil, sementara desktop tetap memakai crop
bawaan.

---

## TASK-009 — Buat dashboard member

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: medium
- Risk: medium
- Dependencies: none

### Objective

Membuat halaman dashboard member agar user bisa melihat ringkasan order, benefit,
promo aktif, dan poin reward dalam satu tempat.

### Context

Project sudah punya homepage publik dan dashboard admin, tetapi belum punya halaman
khusus member. Dashboard member dibutuhkan sebagai halaman ringkasan yang tetap
selaras dengan visual Prashoes.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/app/member/page.tsx`
- `prashoes/src/features/member/components/MemberDashboardPage.tsx`
- `prashoes/src/features/member/services/member-dashboard-data.ts`
- `prashoes/src/features/member/types/index.ts`

#### Out of scope

- Autentikasi member
- Perubahan schema database
- API baru untuk member

### Requirements

- Tersedia route `/member`.
- Halaman menampilkan header dashboard member, ringkasan profil, statistik,
  benefit member, promo aktif, dan order terbaru.
- Layout tetap rapi di desktop dan mobile.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. Route `/member` ditambahkan dengan dashboard member yang menampilkan
profil ringkas, statistik order, benefit member, promo aktif, pengingat, dan
ringkasan order terbaru dari data yang sudah ada di project.

---

## TASK-010 — Buat dashboard daftar member baru

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: medium
- Risk: medium
- Dependencies: TASK-009

### Objective

Membuat halaman dashboard khusus pendaftaran member baru dan menghubungkannya ke
toggle `Daftar Member` di halaman utama.

### Context

Homepage sudah punya CTA `Daftar Member`, tetapi belum terhubung ke halaman khusus.
Project juga sudah punya dashboard member umum di `/member`, jadi dibutuhkan halaman
baru untuk alur pendaftaran member.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/components/PromoSection.tsx`
- `prashoes/src/app/member/daftar/page.tsx`
- `prashoes/src/features/member/components/MemberRegistrationDashboardPage.tsx`

#### Out of scope

- Autentikasi member
- Database member baru
- API submit pendaftaran

### Requirements

- Toggle `Daftar Member` di homepage bisa diklik.
- Tersedia halaman baru untuk dashboard daftar member.
- Halaman menampilkan benefit, langkah pendaftaran, promo aktif, dan CTA lanjutan.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. CTA `Daftar Member` di homepage sekarang mengarah ke `/member/daftar`,
dan route baru itu menampilkan dashboard pendaftaran member baru dengan benefit,
langkah daftar, pilihan paket, promo aktif, dan CTA lanjutan.

---

## TASK-011 — Fase 1 member program dan pickup flow

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: high
- Dependencies: TASK-010

### Objective

Menyiapkan fondasi member program sesuai aturan bisnis baru: promo member baru 10%,
free ongkir member min. 2 pair, ongkir non-member Rp5.000, loyalty 10x Deep Clean
gratis 1x cuci, serta form daftar member dan pickup yang mendukung GPS/share location.

### Context

Flow saat ini belum membedakan member dan non-member, belum punya field email,
belum menyimpan lokasi GPS/share location, dan belum punya schema untuk program member.

### Scope

#### In scope

- `TODO.md`
- `prashoes/supabase/migrations/00008_member_program.sql`
- `prashoes/src/components/PickupForm.tsx`
- `prashoes/src/features/member/components/MemberRegistrationDashboardPage.tsx`
- `prashoes/src/features/main/services/public-site-data.ts`
- `prashoes/src/features/main/types.ts`
- `prashoes/src/features/main/data/placeholder.ts`
- `prashoes/src/lib/supabase-service.ts`
- `prashoes/src/types/index.ts`
- `prashoes/src/types/supabase.ts`

#### Out of scope

- Auth member final
- Integrasi kirim WhatsApp otomatis
- Dashboard member berbasis akun real penuh

### Requirements

- Daftar member cukup minta nama, nomor WA aktif, email opsional, dan alamat pickup.
- Daftar member bisa memakai GPS perangkat untuk share location.
- Pickup form mendukung toggle member/non-member.
- Pickup form menghitung promo dan ongkir sesuai aturan baru.
- Schema siap menampung member, pickup metadata, dan pricing fields.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. Fondasi fase 1 member program ditambahkan lewat migration baru, form daftar
member sekarang menerima data utama plus GPS/share location, pickup flow sekarang
mendukung member/non-member beserta estimasi promo dan ongkir, dan type/service layer
sudah disiapkan untuk pengembangan auth member serta notifikasi WA di fase berikutnya.

---

## TASK-012 — Percantik hero benefit member

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: TASK-011

### Objective

Membuat section hero `Benefit Member` di halaman daftar member lebih menarik secara
visual dengan dekorasi icon, highlight benefit utama, dan animasi ringan.

### Context

Section benefit member sebelumnya masih terlalu flat dan terlihat seperti daftar box
biasa. Dibutuhkan tampilan yang lebih hidup agar benefit member terasa lebih menonjol.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/features/member/components/MemberRegistrationDashboardPage.tsx`

#### Out of scope

- Logika pendaftaran member
- Data benefit member
- Flow submit form

### Requirements

- Section benefit member terlihat lebih menarik.
- Tambahkan visual icon atau background dekoratif.
- Tambahkan animasi ringan tanpa mengganggu keterbacaan.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. Hero benefit member sekarang memakai background dekoratif, icon visual,
highlight benefit utama, hover state, dan animasi shimmer ringan agar tampil lebih hidup.

---

## TASK-013 — Input order admin per member atau non-member

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: high
- Dependencies: TASK-011

### Objective

Membuat flow input order dari dashboard admin agar admin bisa mencatat sepatu satu per
satu, memilih pemilik sepatu dari member terdaftar lewat search dropdown, dan tetap
bisa input untuk non-member.

### Context

Program member sekarang butuh pencatatan riwayat Deep Clean per member untuk reward
`1x Deep Clean gratis tiap 10x Deep Clean`. Flow admin sebelumnya belum punya form
create order dan belum bisa mengaitkan order ke member.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/features/admin/types.ts`
- `prashoes/src/features/admin/services/admin-order-entry-data.ts`
- `prashoes/src/features/admin/components/AdminOrderEntryPanel.tsx`
- `prashoes/src/features/admin/components/AdminDashboardPage.tsx`
- `prashoes/src/app/api/admin/orders/route.ts`
- `prashoes/src/features/member/services/member-dashboard-data.ts`

#### Out of scope

- Login member final
- Pengiriman WhatsApp otomatis
- Redeem otomatis free wash saat checkout

### Requirements

- Admin bisa memilih input untuk member atau non-member.
- Member dipilih lewat search dropdown dari daftar member yang ada.
- Admin bisa input sepatu satu per satu dengan layanan masing-masing.
- Riwayat Deep Clean member bertambah dari order yang diinput admin.
- Reward member tidak lagi memakai promo 20%.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. Dashboard admin sekarang punya panel input order baru untuk member maupun
non-member, admin bisa memilih pemilik sepatu dari dropdown pencarian member,
input item sepatu satu per satu, dan order member sekarang ikut menambah riwayat
Deep Clean untuk progress reward `1x Deep Clean gratis tiap 10x Deep Clean`.

---

## TASK-014 — Jadikan input order admin accordion

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: TASK-013

### Objective

Meringkas dashboard admin dengan membuat panel input order menjadi accordion yang
bisa dibuka dan ditutup.

### Context

Setelah panel input order admin ditambahkan, dashboard menjadi lebih panjang dari
yang diinginkan. Dibutuhkan pola accordion agar form hanya tampil saat diperlukan.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/features/admin/components/AdminOrderEntryPanel.tsx`

#### Out of scope

- Logic create order admin
- Endpoint admin order
- Tabel riwayat order

### Requirements

- Form input order admin bisa dibuka dan ditutup.
- Dashboard admin terlihat lebih ringkas saat form ditutup.
- Isi form dan alur submit tetap sama.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. Panel input order admin sekarang menjadi accordion dengan tombol buka/tutup,
sehingga dashboard admin lebih ringkas tanpa mengubah isi form dan flow submit.

---

## TASK-015 — Hapus semua data contoh/demo aktif

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-014

### Objective

Menghapus semua data contoh/demo aktif agar aplikasi hanya mengandalkan data dari
database yang akan diisi sendiri.

### Context

Beberapa halaman masih memakai placeholder, fallback array, dummy tracking, request
code demo, dan blok before/after palsu. Ini perlu dibersihkan supaya tidak ada data
contoh yang muncul saat database kosong atau belum dikonfigurasi.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/features/main/services/public-site-data.ts`
- `prashoes/src/components/PricelistSection.tsx`
- `prashoes/src/components/PromoSection.tsx`
- `prashoes/src/components/PickupForm.tsx`
- `prashoes/src/components/TrackingSection.tsx`
- `prashoes/src/components/BeforeAfterSlider.tsx`
- `prashoes/src/features/member/components/MemberRegistrationDashboardPage.tsx`
- `prashoes/src/features/member/components/MemberDashboardPage.tsx`
- `prashoes/src/features/member/services/member-dashboard-data.ts`
- `prashoes/src/features/main/types.ts`
- `prashoes/src/types/index.ts`
- `prashoes/src/features/main/data/placeholder.ts`
- `prashoes/src/lib/placeholder.ts`

#### Out of scope

- Data real di database
- Integrasi auth member final
- Integrasi WhatsApp final

### Requirements

- Tidak ada fallback demo aktif saat database kosong.
- Request submit tidak lagi sukses palsu saat database belum dikonfigurasi.
- Section yang belum punya data menampilkan empty state yang jelas.
- Contoh tracking/order/member palsu dihapus.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. Semua fallback demo aktif, dummy tracking, promo/benefit palsu, request code
demo, dan blok before/after contoh sudah dihapus. Sekarang aplikasi menunggu data dari
database dan menampilkan empty state bila data belum tersedia.

---

## TASK-016 — Kembalikan daftar harga dan benefit member

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: medium
- Risk: medium
- Dependencies: TASK-015

### Objective

Mengembalikan section `Daftar Harga` dan `Benefit Member` agar tetap tampil, tanpa
menghidupkan kembali data demo tracking atau order palsu.

### Context

Setelah semua fallback demo aktif dihapus, section layanan dan benefit ikut kosong.
Yang dibutuhkan adalah konten default bisnis untuk harga, benefit, dan promo, bukan
data contoh order atau tracking.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/features/main/data/default-content.ts`
- `prashoes/src/features/main/services/public-site-data.ts`

#### Out of scope

- Dummy tracking/order
- Request code demo
- Auth member

### Requirements

- `Daftar Harga` tetap tampil meskipun database belum diisi.
- `Benefit Member` dan promo member tetap tampil.
- Jangan mengembalikan data demo order/tracking palsu.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prashoes` berhasil.

### Result

Selesai. Section `Daftar Harga`, `Benefit Member`, dan promo member sekarang memakai
konten default bisnis, sementara data demo order, tracking, dan request palsu tetap
tidak dikembalikan.

---

## TASK-017 — Ganti icon tab browser

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: none

### Objective

Mengganti icon tab browser agar memakai asset `icon.avif`.

### Context

Metadata global app masih memakai icon lama `iconsite.avif`. Dibutuhkan perubahan ke
`icon.avif` untuk tampilan nama tab/browser icon yang baru.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/app/layout.tsx`

#### Out of scope

- Metadata halaman lain
- Asset gambar
- Perubahan title halaman

### Requirements

- Icon tab browser memakai `/images/icon.avif`.
- Shortcut icon dan apple icon ikut konsisten memakai asset yang sama.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Pemeriksaan kode memastikan metadata `icons` di layout global menunjuk ke
  `/images/icon.avif`.

### Result

Selesai. Metadata icon global sekarang memakai `/images/icon.avif` untuk `icon`,
`shortcut`, dan `apple`.

---

## TASK-018 — Hapus override favicon lama

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: TASK-017

### Objective

Menghilangkan override favicon lama agar tab browser benar-benar memakai `icon.avif`.

### Context

Walau metadata global sudah diarahkan ke `/images/icon.avif`, Next.js masih punya file
khusus `src/app/favicon.ico` yang lebih diprioritaskan untuk tab browser.

### Scope

#### In scope

- `TODO.md`
- `prashoes/src/app/favicon.ico`

#### Out of scope

- Asset `icon.avif`
- Metadata title halaman
- Icon untuk platform lain di luar metadata global

### Requirements

- Override favicon lama dihapus.
- Browser tab kembali mengikuti metadata `icons` dari layout global.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Pemeriksaan file memastikan `src/app/favicon.ico` tidak lagi ada sehingga icon tab
  mengikuti `/images/icon.avif` dari metadata global.

### Result

Selesai. File `src/app/favicon.ico` dihapus agar browser tab tidak lagi memakai icon
lama dan kembali mengikuti `icon.avif` dari metadata global.

---

## TASK-019 — Scaffold fondasi aplikasi PraStation

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: none

### Objective

Membuat fondasi aplikasi baru `PraStation` di folder `prastation` agar implementasi
MVP dapat dimulai dari struktur yang rapi dan siap dikembangkan.

### Context

PRD `PraStation` mendefinisikan produk baru untuk manajemen rental PlayStation,
sementara folder `prastation` masih kosong. Dibutuhkan scaffold project, route inti,
dan autentikasi dasar untuk fase implementasi berikutnya.

### Scope

#### In scope

- `TODO.md`
- `prastation/.env.example`
- `prastation/.gitignore`
- `prastation/package.json`
- `prastation/tsconfig.json`
- `prastation/next-env.d.ts`
- `prastation/next.config.ts`
- `prastation/postcss.config.mjs`
- `prastation/eslint.config.mjs`
- `prastation/src/app/**`
- `prastation/src/features/**`
- `prastation/src/lib/admin-auth.ts`

#### Out of scope

- Integrasi database PostgreSQL penuh
- Dashboard billing final
- Schema pricing, rental, dan laporan
- Reservasi publik dan autentikasi member penuh

### Requirements

- Folder `prastation` memiliki scaffold Next.js + TypeScript yang konsisten dengan repo.
- Route `/`, `/member`, `/admin`, dan `/health` tersedia.
- Route `/admin` mendukung login dasar owner/admin dan kasir via cookie `httpOnly`.
- Disediakan struktur fitur yang siap dikembangkan ke billing, member, dan public site.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Pemeriksaan file memastikan scaffold project `prastation` lengkap.
- Pemeriksaan kode memastikan route dasar dan util autentikasi tersedia.
- `npm run lint` belum dijalankan karena dependency untuk `prastation` belum di-install
  di environment ini.

### Result

Selesai. Fondasi `PraStation` sekarang sudah ada dengan konfigurasi project,
halaman publik/member/admin, endpoint `health`, endpoint login/logout, dan util
session admin dasar berbasis cookie `httpOnly` untuk membuka sprint implementasi
berikutnya.

---

## TASK-020 — Fase 2 schema awal, auth role, dan dashboard billing station

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-019

### Objective

Menambahkan schema awal database, merapikan autentikasi berbasis role, dan membangun
dashboard billing station sebagai fondasi operasional fase berikutnya.

### Context

Fondasi `PraStation` sudah ada, tetapi belum memiliki migration schema awal, model
auth role yang lebih eksplisit, dan dashboard station yang menampilkan status unit
bermain untuk kasir/admin.

### Scope

#### In scope

- `TODO.md`
- `prastation/.env.example`
- `prastation/db/migrations/**`
- `prastation/src/app/admin/**`
- `prastation/src/app/api/admin/**`
- `prastation/src/app/api/auth/login/route.ts`
- `prastation/src/features/admin/components/**`
- `prastation/src/features/billing/**`
- `prastation/src/lib/**`
- `prastation/src/types/**`

#### Out of scope

- Integrasi PostgreSQL runtime
- CRUD station/member penuh
- Start session, extend session, move station, dan pembayaran final
- Auth member dan rental bawa pulang

### Requirements

- Tersedia migration SQL awal dengan rollback untuk entitas inti MVP.
- Auth admin mendukung account mapping `username -> role -> permissions`.
- Endpoint admin billing menolak akses tanpa session/permission valid.
- Dashboard billing menampilkan ringkasan dan grid station dengan state loading,
  error, dan empty.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- Pemeriksaan kode memastikan migration awal dan rollback tersedia.
- Pemeriksaan kode memastikan auth role memakai permission helper.
- Pemeriksaan kode memastikan dashboard billing mengambil data dari API yang
  terlindungi session.
- `npm run lint` belum dijalankan karena dependency `prastation` belum di-install
  di environment ini.

### Result

Selesai. `PraStation` sekarang punya migration SQL awal, auth role yang lebih rapi
dengan daftar permission, endpoint billing admin yang terlindungi, dan dashboard
station berbasis data mock server untuk fase operasional berikutnya.

---

## TASK-021 — Fase 3 repository DB, seed awal, dan aksi billing nyata

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-020

### Objective

Menghubungkan dashboard billing ke PostgreSQL runtime melalui repository DB, menambah
seed awal, dan menyediakan aksi billing nyata per station.

### Context

Fase 2 masih memakai mock data untuk dashboard billing. Dibutuhkan koneksi DB runtime,
runner migration/seed, serta endpoint operasional agar kasir bisa mulai sesi, tambah
waktu, dan mengakhiri sesi dari station board.

### Scope

#### In scope

- `TODO.md`
- `prastation/package.json`
- `prastation/package-lock.json`
- `prastation/.env.example`
- `prastation/db/scripts/**`
- `prastation/db/seeds/**`
- `prastation/src/app/api/admin/billing/**`
- `prastation/src/features/billing/**`
- `prastation/src/lib/db.ts`
- `prastation/src/types/**`

#### Out of scope

- Integrasi auth admin penuh ke tabel `admin_users`
- Payment final dan settlement kas
- Pindah station, cancel session, dan promo kompleks
- Portal member live dan laporan finansial penuh

### Requirements

- Tersedia koneksi PostgreSQL runtime dengan dependency `pg`.
- Tersedia script migration dan seed awal.
- Dashboard billing membaca data station dari repository DB.
- Aksi `start session`, `extend session`, dan `end session` tersedia per station.
- UI dashboard menampilkan kontrol aksi dengan refresh data setelah request berhasil.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prastation` berhasil.
- Pemeriksaan kode memastikan migration runner menyimpan history file yang sudah applied.
- Pemeriksaan kode memastikan seed awal menyediakan branch, admin user, station, dan pricing.

### Result

Selesai. `PraStation` sekarang memiliki layer DB runtime berbasis `pg`, script
migration dan seed, repository billing ke PostgreSQL, endpoint aksi operasional per
station, dan dashboard admin yang dapat memulai, menambah, serta mengakhiri sesi
langsung dari UI.

---

## TASK-022 — Fase 4 auth admin dari DB dan CRUD master data

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-021

### Objective

Mengalihkan login admin agar memakai tabel `admin_users` dengan password hash, lalu
menambahkan CRUD master data untuk station, member, dan pricing.

### Context

Sebelumnya login admin masih env-driven, sedangkan master data station/member/pricing
belum bisa dikelola dari portal admin. Fase ini menjadikan database sebagai source of
truth untuk akun admin dan data master operasional.

### Scope

#### In scope

- `TODO.md`
- `prastation/.env.example`
- `prastation/db/migrations/**`
- `prastation/db/scripts/seed.mjs`
- `prastation/db/seeds/0001_seed.sql`
- `prastation/src/app/api/auth/login/route.ts`
- `prastation/src/app/api/admin/master-data/route.ts`
- `prastation/src/app/api/admin/stations/**`
- `prastation/src/app/api/admin/members/**`
- `prastation/src/app/api/admin/pricing/**`
- `prastation/src/features/admin/**`
- `prastation/src/lib/**`
- `prastation/src/types/**`

#### Out of scope

- Reset password flow
- Manajemen admin_users dari UI
- Soft delete kompleks dan audit detail per CRUD
- Integrasi laporan lanjutan dan rental

### Requirements

- Login admin memverifikasi password hash dari tabel `admin_users`.
- Seed awal membuat akun admin bootstrap dengan hash password.
- Admin portal punya panel CRUD station, member, dan pricing.
- API master data dilindungi permission sesuai role.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prastation` berhasil.
- Pemeriksaan kode memastikan login tidak lagi memakai password langsung dari env.
- Pemeriksaan kode memastikan CRUD station/member/pricing tersedia dari UI dan API.

### Result

Selesai. Auth admin sekarang memakai `admin_users` + password hash `scrypt`, seed
bootstrap menulis akun admin ke database, dan portal admin memiliki CRUD dasar untuk
station, member, serta pricing melalui API yang dilindungi role/permission.

---

## TASK-023 — Admin users management, reset password, dan audit log viewer

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-022

### Objective

Menambahkan manajemen `admin_users`, reset password admin, dan viewer audit log di
portal admin.

### Context

Setelah auth berpindah ke tabel `admin_users`, owner/admin masih belum bisa
mengelola user admin dari UI, belum ada reset password, dan belum ada tempat untuk
melihat jejak aktivitas operasional.

### Scope

#### In scope

- `TODO.md`
- `prastation/src/app/api/admin/admin-users/**`
- `prastation/src/app/api/admin/audit-logs/route.ts`
- `prastation/src/app/api/admin/master-data/route.ts`
- `prastation/src/features/admin/components/**`
- `prastation/src/features/admin/services/**`
- `prastation/src/types/master-data.ts`
- `prastation/src/lib/password.ts`

#### Out of scope

- MFA / two-factor auth
- Invite flow via email
- Forced password rotation policy
- Filter audit log lanjutan dan export

### Requirements

- Owner/admin dapat membuat, mengubah, menghapus, dan reset password akun admin.
- Audit log tampil di portal admin dengan actor, action, entity, timestamp, dan metadata.
- API admin users dan audit log dilindungi permission yang tepat.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prastation` berhasil.
- Pemeriksaan kode memastikan reset password memakai hash `scrypt`.
- Pemeriksaan kode memastikan snapshot master data sekarang memuat `adminUsers` dan `auditLogs`.

### Result

Selesai. Portal admin sekarang memiliki panel manajemen akun `admin_users`, aksi
reset password berbasis hash, dan viewer audit log untuk memantau aktivitas penting
yang tercatat di sistem.

---

## TASK-024 — Guard self-action, filter audit log, dan permission granular

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-023

### Objective

Menambahkan guard untuk mencegah self-delete/self-disable admin, memperluas filter
audit log, dan memecah permission role menjadi lebih granular.

### Context

Panel admin users sebelumnya masih mengizinkan skenario berisiko seperti menghapus
akun yang sedang dipakai sendiri. Audit log juga belum punya filter, dan beberapa
permission masih terlalu kasar untuk membedakan akses lihat vs kelola.

### Scope

#### In scope

- `TODO.md`
- `prastation/src/types/auth.ts`
- `prastation/src/lib/auth-config.ts`
- `prastation/src/app/api/admin/admin-users/**`
- `prastation/src/app/api/admin/audit-logs/route.ts`
- `prastation/src/app/api/admin/master-data/route.ts`
- `prastation/src/app/api/admin/members/**`
- `prastation/src/features/admin/components/MasterDataManager.tsx`
- `prastation/src/features/admin/services/**`

#### Out of scope

- Role builder dinamis per user
- Approval workflow untuk aksi sensitif
- Export audit log
- Filter audit log full text

### Requirements

- Admin tidak bisa menghapus atau menonaktifkan akun yang sedang dipakai sendiri.
- Audit log dapat difilter minimal berdasarkan actor, action, entity type, dan rentang tanggal.
- Permission dipisah lebih granular untuk `admin_users`, `members`, dan `audit_logs`.
- UI admin menyesuaikan panel dan aksi berdasarkan permission yang dimiliki session.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prastation` berhasil.
- Pemeriksaan kode memastikan route admin users menolak self-delete/self-disable.
- Pemeriksaan kode memastikan audit log API membaca filter dari query string.

### Result

Selesai. Portal admin sekarang mencegah self-delete/self-disable, audit log bisa
difilter dari UI, dan permission role dipisah lebih granular sehingga panel dan aksi
lebih sesuai dengan hak akses masing-masing role.

---

## TASK-025 — Guard self-role-change, filter audit yang usable, dan pagination admin

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-024

### Objective

Menambahkan guard self-role-change, membuat filter audit log lebih usable, dan
menyediakan pagination untuk audit log serta panel master data admin.

### Context

Setelah guard self-delete/self-disable ditambahkan, akun aktif masih bisa mencoba
mengubah role dirinya sendiri. Filter audit log juga masih terlalu mentah, dan daftar
master data berpotensi terlalu panjang tanpa pagination.

### Scope

#### In scope

- `TODO.md`
- `prastation/src/types/auth.ts`
- `prastation/src/types/master-data.ts`
- `prastation/src/lib/auth-config.ts`
- `prastation/src/features/admin/services/**`
- `prastation/src/app/api/admin/admin-users/**`
- `prastation/src/app/api/admin/audit-logs/route.ts`
- `prastation/src/app/api/admin/master-data/route.ts`
- `prastation/src/app/api/admin/stations/route.ts`
- `prastation/src/app/api/admin/members/route.ts`
- `prastation/src/app/api/admin/pricing/route.ts`
- `prastation/src/features/admin/components/MasterDataManager.tsx`

#### Out of scope

- Role builder custom per-user
- Export CSV/PDF audit log
- Search full-text lintas seluruh metadata
- Infinite scrolling

### Requirements

- Akun aktif tidak bisa mengubah role dirinya sendiri.
- Audit log menyediakan filter yang lebih usable untuk actor, action, entity type,
  dan tanggal.
- Daftar `admin_users`, station, member, pricing, dan audit log mendukung pagination.
- UI dan API mengikuti permission granular yang lebih tegas.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prastation` berhasil.
- Pemeriksaan kode memastikan GET list route mendukung `page` dan `pageSize`.
- Pemeriksaan kode memastikan self-role-change ditolak pada route admin user update.

### Result

Selesai. Portal admin sekarang menolak self-role-change, filter audit log lebih mudah
dipakai melalui pilihan actor/action/entity, dan panel admin/master data sudah punya
pagination dasar untuk skala data yang lebih besar.

---

## TASK-026 — Audit log export, sensitive confirmation, dan permission matrix

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-025

### Objective

Menambahkan export audit log, konfirmasi untuk aksi sensitif, dan permission matrix
yang dapat dikelola per user atau per cabang.

### Context

Portal admin sudah punya audit log viewer dan permission granular, tetapi belum bisa
mengekspor audit log, belum konsisten meminta konfirmasi untuk aksi sensitif, dan
belum ada mekanisme override permission per user/cabang.

### Scope

#### In scope

- `TODO.md`
- `prastation/db/migrations/**`
- `prastation/src/types/master-data.ts`
- `prastation/src/lib/auth-config.ts`
- `prastation/src/features/admin/services/**`
- `prastation/src/app/api/admin/audit-logs/**`
- `prastation/src/app/api/admin/admin-users/**`
- `prastation/src/features/admin/components/MasterDataManager.tsx`

#### Out of scope

- Approval workflow bertingkat
- Export XLSX/PDF
- UI role builder penuh
- Permission matrix multi-tenant di luar cabang aktif

### Requirements

- Audit log dapat diekspor ke CSV.
- Aksi sensitif seperti delete, reset password, dan perubahan penting meminta konfirmasi.
- Tersedia permission matrix dengan scope global atau per cabang untuk tiap admin user.
- Session auth menghormati override permission yang tersimpan di database.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.

### Validation

- `npm run lint` di folder `prastation` berhasil.
- Pemeriksaan kode memastikan export audit log memakai filter aktif.
- Pemeriksaan kode memastikan effective permissions menggabungkan role default dan override DB.

### Result

Selesai. Portal admin sekarang bisa mengekspor audit log ke CSV, meminta konfirmasi
untuk aksi sensitif, dan mengelola permission matrix per user atau per cabang yang
langsung memengaruhi effective permission saat login.

---

## TASK-027 — Setup database PraStation di Coolify

- Status: in-progress
- Requested route: auto
- Selected combo: plan
- Priority: high
- Risk: high
- Dependencies: TASK-026

### Objective

Menyiapkan database PostgreSQL untuk `PraStation` lewat Coolify agar migration,
seed awal, dan pengujian login berbasis database bisa dijalankan.

### Context

Implementasi aplikasi `prastation` dan migration lokal sudah siap, tetapi `DATABASE_URL`
runtime belum tersedia. Upaya menjalankan `npm run db:migrate` secara lokal sebelumnya
gagal karena environment database belum dikonfigurasi dan role Postgres default tidak
sesuai. Akses Coolify sudah tersedia, namun server bawaan `localhost` masih berstatus
`Sentinel Out Of Sync` dan `Not reachable & Not usable by Coolify`.

### Scope

#### In scope

- `TODO.md`
- Validasi server Coolify untuk host aplikasi
- Pembuatan service PostgreSQL untuk `prastation`
- Pengambilan connection string / `DATABASE_URL`
- Menjalankan `prastation` migration dan seed terhadap DB baru
- Uji login ulang untuk memastikan override permission tercermin pada session baru

#### Out of scope

- Deploy production final `prastation`
- Cutover DNS atau subdomain
- Migrasi data historis dari sistem lain

### Requirements

- Server Coolify tervalidasi dan usable.
- Tersedia database PostgreSQL khusus `prastation`.
- `npm run db:migrate` berhasil terhadap database tersebut.
- Seed awal dapat dijalankan bila dibutuhkan.
- Login ulang admin membaca permission override terbaru dari database.

### Constraints

- Keep the existing framework.
- Do not add a dependency without approval.
- Do not change the database schema without a migration.
- Jangan menjalankan aksi destruktif di server/database produksi tanpa konfirmasi.

### Validation

- Verifikasi status server Coolify berubah usable setelah host/SSH valid.
- Verifikasi service PostgreSQL aktif dan connection string tersedia.
- `npm run db:migrate` di folder `prastation` berhasil.
- Uji login ulang menunjukkan session baru memuat permission efektif terbaru.

### Result

Sedang berjalan. Website `prastation` sudah tersimpan di repo `ardyan160997-svg/prasapp`
dengan commit `8f53da1` (`prastation`). Investigasi Coolify menunjukkan blocker utama
ada pada server `localhost` yang masih memakai `IP Address/Domain` = `host.docker.internal`,
sehingga validasi server gagal. Langkah berikutnya adalah mengubah host server ke
`178.83.188.207`, memvalidasi server, lalu membuat PostgreSQL service untuk `prastation`
sebelum menjalankan migration dan seed.

---

## TASK-019 — Konversi project Prashoes ke dua aplikasi HTML

- Status: completed
- Requested route: auto
- Selected combo: webdev-build
- Priority: high
- Risk: high
- Dependencies: Admin Prashoes VPS API

### Objective

Mengganti project `prashoes` berbasis Next.js menjadi dua folder HTML/CSS/JS terpisah:
public website dan dashboard admin.

### Scope

- `prashoes/public/` untuk `prashoes.prasapp.com`.
- `prashoes/adminprashoes/` untuk `adminprashoes.prasapp.com`.
- Root build/check scripts dan dokumentasi struktur deploy.
- Penghapusan source/config/dependency Next.js dari project `prashoes`.

### Requirements

- Public site tetap memakai desain live static Prashoes.
- Public pickup, tracking, layanan, promo, benefit, dan gallery memakai API VPS admin.
- Admin UI tetap memakai PostgreSQL VPS melalui server-side Node API.
- Tidak ada credential atau connection string di client/source.

### Validation

- `npm run check` berhasil.
- `npm run build` menghasilkan `dist/public/` dan `dist/adminprashoes/`.
- Ad-hoc verifier memastikan source Next.js hilang dan integrasi API VPS tetap ada.

### Result

Selesai. Project `prashoes` sekarang static HTML/CSS/JS dengan folder `public/` dan
`adminprashoes/`. Source Next.js, React, Supabase migration, dan config framework sudah
dihapus dari project tersebut. Public site menggunakan API public Admin Prashoes VPS,
sedangkan admin menyimpan data melalui Node/PostgreSQL API server-side.

---

## TASK-020 — Kecilkan floating chat Prashoes

- Status: completed
- Requested route: auto
- Selected combo: quick-edit
- Priority: low
- Risk: low
- Dependencies: TASK-019

### Objective

Mengecilkan tombol floating chat agar lebih ringkas, tetap rata kanan, dan nyaman dilihat.

### Scope

- `prashoes/public/styles.css`
- `prashoes/public/index.html`

### Validation

- `npm run check` berhasil.
- `npm run build:public` berhasil.
- Ad-hoc verifier memastikan tombol, ikon, posisi kanan, cache bust source, dan artifact dist sesuai.

### Result

Selesai. Tombol floating chat tetap menampilkan ikon dan teks `Chat`. Panel/kotak chat saat dibuka dibuat rata kanan dengan lebar maksimum 380px agar tidak melebar full satu halaman. Perubahan sudah dideploy ke Cloudflare Pages.

---

## TASK-021 — Tambah profil member Prashoes

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-019

### Objective

Menambahkan halaman profil member untuk login, melihat order berjalan, upload bukti pembayaran QRIS, dan membuka profil dari dashboard public.

### Scope

- `prashoes/adminprashoes/server.js`
- `prashoes/public/index.html`
- `prashoes/public/app.js`
- `prashoes/public/styles.css`
- `prashoes/public/member-profile.html`
- `prashoes/public/member-profile.js`
- `prashoes/public/member-profile.css`
- `prashoes/public/images/icon.avif`

### Validation

- `npm run check` berhasil.
- `node --check public/member-profile.js` berhasil.
- `npm run build:public` berhasil.
- `npm run build:admin` berhasil.
- Ad-hoc verifier memastikan API login/profile, active orders, QRIS payment proof, dashboard badge, icon, cache-bust, dan dist artifact sesuai.

### Result

Selesai. Halaman `member-profile.html` sudah tersedia dengan login email + WhatsApp, CTA daftar member baru, daftar order berjalan, upload bukti QRIS, download nota, dan dashboard badge `Login` yang berubah menjadi nama member setelah login. Public site dan Admin API sudah dideploy.

---

## TASK-022 — Public chat unread badge dan admin Web Push

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: none

### Objective

Menampilkan jumlah balasan admin yang belum dibaca pada tombol chat public dan mengaktifkan Web Push admin untuk notifikasi masuk di HP.

### Scope

- `prashoes/public/index.html`
- `prashoes/public/app.js`
- `prashoes/public/styles.css`
- `prashoes/adminprashoes/index.html`
- `prashoes/adminprashoes/app.js`
- `prashoes/adminprashoes/styles.css`
- `prashoes/adminprashoes/server.js`
- `prashoes/adminprashoes/package.json`
- `prashoes/adminprashoes/package-lock.json`
- `prashoes/adminprashoes/manifest.webmanifest`
- `prashoes/adminprashoes/sw.js`
- `prashoes/adminprashoes/images/pwa-icon-192.png`
- `prashoes/adminprashoes/images/pwa-icon-512.png`

### Validation

- `npm run check` berhasil.
- `npm run build` berhasil.
- `git diff --check` berhasil.
- Ad-hoc verifier memastikan unread watermark public, badge chat, PWA manifest/service worker, push subscription API/DB, event trigger, dan artifact dist sesuai.

### Result

Selesai dan sudah dideploy. Tombol chat public menampilkan badge jumlah balasan admin yang belum dibaca dan menandainya dibaca saat panel dibuka. Admin memiliki PWA Web Push dengan subscription per perangkat untuk chat, pickup, bukti pembayaran, review claim, dan warranty claim. VAPID sudah dikonfigurasi pada environment VPS; setiap perangkat tetap harus memasang PWA dan memberikan izin notifikasi satu kali.

---

## TASK-023 — Public scoped Web Push untuk order dan chat

- Status: completed-local
- Requested route: user
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-022

### Objective

Mengaktifkan Web Push di `prashoes.prasapp.com` untuk customer public dengan scope aman: status order hanya ke pemesan, dan balasan chat hanya ke thread/customer terkait.

### Scope

- `prashoes/public/index.html`
- `prashoes/public/app.js`
- `prashoes/public/styles.css`
- `prashoes/public/manifest.webmanifest`
- `prashoes/public/sw.js`
- `prashoes/public/images/pwa-icon-192.png`
- `prashoes/public/images/pwa-icon-512.png`
- `prashoes/adminprashoes/server.js`

### Validation

- `npm run check` berhasil.
- `npm run build` berhasil.
- `git diff --check` berhasil.
- Ad-hoc verifier memastikan public PWA, push opt-in, subscription mapping, admin-only admin push isolation, scoped chat push, scoped order push, dan artifact dist sesuai.

### Result

Selesai lokal. Public PWA dan tombol `Aktifkan Notifikasi` tersedia di panel chat. Subscription public disimpan dengan audience `public` serta mapping chat session, WhatsApp, dan member code. Update status order mengirim push hanya ke subscription dengan WhatsApp/member terkait, dan balasan admin mengirim push hanya ke chat session terkait. Deploy menunggu instruksi `commit deploy`.

---

## TASK-024 — Bangun Prashine public dan admin laundry antar-jemput

- Status: completed-local
- Requested route: user
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: none

### Objective

Membuat aplikasi baru Prashine untuk laundry antar-jemput dengan public member, request pickup, tracking, admin operasional, layanan/harga editable, dan PostgreSQL terpisah.

### Scope

- `prashine/public/**`
- `prashine/adminprashine/**`
- `prashine/package.json`
- `TODO.md`

### Requirements

- Public menampilkan layanan dan harga, registrasi/login WhatsApp, request pickup dengan alamat dan GPS, serta tracking order.
- Admin memiliki login, pengelolaan layanan, daftar order, berat/harga final, dan perubahan status.
- Status order: diajukan, dijemput, ditimbang, dicuci, selesai, diantar.
- PostgreSQL, port, service, dan data sepenuhnya terpisah dari aplikasi lain.
- Harga awal: cuci kering Rp6.000/kg, cuci setrika Rp8.000/kg, setrika Rp5.000/kg, express tambahan Rp5.000/kg, minimal 3 kg.

### Validation

- Syntax check semua JavaScript.
- Domain tests.
- Static build public/admin lengkap.
- Focused API smoke test lokal.
- `git diff --check` berhasil.

### Result

Selesai lokal. Fondasi Prashine sudah mencakup public mobile untuk katalog layanan,
registrasi/login WhatsApp, request pickup dengan GPS, pesanan member, dan tracking kode.
Admin memiliki login, ringkasan operasional, pengelolaan layanan/harga, penimbangan,
perhitungan harga final, dan status berurutan. API mendukung PostgreSQL terpisah dengan
migration/rollback, serta fallback memory khusus development. Belum commit atau deploy.

---

## TASK-025 — Ganti header Prashine dengan aset logo

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: medium
- Risk: low
- Dependencies: TASK-024

### Objective

Mengganti ikon dan tulisan header public Prashine dengan aset logo AVIF yang diberikan.

### Scope

- `prashine/public/images/**`
- `prashine/public/app.js`
- `prashine/public/styles.css`
- halaman HTML public dan service worker untuk cache busting
- `prashine/package.json`
- `TODO.md`

### Validation

- Logo tidak terpotong pada header desktop/mobile.
- Kedua asset masuk output build.
- Syntax check, build, dan focused asset verification berhasil sebelum commit/deploy.

### Result

Selesai. Public Prashine memakai logo header dan favicon AVIF yang diberikan, background Beranda responsive desktop/mobile, carousel proses empat tahap dengan gambar dan auto-slide lima detik, serta pemilih tiga layanan berbentuk toggle yang meneruskan pilihan ke Pickup. Canonical check/build dan focused asset/behavior verification berhasil; perubahan di-commit dan dideploy ke production.

---

## TASK-026 — Tambahkan footer desktop publik PrasCell

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: low
- Risk: low
- Dependencies: none

### Objective

Menambahkan footer bersama pada seluruh halaman publik PrasCell untuk tampilan desktop tanpa menduplikasi navigasi mobile.

### Scope

- `prascell/public/index.html`
- `prascell/public/estimasi.html`
- `prascell/public/tracking.html`
- `prascell/public/chat.html`
- `prascell/public/member.html`
- `prascell/public/styles.css`
- `prascell/public/sw.js`
- `TODO.md`

### Validation

- Footer tampil pada desktop dan tersembunyi pada mobile.
- Bottom navigation tetap hanya tampil pada mobile.
- Tidak ada horizontal overflow.
- Canonical PrasCell check/build, `git diff --check`, dan focused ad-hoc footer verification berhasil.

### Result

Selesai. Lima halaman publik memakai footer biru–navy dengan logo, tagline, navigasi, CTA Estimasi, dan copyright. Footer halaman pendek tetap berada di bawah viewport, sedangkan mobile mempertahankan bottom navigation tanpa footer duplikat.

---

## TASK-027 — Samakan visual navigasi admin PrasCell dengan public

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: medium
- Risk: low
- Dependencies: TASK-026

### Objective

Menyamakan warna, logo, background header, dan tampilan bottom navigation admin PrasCell dengan website publik tanpa mengubah fungsi admin.

### Scope

- `prascell/adminprascell/*.html`
- `prascell/adminprascell/styles.css`
- `prascell/adminprascell/sw.js`
- `prascell/adminprascell/images/**`
- build manifests PrasCell
- `TODO.md`

### Validation

- Preview desktop dan mobile tanpa clipping atau horizontal overflow.
- Header memakai background PCB serta logo icon dan wordmark public.
- Bottom navigation memakai blue-glass, active orange, dan tombol Biaya raised.
- Canonical admin/root check dan build berhasil.
- Focused ad-hoc admin parity verification berhasil.

### Result

Selesai. Header admin memakai identitas visual public dengan lapisan kontras untuk menu desktop. Bottom navigation mempertahankan seluruh tujuan admin dengan warna dan treatment public. Preview desktop/mobile, canonical gate, dan focused verification lulus sebelum commit dan deploy.

---

## TASK-028 — Tambahkan stok, halaman garansi, dan navigasi admin ringkas

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-027

### Objective

Menambahkan inventori barang/sparepart, memisahkan pengelolaan garansi, menyeragamkan bottom navigation mobile, dan menampilkan badge perhatian operasional.

### Scope

- Schema additive `inventory_items` dan `inventory_movements`.
- API transaksi stok dengan row lock dan riwayat append-only.
- Halaman Stok Barang dan Garansi.
- Shared admin shell untuk secondary navbar dan empat bottom-nav mobile.
- Badge Home, Garansi, Chat, dan Order.
- Build/cache manifests serta tests PrasCell.

### Validation

- Domain test dan canonical admin/root check/build berhasil.
- Focused ad-hoc verification berhasil 56 checks.
- Preview desktop/mobile tanpa horizontal overflow.
- Secondary navbar memiliki touch target 44px.
- Bottom navigation berisi tepat Home, Garansi, Chat, dan Order tanpa tombol raised.
- Riwayat perubahan stok bersifat append-only dan item historis memakai `ON DELETE RESTRICT`.

### Result

Selesai. Admin memiliki inventori stok dengan batas minimum dan history perubahan, halaman garansi khusus, secondary navbar untuk menu operasional lain, empat bottom-nav mobile seragam, serta badge perhatian berbasis data dashboard.

---

## TASK-029 — Hubungkan purchasing, servis, garansi, dan cashflow

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: high
- Risk: high
- Dependencies: TASK-028

### Objective

Menambahkan ledger income/outcome yang terhubung dengan pembayaran order, purchasing stok, pemakaian sparepart servis, dan penggantian sparepart garansi tanpa double-posting.

### Scope

- Schema additive `cashflow_entries`, status pembayaran order, dan metadata pergerakan stok.
- Income otomatis saat order pertama kali berubah menjadi Lunas.
- Outcome otomatis saat perubahan stok bertipe Purchasing.
- Pemakaian sparepart servis dan garansi dengan row lock, snapshot biaya, serta idempotency key.
- Halaman Revenue & Cashflow dan transaksi manual.
- Bottom navigation lima item dengan Cashflow tepat di tengah dan badge order belum lunas.
- Build/cache manifests serta domain tests PrasCell.

### Validation

- Canonical admin/root check dan build berhasil.
- `git diff --check` berhasil.
- Focused ad-hoc cashflow verification berhasil 35 checks.
- Preview desktop/mobile tanpa horizontal overflow.
- Bottom navigation memiliki tepat lima item dan Cashflow di tengah.
- Mobile secondary navigation memiliki touch target 44px dan form dapat discroll di atas fixed navigation.

### Result

Selesai. Purchasing membuat outcome, status Lunas membuat income idempotent, pemakaian sparepart servis/garansi mengurangi stok dengan snapshot biaya tanpa menghitung outcome dua kali, dan ledger cashflow dapat mencatat transaksi manual.

---

## TASK-030 — Fit foto model HP yang diupload di admin PrasCell

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: medium
- Risk: low
- Dependencies: none

### Objective

Menyesuaikan tampilan gambar model HP di admin PrasCell agar foto yang di-upload tampil fit/cover penuh tanpa sisa ruang latar biru, sambil tetap mempertahankan ikon wireframe dan latar bawaan untuk model yang belum memiliki foto.

### Scope

- `prascell/adminprascell/styles.css`: ubah `.model-image img`, `.model-image-preview img`, dan `.model-detail-image img` menjadi `object-fit: cover` serta latar putih saat terdapat elemen `img`.
- `prascell/adminprascell/sw.js`: bump cache ke `adminprascell-v19` dan `styles.css?v=22`.
- `prascell/adminprascell/*.html`: perbarui query string stylesheet ke `styles.css?v=22`.
- `prascell/dist/adminprascell/`: sinkronisasi build artifact.

### Validation

- `git diff --check` bersih tanpa error.
- Script build artifact `dist` berhasil tanpa error.
- Rule `.model-image:has(img)` dan `.model-detail-image:has(img)` hanya aktif saat elemen `img` hadir, sehingga ikon outline wireframe pada model tanpa gambar tetap memakai latar gradasi bawaan.

### Result

Selesai. Foto model HP yang di-upload kini mengisi wadah kartu secara fit penuh (cover) dengan latar belakang putih rapi, sementara kartu tanpa foto tetap mempertahankan ikon placeholder wireframe dan gradasi biru aslinya.

---

## TASK-031 — Tombol tambah spesifikasi di bawah tabel pada edit Database HP

- Status: completed
- Requested route: user
- Selected combo: webdev-build
- Priority: medium
- Risk: low
- Dependencies: TASK-030

### Objective

Menambahkan tombol tambah baris spesifikasi (`+ Tambah Baris (Label)` dan `+ Tambah Baris (Nilai)`) di bagian bawah tabel spesifikasi pada form edit Database HP PrasCell agar teknisi/admin tidak perlu scroll ke atas saat menambah baris data spesifikasi baru.

### Scope

- `prascell/adminprascell/models.html`: tambahkan container `.spec-bottom-actions` berisi dua tombol tambah di bawah `#spec-rows`.
- `prascell/adminprascell/app.js`: dukung event listener klik untuk tombol tambah atas dan bawah.
- `prascell/adminprascell/styles.css`: styling `.spec-bottom-actions` responsif desktop & mobile.
- `prascell/adminprascell/sw.js`: bump cache ke `adminprascell-v20`, `styles.css?v=23`, `app.js?v=14`.
- `prascell/adminprascell/*.html`: update query asset.
- `prascell/dist/adminprascell/`: sinkronisasi build artifact.

### Validation

- `git diff --check` bersih tanpa error.
- Script build artifact `dist` berhasil tanpa error.
- Tombol di bawah terhubung ke fungsi `addSpecificationField` yang otomatis menambahkan baris dan memfokuskan kursor ke input yang sesuai.

### Result

Selesai. Form edit Database HP kini menyediakan tombol tambah di bawah tabel spesifikasi sehingga pengisian spesifikasi panjang dapat dilanjutkan langsung dari baris terakhir tanpa scroll ke atas.

---

## TASK-032 — Rapikan dashboard dan detail HP read-only Admin PrasCell

- Status: completed-local
- Requested route: user
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-031

### Objective

Merapikan katalog Database HP pada dashboard Admin PrasCell, mengecilkan search bar desktop, membuat kartu HP lebih terbaca dan clickable, serta menampilkan detail perangkat read-only dengan alur Back yang jelas.

### Scope

- `prascell/adminprascell/index.html`: pisahkan state browse dan detail dashboard.
- `prascell/adminprascell/app.js`: render kartu dashboard, search, detail read-only, Back, dan binding aman untuk halaman yang tidak memiliki form CRUD.
- `prascell/adminprascell/styles.css`: search maksimum 420px, grid 6/3/2 kolom, affordance kartu, dan detail responsif.
- `prascell/adminprascell/sw.js` dan seluruh HTML admin: cache `adminprascell-v21`, `styles.css?v=24`, dan `app.js?v=15`.
- `prascell/dist/adminprascell/`: sinkronisasi build artifact.

### Validation

- `npm run check`, domain tests, `npm run build`, dan `git diff --check` berhasil.
- Preview desktop: search 420px, grid 6 kolom, overflow horizontal 0.
- Preview mobile 390px: header tidak overlap, search 322px, grid 2 kolom, overflow horizontal 0.
- Search menyaring 6 kartu menjadi 1; klik kartu membuka detail dengan 0 input editable; Back mempertahankan query dan hasil.
- Final-scroll clearance terhadap bottom navigation 177px.

### Result

Selesai dan sudah dideploy. Dashboard HP sekarang rapi, kartu memiliki affordance `Lihat detail`, seluruh kartu dapat diketuk, detail hanya-baca menggantikan grid saat dibuka, dan Back mengembalikan grid tanpa menghapus pencarian. Commit `4311d52`; backup production `/root/prasapp/prascell/adminprascell/.release-backups/20261020-104501-dashboard-phone-catalog`.

---

## TASK-033 — Database HP read-only di public PrasCell

- Status: completed-local
- Requested route: user
- Selected combo: webdev-build
- Priority: high
- Risk: medium
- Dependencies: TASK-032

### Objective

Menampilkan Database HP tepat di bawah hero/background homepage public PrasCell agar pengunjung dapat mencari model dan membaca spesifikasi tanpa akses admin.

### Scope

- `prascell/public/index.html`: section browse/detail Database HP.
- `prascell/public/home.js`: fetch model aktif, search, kartu clickable, detail read-only, dan Back.
- `prascell/public/home.css`: katalog responsif 6/3/2 kolom.
- `prascell/adminprascell/server.js`: perluas payload public model dengan catatan dan spesifikasi saja.
- `prascell/package.json` dan `prascell/public/sw.js`: build-copy serta cache asset baru.

### Validation

- Preview desktop: search 440px, grid 6 kolom, overflow horizontal 0.
- Preview mobile 390px: search 354px, grid 2 kolom, overflow horizontal 0.
- Search menyaring 6 kartu menjadi 1; detail memiliki 0 field editable dan menampilkan baris spesifikasi; Back mempertahankan query.
- Final-scroll clearance terhadap bottom navigation 461px.
- Canonical check/build ditunda sampai approval visual atau permintaan commit sesuai workflow UI.

### Result

Selesai dan sudah dideploy. Katalog public memakai model aktif dari API production yang sama, hanya membuka merek, model, foto, catatan, dan spesifikasi. Tidak ada tombol Edit, software link, endpoint admin, atau data privat. Commit `86bf626`; backend backup `/root/prasapp/prascell/adminprascell/.release-backups/20261021-003519-public-phone-catalog-api`; frontend live di `prascell.prasapp.com`.

---

## TASK-034 — Pindahkan dan ringkas Database HP public PrasCell

- Status: completed-local
- Requested route: user
- Selected combo: quick-edit
- Priority: medium
- Risk: low
- Dependencies: TASK-033

### Objective

Memindahkan section Database HP ke bawah Menu cepat dan membatasi state awal agar homepage tidak terlalu panjang.

### Scope

- `prascell/public/index.html`: urutan Hero → Menu cepat → Database HP serta tombol toggle.
- `prascell/public/home.js`: tampilkan 6 HP awal, toggle seluruh model, dan search seluruh database.
- `prascell/public/home.css`: styling tombol toggle.
- `prascell/public/sw.js`: cache `prascell-public-v12`, `home.css?v=5`, dan `home.js?v=2`.

### Validation

- Preview mobile 390px menunjukkan urutan Hero → Menu cepat → Database HP.
- State awal menampilkan 6 dari 32 model dalam grid 2 kolom tanpa horizontal overflow.
- `Lihat semua 32 HP` membuka 32 kartu; `Tampilkan 6 HP` mengembalikan state ringkas.
- Search tetap mencakup seluruh database dan menyembunyikan toggle saat aktif.
- Canonical check/build ditunda sampai approval visual atau permintaan commit sesuai workflow UI.

### Result

Selesai lokal. Database HP sekarang berada setelah Menu cepat dan hanya menampilkan 6 HP pada state awal. Belum commit atau deploy.
