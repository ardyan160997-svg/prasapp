"use client";

import Link from "next/link";

export function StudioShowcase() {
  const packages = [
    {
      name: "Paket PS5 Harian",
      slug: "paket-ps5-harian",
      price: "Rp150.000/hari",
      includes: ["PS5 Konsol Original", "2x Controller DualSense", "Kabel HDMI & Power", "Pilihan 2 Game"],
      popular: true,
    },
    {
      name: "Paket PS4 Harian",
      slug: "paket-ps4-harian",
      price: "Rp100.000/hari",
      includes: ["PS4 Slim/Consol Original", "2x Controller DualShock 4", "Kabel HDMI & Power", "Pilihan 2 Game"],
      popular: false,
    },
    {
      name: "Paket Mingguan PS5",
      slug: "paket-mingguan-ps5",
      price: "Rp850.000/7 hari",
      includes: ["PS5 Konsol Original", "2x Controller DualSense", "Kabel HDMI & Power", "Pilihan 4 Game", "Prioritas Extend"],
      popular: true,
    },
    {
      name: "Paket Full Set Mabar",
      slug: "paket-fullset-mabar",
      price: "Rp250.000/hari",
      includes: ["PS5 Konsol", "4x Controller DualSense", "Kabel HDMI & Power", "5 Game Populer", "Charging Station"],
      popular: false,
    },
  ];

  return (
    <section id="studio" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Paket <span className="text-yellow-400">Sewa Populer</span>
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Paket rental paling laris. Siap main tinggal ambil atau antar ke lokasi.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg, i) => (
            <Link key={i} href={`/paket/${pkg.slug}`} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-yellow-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-yellow-400/10 active:scale-[0.98]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              {pkg.popular && (
                <div className="absolute top-3 right-3 z-10 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-bold text-black">
                  POPULER
                </div>
              )}
              <div className="relative aspect-video overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-20 w-28 rounded-xl bg-zinc-600/80" />
                    <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Gambar {pkg.name}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                  <span className="rounded-full bg-yellow-400/20 px-2.5 py-1 text-xs font-bold text-yellow-400">{pkg.price}</span>
                </div>
                <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <span>Siap Main 2-4 Orang</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.includes.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400 border border-white/10">
                      {item}
                    </span>
                  ))}
                  {pkg.includes.length > 3 && (
                    <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-400/30">
                      +{pkg.includes.length - 3} item lagi
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/paket" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15">
            Lihat Semua Paket Sewa
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}