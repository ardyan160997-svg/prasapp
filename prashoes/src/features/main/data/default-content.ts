import type { PromoItem, ServiceItem } from "@/features/main/types";

export const defaultServices: ServiceItem[] = [
  {
    id: "default-fast-clean",
    name: "Fast Clean",
    slug: "fast-clean",
    description: "Pembersihan cepat untuk sepatu harian yang butuh refresh ringan.",
    startingPrice: "Mulai Rp25.000",
  },
  {
    id: "default-deep-clean",
    name: "Deep Clean",
    slug: "deep-clean",
    description: "Pembersihan menyeluruh untuk upper, midsole, outsole, dan insole.",
    startingPrice: "Mulai Rp45.000",
  },
  {
    id: "default-unyellowing",
    name: "Unyellowing",
    slug: "unyellowing",
    description: "Treatment khusus untuk mengembalikan sol yang menguning.",
    startingPrice: "Mulai Rp55.000",
  },
  {
    id: "default-repaint",
    name: "Repaint",
    slug: "repaint",
    description: "Pewarnaan ulang bagian sepatu yang pudar atau tergores.",
    startingPrice: "Mulai Rp65.000",
  },
  {
    id: "default-leather-care",
    name: "Leather Care",
    slug: "leather-care",
    description: "Perawatan bahan kulit dengan pembersihan, pelembap, dan proteksi.",
    startingPrice: "Mulai Rp75.000",
  },
  {
    id: "default-premium-package",
    name: "Premium Package",
    slug: "premium-package",
    description: "Paket lengkap untuk treatment total dalam satu sesi.",
    startingPrice: "Mulai Rp150.000",
  },
];

export const defaultServiceOptions = defaultServices.map((service) => service.name);

export const defaultMemberBenefits = [
  "Member baru dapat promo diskon 10% untuk order pertama.",
  "Gratis 1x Deep Clean setelah akumulasi 10x Deep Clean.",
  "Gratis ongkir untuk member dengan minimal 2 pair sepatu.",
  "Riwayat treatment sepatu tersimpan di halaman member.",
];

export const defaultPromos: PromoItem[] = [
  {
    id: "default-promo-member-baru",
    title: "Promo Member Baru",
    description: "Daftar member dan dapatkan diskon 10% untuk order pertama.",
    discountLabel: "Diskon 10%",
  },
  {
    id: "default-promo-ongkir",
    title: "Benefit Ongkir Member",
    description: "Member mendapat gratis ongkir untuk pickup minimal 2 pair sepatu.",
    discountLabel: "Free Ongkir",
  },
];
