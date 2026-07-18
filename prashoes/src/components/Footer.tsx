import Image from "next/image";

// Server component
// Future: dynamic nav links from a config or CMS
const navLinks = [
  { label: "Lacak", href: "#lacak" },
  { label: "Harga", href: "#harga" },
  { label: "Promo", href: "#promo" },
  { label: "Antar Jemput", href: "#antar-jemput" },
  { label: "Hasil", href: "#hasil" },
];

export default function Footer() {
  return (
    <footer id="kontak" className="w-full border-t border-white/10 bg-zinc-950 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="relative mb-3 h-10 w-[150px] overflow-hidden md:h-12 md:w-[180px]">
              <Image
                src="/images/logo:iconnav.avif"
                alt="Prashoes"
                fill
                sizes="(min-width: 768px) 180px, 150px"
                className="object-contain object-left"
              />
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">
              Layanan cuci sepatu premium terpercaya. Kami merawat sepatu
              kamu dengan teliti dan profesional.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Navigasi
            </h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-zinc-500 transition-colors hover:text-yellow-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Kontak
            </h3>
            <p className="mb-3 text-sm text-zinc-500">
              Hubungi kami via WhatsApp atau kunjungi lokasi langsung.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Prashoes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-300"
            >
              Buka Lokasi di Google Maps
            </a>
          </div>

          {/* Hours */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Jam Operasional
            </h3>
            <p className="text-sm text-zinc-500">
              Senin — Sabtu
            </p>
            <p className="text-sm text-zinc-500">
              09.00 — 18.00 WIB
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Minggu & Hari Libur Tutup
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Prashoes. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  );
}