"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, RefreshCw, MessageCircle, Clock3 } from "lucide-react";

const features = [
  "Aman untuk Semua Bahan",
  "Bersih Maksimal Hasil Premium",
  "Antar Jemput Mudah & Cepat",
] as const;

const benefitCards = [
  {
    icon: ShieldCheck,
    title: "Jaminan",
    subtitle: "Bersih",
    description: "Hasil maksimal sesuai bahan sepatu",
  },
  {
    icon: RefreshCw,
    title: "Garansi",
    subtitle: "Cuci Ulang",
    description: "Kurang puas? Kami treatment ulang",
  },
  {
    icon: MessageCircle,
    title: "Free",
    subtitle: "Konsultasi",
    description: "Cek bahan & treatment terbaik",
  },
  {
    icon: Clock3,
    title: "2–3 Hari",
    subtitle: "Selesai",
    description: "Estimasi cepat dan terpantau",
  },
] as const;

function BenefitIcon({ icon: Icon }: { icon: typeof ShieldCheck }) {
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center transition-all duration-300 md:h-16 md:w-16">
      {/* Outer glow ring — stronger border on desktop hover via group */}
      <div className="absolute inset-0 rounded-full border border-yellow-500/30 bg-yellow-500/10 transition-all duration-300 group-hover:border-yellow-400/60 group-hover:bg-yellow-500/20" />
      {/* Inner blur glow — stronger glow on desktop hover */}
      <div className="absolute inset-2 rounded-full bg-yellow-400/15 blur-md transition-all duration-300 group-hover:bg-yellow-400/30 group-hover:blur-lg" />
      {/* Sparkle accent top-right */}
      <svg
        className="absolute -right-1 -top-1 h-4 w-4 text-yellow-300/60 transition-all duration-300 group-hover:text-yellow-200/80 group-hover:scale-110"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 0l1.2 4.8L14 6l-4.8 1.2L8 12l-1.2-4.8L2 6l4.8-1.2z" />
      </svg>
      {/* Sparkle accent bottom-left */}
      <svg
        className="absolute -bottom-0.5 -left-0.5 h-3 w-3 text-yellow-300/40 transition-all duration-300 group-hover:text-yellow-200/60 group-hover:scale-110"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 0l1.2 4.8L14 6l-4.8 1.2L8 12l-1.2-4.8L2 6l4.8-1.2z" />
      </svg>
      <Icon className="relative h-6 w-6 text-yellow-400 transition-all duration-300 group-hover:text-yellow-300 group-hover:scale-110 md:h-7 md:w-7" />
    </div>
  );
}

export default function HeroVisual() {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-zinc-950">
      {/* --- Full-bleed hero background image --- */}
      <div className="absolute inset-0">
        {!imgError && (
          <Image
            src="/images/hero-shoe.avif"
            alt="Prashoes premium shoe cleaning service — sepatu bersih dan terawat"
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            priority
            sizes="100vw"
          />
        )}

        {/* Dark gradient overlay — left side heavier for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/60 to-zinc-950/30" />

        {/* Bottom gradient fade for stats area */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />

        {/* Additional vignette darkness */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* --- Fallback when image fails --- */}
      {imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <p className="text-sm text-zinc-500">
            Image <span className="font-mono text-yellow-400">hero-shoe.avif</span> not found in{" "}
            <span className="font-mono text-yellow-400">public/images/</span>
          </p>
        </div>
      )}

      {/* --- Content overlay --- */}
      {!imgError && (
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pb-16 pt-28 md:pb-24 md:pt-36 lg:pb-32 lg:pt-44">
          {/* Badge */}
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/15 px-4 py-1.5 text-xs font-medium tracking-wide text-yellow-400 backdrop-blur-sm md:text-sm">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
            #1 Shoe Care &amp; Cleaning Service
          </div>

          {/* Headline */}
          <h1 className="max-w-3xl text-[clamp(2rem,5.5vw,4rem)] font-bold leading-[1.1] tracking-tight text-white">
            Sepatu Bersih,
            <br />
            <span className="text-yellow-400">Percaya Diri</span> Naik.
          </h1>

          {/* Description */}
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 md:text-base">
            Prashoes melayani cuci sepatu profesional dengan perawatan
            terbaik untuk semua jenis bahan.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#antar-jemput"
              className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Pesan Sekarang
            </a>
            <a
              href="#harga"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Lihat Harga
            </a>
          </div>

          {/* Feature items */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {features.map((f) => (
              <div
                key={f}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-xs text-zinc-200 backdrop-blur-sm md:text-sm"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* --- Hero bottom benefit cards --- */}
          <div className="mt-12 grid grid-cols-2 gap-3 md:mt-16 md:grid-cols-4 md:gap-4">
            {benefitCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-zinc-800/60 to-zinc-900/60 p-5 backdrop-blur-xl transition-all duration-300 md:p-6 md:hover:-translate-y-1 md:hover:border-yellow-400/60 md:hover:shadow-lg md:hover:shadow-yellow-400/20 active:scale-[0.97] active:border-yellow-400/50"
                >
                  {/* Shine overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Glow on hover — stronger on desktop */}
                  <div className="pointer-events-none absolute -inset-16 rounded-full bg-yellow-400/5 opacity-0 blur-3xl transition-all duration-500 md:-inset-20 group-hover:opacity-100 md:group-hover:bg-yellow-400/15" />

                  {/* Icon */}
                  <BenefitIcon icon={Icon} />

                  {/* Title — yellow */}
                  <h3 className="mt-3 text-base font-bold text-yellow-400 md:text-lg">
                    {card.title}
                  </h3>

                  {/* Subtitle — white */}
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {card.subtitle}
                  </p>

                  {/* Description */}
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
