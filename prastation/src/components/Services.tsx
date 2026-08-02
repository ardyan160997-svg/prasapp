"use client";

export function Services() {
  const services = [
    {
      name: "Sewa PS5",
      price: "Mulai Rp150.000/hari",
      desc: "Paket PlayStation 5 dengan controller original. Cocok untuk main FIFA, eFootball, GTA V, dan game terbaru.",
      icon: "Console",
    },
    {
      name: "Sewa PS4",
      price: "Mulai Rp100.000/hari",
      desc: "Paket PlayStation 4 hemat untuk harian atau mingguan. Cocok untuk keluarga, kos, dan tongkrongan.",
      icon: "Controller",
    },
    {
      name: "Tambah Controller",
      price: "Mulai Rp25.000/hari",
      desc: "Tambahan stik original untuk main bareng teman. Tersedia opsi 2 sampai 4 player.",
      icon: "Users",
    },
    {
      name: "Paket Game Favorit",
      price: "Mulai Rp20.000/hari",
      desc: "Pilihan game populer seperti FIFA, eFootball, GTA V, Tekken, Mortal Kombat, dan game keluarga.",
      icon: "Game",
    },
    {
      name: "Sewa Mingguan",
      price: "Harga lebih hemat",
      desc: "Paket sewa 7 hari untuk rumah, apartemen, acara kecil, atau liburan sekolah dengan harga lebih murah.",
      icon: "Calendar",
    },
    {
      name: "Sewa Full Set",
      price: "Siap main",
      desc: "Konsol, stik, kabel, dan game dalam satu paket. Tinggal colok ke TV dan langsung main.",
      icon: "Package",
    },
  ];

  return (
    <section id="layanan" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Paket <span className="text-yellow-400">Sewa Prastation</span>
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Pilih paket rental PlayStation sesuai kebutuhan. Cocok untuk harian, mingguan, mabar, dan hiburan di rumah.
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
    Console: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M9 16h6M7 7h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
      </svg>
    ),
    Controller: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10l1.5 3a2 2 0 01-1.79 2.89h-1.21a2 2 0 01-1.8-1.11L13 15h-2l-.7 1.78A2 2 0 018.5 18h-1.2A2 2 0 015.5 15l1.5-3zM9 10h.01M15 10h.01M12 8V6" />
      </svg>
    ),
    Users: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    Game: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12m0 0l-2.25 2.25M16.5 12h-6m-3-2.25h.008v.008H7.5V9.75zm0 4.5h.008v.008H7.5v-.008z" />
      </svg>
    ),
    Calendar: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    Package: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m16 0l-8-4-8 4m16 0v10l-8 4m-8-14v10l8 4" />
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
