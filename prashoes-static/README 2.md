# Prashoes Static

Versi static HTML/CSS/JS dari web Prashoes. Tidak memakai Next.js, React, Supabase, atau database.

## File utama

- `index.html` — struktur halaman.
- `styles.css` — styling halaman.
- `app.js` — interaksi: menu mobile, form WhatsApp, kalkulasi estimasi, tracking fallback.
- `data.js` — konten yang paling sering diedit: harga, promo, benefit, kontak, gallery.
- `images/` — asset gambar.
- `dist/` — folder bersih untuk deploy.

## Edit harga / promo / kontak

Edit `data.js`.

Contoh ubah harga:

```js
{
  id: "fast-clean",
  name: "Fast Clean",
  startingPrice: "Mulai Rp25.000",
}
```

Contoh ubah WhatsApp:

```js
contact: {
  whatsapp: "https://wa.me/6285601679005",
}
```

## Tambah Before/After

Taruh foto di `images/`, lalu isi `galleryItems` di `data.js`:

```js
galleryItems: [
  {
    id: "gallery-1",
    label: "Deep Clean - Nike Air Force 1",
    beforeUrl: "images/before-1.jpg",
    afterUrl: "images/after-1.jpg",
  },
]
```

## Jalankan lokal

```bash
cd /Users/ardyan.prasetya/Documents/prasapp/prashoes-static
python3 -m http.server 4173
```

Buka:

```text
http://127.0.0.1:4173/
```

## Deploy

Deploy isi folder `dist/`, bukan root project lama Next.js.

Static host yang cocok:

- VPS nginx static
- Cloudflare Pages
- Netlify
- Vercel static project
- GitHub Pages

## Catatan fitur

- Form antar jemput membuka WhatsApp dengan pesan otomatis.
- Tracking pesanan tidak tersambung database; diarahkan cek via WhatsApp.
- Tidak ada migrasi Supabase karena database kosong dan static site tidak butuh DB.
