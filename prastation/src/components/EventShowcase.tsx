"use client";

import Link from "next/link";

export function EventShowcase() {
  const promos = [
    {
      title: "Promo Libur Sekolah",
      slug: "promo-libur-sekolah",
      date: "Juni - Juli 2025",
      desc: "Paket mingguan diskon 20% untuk liburan sekolah anak-anak. PS5 full set + game edukasi.",
      price: "Dari Rp680.000/minggu",
      isActive: true,
      image: "/images/promo-1.jpg",
    },
    {
      title: "Promo Akhir Pekan",
      slug: "promo-akhir-pekan",
      date: "Setiap Sabtu-Minggu",
      desc: "Sewa PS5 harian harga flat Rp125.000 (normal Rp150.000). Cocok mabar bareng teman.",
      price: "Rp125.000/hari",
      isActive: true,
      image: "/images/promo-2.jpg",
    },
    {
      title: "Paket Keluarga Hemat",
      slug: "paket-keluarga-hemat",
      date: "Selalu Tersedia",
      desc: "PS4 + 2 Stik + 3 Game keluarga (Minecraft, Overcooked, FIFA) hanya Rp120.000/hari.",
      price: "Rp120.000/hari",
      isActive: true,
      image: "/images/promo-3.jpg",
    },
  ];

  return (
    <section id="event" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Promo & <span className="text-yellow-400">Paket Hemat</span>
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Dapatkan harga lebih murah untuk sewa PlayStation. Promo berlaku terbatas, cek ketersediaan sekarang.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo, idx) => (
            <Link key={idx} href={`/promo/${promo.slug}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-yellow-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-yellow-400/10">
              <div className="aspect-video overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-20 w-28 rounded-xl bg-zinc-600/80" />
                    <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Banner Promo</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {promo.date}
                  </span>
                  {promo.isActive && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 border border-green-500/30">
                      AKTIF
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors">
                  {promo.title}
                </div>
                <p className="mb-3 text-sm text-zinc-400">{promo.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                    {promo.price}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/promo" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15">
            Lihat Semua Promo
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}