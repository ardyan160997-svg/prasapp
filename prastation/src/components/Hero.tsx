"use client";

import Link from "next/link";

import { Hero3DPlaceholder } from "./Hero3DPlaceholder";

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-zinc-950">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/60 to-zinc-950/30"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pb-16 pt-28 md:pb-24 md:pt-36 lg:pb-32 lg:pt-44">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/15 px-4 py-1.5 text-xs font-medium tracking-wide text-yellow-400 backdrop-blur-sm md:text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                #1 Rental PlayStation Jakarta
              </div>

              <h1 className="max-w-3xl text-[clamp(2rem,5.5vw,4rem)] font-bold leading-[1.1] tracking-tight text-white">
                Main PS5 & PS4,<br />
                <span className="text-yellow-400">Tanpa Beli Konsol</span>
                Hanya Bayar Sewa.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 md:text-base">
                Sewa PlayStation 5, PS4, PS VR2, controller, headset, dan game lengkap. Harga terjangkau, siap main di rumah atau bawa pulang. Tidak perlu beli konsol mahal.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="#booking"
                  className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Sewa Sekarang
                </Link>
                <Link
                  href="#layanan"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Lihat Paket
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-xs text-zinc-200 backdrop-blur-sm md:text-sm">
                  <svg className="h-3.5 w-3.5 shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Konsol Original & Terawat</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-xs text-zinc-200 backdrop-blur-sm md:text-sm">
                  <svg className="h-3.5 w-3.5 shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Sewa Harian/Mingguan</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-xs text-zinc-200 backdrop-blur-sm md:text-sm">
                  <svg className="h-3.5 w-3.5 shrink-0 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Game Library Lengkap</span>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-4 md:gap-4">
                <TrustMetric number="50+" label="Konsol Tersedia" />
                <TrustMetric number="200+" label="Game Library" />
                <TrustMetric number="1000+" label="Penyewa Puas" />
                <TrustMetric number="4.9" label="Rating Google" />
              </div>
      </div>

      <div className="relative mx-auto h-[50vh] min-h-[300px] w-full max-w-4xl">
        <Hero3DPlaceholder />
      </div>
    </section>
  );
}

function TrustMetric({ number, label }: { number: string; label: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-zinc-800/60 to-zinc-900/60 p-5 backdrop-blur-xl transition-all duration-300 md:p-6 md:hover:-translate-y-1 md:hover:border-yellow-400/60 md:hover:shadow-lg md:hover:shadow-yellow-400/20 active:scale-[0.97] active:border-yellow-400/50">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -inset-16 rounded-full bg-yellow-400/5 opacity-0 blur-3xl transition-all duration-500 md:-inset-20 group-hover:opacity-100" />
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center transition-all duration-300 md:h-16 md:w-16">
        <div className="absolute inset-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 transition-all duration-300 group-hover:border-yellow-400/60 group-hover:bg-yellow-500/20" />
        <div className="absolute inset-2 rounded-full bg-yellow-400/15 blur-md transition-all duration-300 group-hover:bg-yellow-400/30 group-hover:blur-lg" />
        <svg className="relative h-6 w-6 text-yellow-400 transition-all duration-300 group-hover:text-yellow-300 group-hover:scale-110 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="mt-3 text-base font-bold text-yellow-400 md:text-lg">{number}</h3>
      <p className="mt-0.5 text-xs leading-relaxed text-zinc-400 md:text-sm">{label}</p>
    </div>
  );
}