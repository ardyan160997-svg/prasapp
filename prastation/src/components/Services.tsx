"use client";

export function Services() {
  const services = [
    {
      name: "Booking Studio",
      price: "Mulai Rp75.000/jam",
      desc: "Ruang foto, video, podcast, rehearsal dengan acoustic treatment standar.",
      icon: "Studio",
    },
    {
      name: "Rental Equipment",
      price: "Mulai Rp50.000/hari",
      desc: "Kamera, lighting, audio, rigging, grip equipment lengkap & terawat.",
      icon: "Camera",
    },
    {
      name: "Event Space",
      price: "Mulai Rp500.000/event",
      desc: "Ruang event komunitas, workshop, talkshow, launching hingga 100 orang.",
      icon: "Users",
    },
    {
      name: "Paket Produksi",
      price: "Mulai Rp1.500.000",
      desc: "End-to-end: pre-prod, shooting, editing, grading, deliverable siap publish.",
      icon: "Clapperboard",
    },
    {
      name: "Membership Creator",
      price: "Rp299.000/bulan",
      desc: "Diskon 20% semua booking, prioritas jadwal, akses community event, konsultasi gratis.",
      icon: "Crown",
    },
    {
      name: "Konsultasi Gratis",
      price: "Free 30 menit",
      desc: "Diskusi kebutuhan proyek, rekomendasi studio/equipment, estimasi budget.",
      icon: "MessageCircle",
    },
  ];

  return (
    <section id="layanan" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Layanan <span className="text-yellow-400">Prastation</span>
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Pilih layanan yang sesuai kebutuhan kreatif kamu. Semua transparan, bisa dibandingkan, dan siap booking.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc, i) => (
            <ServiceCard key={i} {...svc} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ name, price, desc, icon }: { name: string; price: string; desc: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    Studio: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    Camera: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197M21 16.65V4.35a1.5 1.5 0 00-1.5-1.5H6.35a1.5 1.5 0 00-1.5 1.5V15.3M21 21l-5.197-5.197m0 0A12.061 12.061 0 016.35 4.35m0 0c.312-.324.669-.622 1.053-.895a2.251 2.251 0 012.282 0c.385.273.742.57 1.053.895M6.35 15.3H21M6.35 4.35H21" />
      </svg>
    ),
    Users: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    Clapperboard: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    Crown: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    MessageCircle: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:border-yellow-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-yellow-400/10 active:scale-[0.98]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-400/8 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-400 transition-all duration-300 group-hover:bg-yellow-400/25 group-hover:text-yellow-300 group-hover:scale-110">
        {icons[icon]}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-white">{name}</h3>
      <p className="mb-3 text-sm font-medium text-yellow-400">{price}</p>
      <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
    </div>
  );
}