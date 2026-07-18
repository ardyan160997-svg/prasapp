import type { ServiceItem, TrackingStatus, PromoItem } from "@/types";

// Dummy tracking data for Step 1
// Future: query `orders` table by order_code
export const dummyTrackingData: Record<string, string> = {
  PRS001: "Sepatu diterima dan sedang diperiksa.",
  PRS002: "Proses deep clean sedang berjalan.",
  PRS003: "Sepatu selesai dan siap diantar.",
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
    description: "Daftar sekarang dan langsung dapat diskon 10% untuk layanan pertama.",
    discountLabel: "Diskon 10%",
  },
  {
    id: "promo-2",
    title: "Paket Teman",
    description: "Ajak 2 teman dan dapatkan harga spesial untuk 3 sepatu sekaligus.",
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