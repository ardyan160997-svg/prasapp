"use client";

import Link from "next/link";

export function EquipmentShowcase() {
  const equipment = [
    {
      name: "Kamera",
      items: [
        { name: "Sony A7IV + 24-70mm f/2.8", price: "Rp800.000/hari", spec: "Full-frame 33MP, 4K 60p" },
        { name: "DJI Ronin 4D", price: "Rp1.500.000/hari", spec: "6K/8K, 4-axis gimbal, built-in monitor" },
      ],
    },
    {
      name: "Lighting",
      items: [
        { name: "Aputure LS 600d Pro", price: "Rp400.000/hari", spec: "600W, 2700-6500K, CRI 96+" },
        { name: "Aputure Light Dome II", price: "Rp150.000/hari", spec: "Softbox octa 85cm, grid included" },
        { name: "Aputure Amaran 200x", price: "Rp200.000/hari", spec: "200W bicolor, Bowens mount" },
      ],
    },
    {
      name: "Audio",
      items: [
        { name: "Shure SM7B + Cloudlifter", price: "Rp200.000/hari", spec: "Dynamic broadcast mic, +25dB gain" },
        { name: "Rode NT1 5th Gen", price: "Rp150.000/hari", spec: "Condenser, 32-bit float, USB-C + XLR" },
        { name: "DJI Mic 2 (2 TX + 1 RX)", price: "Rp250.000/hari", spec: "Wireless lavalier, 32-bit float, 250m range" },
      ],
    },
    {
      name: "Rigging & Support",
      items: [
        { name: "C-Stand 40\" (Avenger)", price: "Rp75.000/hari", spec: "Heavy duty, turtle base, gobo arm" },
        { name: "Manfrotto 190XPRO Tripod", price: "Rp100.000/hari", spec: "Aluminum, 90° column, Q90 head" },
        { name: "Dana Dolly + Track", price: "Rp300.000/hari", spec: "Portable slider, 6ft track, Mitchell base" },
      ],
    },
  ];

  return (
    <section id="equipment" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Equipment <span className="text-yellow-400">Rental</span>
          </h2>
          <p className="text-sm text-zinc-400 md:text-base">
            Sewa equipment professional per hari. Lengkap, terawat, siap pakai.
          </p>
        </div>

        <div className="space-y-16">
          {equipment.map((category, catIdx) => (
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
            <Link href="/equipment" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15">
              Lihat Semua Equipment & Spesifikasi
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