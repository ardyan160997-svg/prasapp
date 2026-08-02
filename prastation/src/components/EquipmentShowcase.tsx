"use client";

import Link from "next/link";

export function EquipmentShowcase() {
  const gameCategories = [
    {
      name: "Game Olahraga & Balap",
      items: [
        { name: "EA FC 25 / FIFA", price: "Rp20.000/hari", spec: "Karir, Ultimate Team, Pro Clubs" },
        { name: "eFootball 2025", price: "Rp20.000/hari", spec: "Master League, Online, Free to Play" },
        { name: "F1 24", price: "Rp25.000/hari", spec: "Karir, My Team, Multiplayer" },
        { name: "NBA 2K25", price: "Rp25.000/hari", spec: "MyCareer, MyTeam, The City" },
      ],
    },
    {
      name: "Game Aksi & Petualangan",
      items: [
        { name: "GTA V Premium", price: "Rp20.000/hari", spec: "Story Mode, GTA Online, Heist" },
        { name: "Spider-Man 2", price: "Rp30.000/hari", spec: "Peter & Miles, New York Terbuka" },
        { name: "God of War Ragnarök", price: "Rp30.000/hari", spec: "Story Epik, Ng+ Challenge" },
        { name: "Horizon Forbidden West", price: "Rp25.000/hari", spec: "Dunia Terbuka, Cerita Lengkap" },
      ],
    },
    {
      name: "Game Fighting & Party",
      items: [
        { name: "Tekken 8", price: "Rp25.000/hari", spec: "Arcade Quest, Ranked, Practice" },
        { name: "Mortal Kombat 1", price: "Rp25.000/hari", spec: "Story, Invasion, Towers" },
        { name: "Street Fighter 6", price: "Rp25.000/hari", spec: "World Tour, Battle Hub, Fighting Ground" },
        { name: "Overcooked! All You Can Eat", price: "Rp20.000/hari", spec: "Koop 4 Pemain, Asik Keluarga" },
      ],
    },
    {
      name: "Game RPG & Keluarga",
      items: [
        { name: "Final Fantasy VII Rebirth", price: "Rp30.000/hari", spec: "Dunia Terbuka, Cerita Lanjutan" },
        { name: "Persona 5 Royal", price: "Rp25.000/hari", spec: "JRPG Terbaik, 100+ Jam" },
        { name: "Minecraft", price: "Rp20.000/hari", spec: "Creative, Survival, Split Screen" },
        { name: "It Takes Two", price: "Rp25.000/hari", spec: "Koop Wajib 2 Pemain, Award Winner" },
      ],
    },
  ];

  return (
    <section id="equipment" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Game Library <span className="text-yellow-400">Prastation</span>
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Ribuan game PS5 & PS4 siap main. Cukup pilih game favorit saat order paket sewa.
          </p>
        </div>

        <div className="space-y-16">
          {gameCategories.map((category, catIdx) => (
            <div key={catIdx}>
              <h3 className="mb-6 flex items-center gap-3 text-lg font-semibold text-white">
                <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-400 uppercase tracking-wide">
                  {category.name}
                </span>
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:border-yellow-400/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-yellow-400/10">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-base font-semibold text-white">{item.name}</h4>
                      <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-black">{item.price}</span>
                    </div>
                    <p className="text-sm text-zinc-400">{item.spec}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-8 text-center">
            <Link href="/game-library" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15">
              Lihat Semua Game Library
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}