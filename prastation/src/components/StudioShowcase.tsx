"use client";

import Link from "next/link";

export function StudioShowcase() {
  const studios = [
    {
      name: "Studio A - Recording",
      slug: "studio-a-recording",
      price: "Rp500.000/jam",
      capacity: 6,
      image: "/images/studio-a-1.jpg",
      amenities: ["Vocal Booth", "Control Room", "Monitors", "Mic Collection"],
    },
    {
      name: "Studio B - Rehearsal",
      slug: "studio-b-rehearsal",
      price: "Rp150.000/jam",
      capacity: 8,
      image: "/images/studio-b-1.jpg",
      amenities: ["Drum Set", "Guitar Amps", "Bass Amp", "PA System"],
    },
    {
      name: "Event Hall",
      slug: "event-hall",
      price: "Rp2.000.000/event",
      capacity: 80,
      image: "/images/event-hall-1.jpg",
      amenities: ["Projector", "Sound System", "Stage Lighting", "AC"],
    },
    {
      name: "Photo Studio",
      slug: "photo-studio",
      price: "Rp400.000/jam",
      capacity: 10,
      image: "/images/photo-studio-1.jpg",
      amenities: ["Cyclorama", "Strobe Lights", "Modifiers", "Makeup Area"],
    },
  ];

  return (
    <section id="studio" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            <span className="text-yellow-400">Studio</span> & Ruang
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Pilih studio yang cocok untuk proyek kamu. Semua studio siap pakai dengan equipment standar industri.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {studios.map((studio, i) => (
            <Link key={i} href={`/studio/${studio.slug}`} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-yellow-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-yellow-400/10 active:scale-[0.98]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative aspect-video overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-20 w-28 rounded-xl bg-zinc-600/80" />
                    <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Gambar {studio.name}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{studio.name}</h3>
                  <span className="rounded-full bg-yellow-400/20 px-2.5 py-1 text-xs font-bold text-yellow-400">{studio.price}</span>
                </div>
                <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <span>Kapasitas {studio.capacity} orang</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {studio.amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400 border border-white/10">
                      {amenity}
                    </span>
                  ))}
                  {studio.amenities.length > 3 && (
                    <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-400/30">
                      +{studio.amenities.length - 3} lagi
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/studio" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15">
            Lihat Semua Studio & Ruang
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}