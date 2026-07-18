import type { ServiceItem, PromoItem, OrderTrackingResult } from "@/types";

// ============================
// Order tracking data (v2 — with items & photos)
// Each order can have multiple shoe items, each with before/after photos
// ============================
export const dummyTrackingData: Record<string, OrderTrackingResult> = {
  PRS001: {
    order_code: "PRS001",
    status: "Sepatu diterima dan sedang diperiksa.",
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-16T14:30:00Z",
    items: [
      {
        item_number: 1,
        shoe_description: "Nike Air Force 1 \u2014 Putih",
        service_name: "Deep Clean",
        item_status: "Sedang diperiksa",
        notes: "Ada noda membandel di bagian toe box.",
        photos: [
          {
            photo_type: "before",
            image_url: "",
            caption: "Foto sebelum \u2014 bagian depan",
          },
        ],
      },
      {
        item_number: 2,
        shoe_description: "Adidas Ultraboost \u2014 Hitam",
        service_name: "Fast Clean",
        item_status: "Sedang diperiksa",
        notes: "",
        photos: [],
      },
    ],
  },
  PRS002: {
    order_code: "PRS002",
    status: "Proses deep clean sedang berjalan.",
    created_at: "2026-01-14T09:00:00Z",
    updated_at: "2026-01-17T08:00:00Z",
    items: [
      {
        item_number: 1,
        shoe_description: "Air Jordan 1 \u2014 Retro High",
        service_name: "Deep Clean",
        item_status: "Proses pembersihan",
        notes: "Pembersihan upper dan midsole.",
        photos: [
          {
            photo_type: "before",
            image_url: "",
            caption: "Foto sebelum masuk",
          },
        ],
      },
    ],
  },
  PRS003: {
    order_code: "PRS003",
    status: "Sepatu selesai dan siap diantar.",
    created_at: "2026-01-10T11:00:00Z",
    updated_at: "2026-01-18T16:00:00Z",
    items: [
      {
        item_number: 1,
        shoe_description: "New Balance 990 \u2014 Grey",
        service_name: "Premium Package",
        item_status: "Selesai",
        notes: "Hasil memuaskan, semua noda hilang.",
        photos: [
          {
            photo_type: "before",
            image_url: "",
            caption: "Sebelum treatment",
          },
          {
            photo_type: "after",
            image_url: "",
            caption: "Sesudah treatment \u2014 bersih maksimal",
          },
        ],
      },
      {
        item_number: 2,
        shoe_description: "Vans Old Skool \u2014 Hitam",
        service_name: "Deep Clean",
        item_status: "Selesai",
        notes: "",
        photos: [
          {
            photo_type: "before",
            image_url: "",
            caption: "Sebelum",
          },
        ],
      },
      {
        item_number: 3,
        shoe_description: "Converse Chuck Taylor \u2014 Putih",
        service_name: "Unyellowing",
        item_status: "Selesai",
        notes: "Sol menguning berhasil dikembalikan.",
        photos: [
          {
            photo_type: "before",
            image_url: "",
            caption: "Sol menguning sebelum treatment",
          },
          {
            photo_type: "after",
            image_url: "",
            caption: "Setelah unyellowing \u2014 sol kembali putih",
          },
        ],
      },
    ],
  },
};

// Service pricelist
// Future: read from `services` table
export const services: ServiceItem[] = [
  {
    id: "svc-1",
    name: "Fast Clean",
    slug: "fast-clean",
    description:
      "Pembersihan cepat untuk sepatu sehari-hari. Cocok untuk perawatan rutin.",
    startingPrice: "Mulai Rp25.000",
  },
  {
    id: "svc-2",
    name: "Deep Clean",
    slug: "deep-clean",
    description:
      "Pembersihan menyeluruh bagian upper, midsole, outsole, dan insole.",
    startingPrice: "Mulai Rp45.000",
  },
  {
    id: "svc-3",
    name: "Unyellowing",
    slug: "unyellowing",
    description:
      "Perawatan khusus untuk mengembalikan warna sol yang menguning.",
    startingPrice: "Mulai Rp55.000",
  },
  {
    id: "svc-4",
    name: "Repaint",
    slug: "repaint",
    description:
      "Pewarnaan ulang bagian sepatu yang sudah pudar atau tergores.",
    startingPrice: "Mulai Rp65.000",
  },
  {
    id: "svc-5",
    name: "Leather Care",
    slug: "leather-care",
    description:
      "Perawatan khusus bahan kulit termasuk pembersihan, pelembap, dan proteksi.",
    startingPrice: "Mulai Rp75.000",
  },
  {
    id: "svc-6",
    name: "Premium Package",
    slug: "premium-package",
    description:
      "Paket lengkap: deep clean, unyellowing, repaint, dan leather care dalam satu sesi.",
    startingPrice: "Mulai Rp150.000",
  },
];

// Service dropdown options for pickup form
export const serviceOptions = [
  "Fast Clean",
  "Deep Clean",
  "Unyellowing",
  "Repaint",
  "Leather Care",
];

// Member benefits
// Future: read from `members` table
export const memberBenefits = [
  "Diskon khusus member aktif.",
  "Prioritas antrean saat periode ramai.",
  "Riwayat treatment sepatu tersimpan.",
  "Voucher ulang tahun dan promo bulanan.",
];

// Active promos
// Future: read from `promos` table
export const activePromos: PromoItem[] = [
  {
    id: "promo-1",
    title: "Promo Member Baru",
    description:
      "Daftar sekarang dan langsung dapat diskon 10% untuk layanan pertama.",
    discountLabel: "Diskon 10%",
  },
  {
    id: "promo-2",
    title: "Paket Teman",
    description:
      "Ajak 2 teman dan dapatkan harga spesial untuk 3 sepatu sekaligus.",
    discountLabel: "Harga Spesial",
  },
];

// Service type options for tracking statuses
// Future: mapping for `orders.status`
export const statusFlow: string[] = [
  "Pesanan dibuat",
  "Sepatu diterima",
  "Sedang diperiksa",
  "Proses pembersihan",
  "Proses pengeringan",
  "Quality check",
  "Siap diambil",
  "Siap diantar",
  "Selesai",
];