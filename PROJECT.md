# Prasapp Project Context

Dokumen ini adalah sumber konteks stabil untuk agent yang bekerja di repository `prasapp`. Baca bersama [`TODO.md`](TODO.md) sebelum mengubah kode. `TODO.md` adalah ledger task historis dan aktif; prioritaskan blok berstatus `in-progress` atau belum selesai. Untuk status runtime terbaru, selalu verifikasi langsung; jangan menganggap dokumen ini sebagai bukti kondisi live.

## Prinsip kerja

- Gunakan Bahasa Indonesia yang ringkas dan langsung.
- Inspect file, symbol, pemakaiannya, dan manifest package sebelum mengubah kode.
- Jangan menyentuh perubahan lokal milik user yang tidak terkait.
- Jangan commit, push, atau deploy kecuali diminta eksplisit.
- Jangan membaca atau mencetak secret. Biarkan `.env` dan credential tetap privat.
- Jangan mengubah SSH, key, user, permission, firewall, DNS, VPN/Tailscale, port, atau routing tanpa permintaan eksplisit.
- Untuk perubahan database, upload, atau deploy: buat backup terlebih dahulu dan verifikasi hasilnya.
- Pertahankan data historis. Perubahan schema harus additive; movement stok, order, pembayaran, dan data kiriman tidak boleh ditulis ulang tanpa alasan bisnis eksplisit.
- UI visual harus dipreview pada desktop dan mobile sebelum commit/deploy.

## Struktur repository

| Project | Source utama | Backend/admin |
|---|---|---|
| PrasCell | `prascell/` | `prascell/adminprascell/` |
| PrasEats | `praseats/` | `praseats/adminpraseats/` |
| Prashine | `prashine/` | `prashine/adminprashine/` |
| Prashoes | `prashoes/` | `prashoes/adminprashoes/` |
| Novia | `novia/` | Periksa runtime aktual sebelum perubahan |
| Shared image converter | `shared/image-converter/` | Sharp/libvips, dipakai backend Node |

Project lain di repository bukan otomatis bagian dari scope. Periksa permintaan user dan `git status` sebelum bekerja.

## Production VPS

SSH alias yang digunakan untuk runtime Prasapp:

```text
agent-public
```

Root source production:

```text
/root/prasapp
```

Service dan domain admin yang diketahui:

| Service | Domain | Working directory |
|---|---|---|
| `adminprascell.service` | `https://adminprascell.prasapp.com` | `/root/prasapp/prascell/adminprascell` |
| `adminpraseats.service` | `https://adminpraseats.prasapp.com` | `/root/prasapp/praseats/adminpraseats` |
| `adminprashine.service` | `https://adminprashine.prasapp.com` | `/root/prasapp/prashine/adminprashine` |
| `adminprashoes.service` | `https://adminprashoes.prasapp.com` | `/root/prasapp/prashoes/adminprashoes` |

Jangan menganggap daftar ini selalu lengkap. Inventaris aktual dengan nginx, systemd, dan health endpoint sebelum operasi lintas project.

## Shared AVIF converter

Source:

```text
shared/image-converter/
```

Runtime VPS:

```text
/root/prasapp/shared/image-converter
```

Kontrak saat ini:

- Input: JPEG, PNG, WebP, atau AVIF.
- Output: AVIF.
- Auto-rotate dari metadata.
- Resize maksimal `1600×1600`, `fit: inside`, tanpa memperbesar gambar kecil.
- Default quality `62` dan effort `4`.
- Default input maksimum `8 MB`; batas aplikasi yang lebih kecil tetap berlaku.
- Tidak memiliki endpoint atau port publik. Backend memanggil library lokal dengan:

```js
const { toAvif } = require('../../shared/image-converter');
```

Integrasi aktif:

- PrasCell: gambar model HP, panduan/disassembly, dan stok barang.
- PrasEats: menu, bukti pembayaran, dan foto profil member.
- Prashoes: foto progres order, member, review, dan bukti pembayaran.
- Prashine: library tersedia di VPS, tetapi belum ada jalur upload gambar yang perlu diintegrasikan.

Saat menambah jalur upload baru, konversikan setelah validasi file tetapi sebelum file final atau URL database disimpan. Jangan hapus file lama sebelum hasil baru sukses ditulis dan transaksi data sukses.

## PrasCell conventions

