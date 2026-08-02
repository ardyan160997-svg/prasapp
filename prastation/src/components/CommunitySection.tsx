"use client";

import Link from "next/link";

export function CommunitySection() {
  const benefits = [
    {
      icon: "Shield",
      title: "Konsol Original & Terawat",
      desc: "Semua konsol PS5 & PS4 asli Sony, dibersihkan & dicek sebelum disewakan. Tidak ada konsol replika atau rusak.",
    },
    {
      icon: "Gamepad",
      title: "Game Library Lengkap",
      desc: "Ratusan judul game PS5 & PS4 terbaru dan klasik. Pilih game favorit saat order, kami siapkan dalam paket.",
    },
    {
      icon: "Truck",
      title: "Antar & Ambil Gratis Area Tertentu",
      desc: "Gratis ongkir antar-ambil untuk area Jakarta Pusat/Selatan/Barat/Utara. Area lain bisa nego via WhatsApp.",
    },
    {
      icon: "Star",
      title: "Harga Transparan Tanpa Biaya Tersembunyi",
      desc: "Harga sudah include konsol, stik, kabel, dan game yang dipilih. Tidak ada biaya tambahan tak terduga.",
    },
  ];

  const icons: Record<string, React.ReactNode> = {
    Shield: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Gamepad: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10l1.5 3a2 2 0 01-1.79 2.89h-1.21a2 2 0 01-1.8-1.11L13 15h-2l-.7 1.78A2 2 0 018.5 18h-1.2A2 2 0 015.5 15l1.5-3zM9 10h.01M15 10h.01M12 8V6" />
      </svg>
    ),
    Truck: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    Star: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  };

  return (
    <section id="komunitas" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Kenapa <span className="text-yellow-400">Sewa di Prastation</span>
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Rental PlayStation paling terpercaya dengan layanan lengkap dan harga jujur.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:border-yellow-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-yellow-400/10">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400 transition-all duration-300 group-hover:bg-yellow-400/25 group-hover:text-yellow-300 group-hover:scale-110">
                {icons[benefit.icon]}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{benefit.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{benefit.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="#booking" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15">
            Mulai Sewa Sekarang
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}