- Artifact admin production: `prascell/dist/adminprascell`.
- UI admin: biru–oranye/PCB, desktop dan mobile.
- Database HP, Biaya, Panduan, dan Stok memakai pola browse/search/grid → detail read-only → Edit → Back.
- Database HP menyimpan spesifikasi terstruktur `{category,label,value}` dan software links HTTPS.
- Stok menyimpan foto pada `inventory_items.image_url` secara additive.
- Movement stok bersifat historis/append-only. Edit foto atau metadata tidak boleh menghasilkan movement quantity palsu.
- Upload disimpan di direktori durable di luar artifact `dist`; deploy tidak boleh menghapus uploads.
- Service worker/cache version harus dinaikkan bila asset frontend berubah.

Canonical verification:

```bash
cd prascell
npm run check
npm run build
git diff --check -- .
```

## PrasEats conventions

- Warna utama leaf green `#4CAF50`/`#66BB6A`; jangan mengganti menjadi dark green.
- Order, cart, member, chat, notification, dan delivery bersifat member-scoped.
- Upload menu dan payment proof menjadi file AVIF.
- Foto profil member menjadi data URI `data:image/avif;base64,...` setelah resize maksimal `320×320`.
- Jangan mengubah status pembayaran atau order sebagai efek samping pengolahan gambar.

Canonical verification:

```bash
cd praseats
npm run check
npm run build
git diff --check -- .
```

## Prashoes conventions

- UI kuning/hitam/putih.
- Data layanan live dapat dioverride API/database; perubahan source frontend saja belum tentu mengubah production.
- Foto order/status/admin chat dan push harus tetap terikat ke member/nonmember yang benar.
- Upload progres order, profil, review, dan pembayaran dikonversi menjadi AVIF.
- Upload lama harus tetap bisa dibaca; converter hanya berlaku untuk upload baru.

Canonical verification:

```bash
cd prashoes/adminprashoes
npm run check
npm run build
git diff --check -- ../..
```

## Deployment discipline

Untuk upload, deploy, restart, live verification, atau rollback, baca `.agent/skills/prasapp-vps-deploy/SKILL.md` terlebih dahulu.

1. Jalankan `git status` dan pastikan setiap file yang akan di-stage memang bagian scope.
2. Jalankan canonical check/build project yang berubah.
3. Buat focused **ad-hoc verification** untuk behavior baru. Script sementara harus memakai path OS-safe dari `tempfile`, prefix `hermes-verify-`, lalu dihapus.
4. Jalankan `git diff --check`.
5. Stage file eksplisit; jangan gunakan broad staging bila worktree berisi perubahan lain.
6. Commit hanya jika diminta.
7. Sebelum deploy, backup runtime yang akan diganti, uploads terkait, dan database jika schema/data disentuh.
8. Deploy artifact/source sempit; jangan menghapus uploads atau `.env`.
9. Restart hanya service terdampak.
10. Readiness memakai retry, bukan sleep tunggal.
11. Verifikasi local service, public HTTPS, API health, exact asset/server hash bila relevan, dan behavior baru.
12. Laporkan backup path, commit, service state, dan hasil nyata. Jangan menyatakan sukses tanpa output verifikasi.

Health endpoint yang diketahui:

```text
https://adminprascell.prasapp.com/api/health
https://adminpraseats.prasapp.com/api/health
https://adminprashine.prasapp.com/api/health
https://adminprashoes.prasapp.com/api/health
```

## Aturan backup

- Simpan backup release di bawah project/runtime `.release-backups/` atau `/root/prasapp/.release-backups/` untuk perubahan shared.
- Backup minimal: file runtime yang diganti dan uploads yang terkait.
- Tambahkan database dump sebelum migrasi schema atau data.
- Jangan menimpa atau menghapus backup lama dalam task deployment biasa.

## Larangan penting

- Jangan menyentuh `coolify-db`.
- Jangan menghapus uploads saat mengganti `dist`.
- Jangan mengubah remote access/networking sebagai bagian deploy aplikasi.
- Jangan mencampurkan perubahan project lain yang sudah ada di worktree.
- Jangan menaruh credential, password, token, database URL, atau isi `.env` di dokumentasi, commit, output, maupun TODO.
- Jangan memperlakukan session history atau dokumen ini sebagai bukti live; cek sumber asli dan runtime saat ini.

## Setelah pekerjaan selesai

- Ikuti format task block yang sudah ada di `TODO.md`; jangan menghapus task completed kecuali project owner meminta cleanup.
- Saat mengubah task, pertahankan status, scope, validation, dan result yang sudah tercatat; jangan merombak ledger di luar scope.
- Perbarui dokumen ini hanya jika arsitektur, path, domain, kontrak, atau prosedur stabil berubah.
