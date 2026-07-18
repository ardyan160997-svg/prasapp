import Image from "next/image";
import Link from "next/link";

// Server component — no client-side interactivity needed
// Future: add mobile menu toggle with "use client" if needed
const navLinks = [
  { label: "Lacak", href: "#lacak" },
  { label: "Harga", href: "#harga" },
  { label: "Promo", href: "#promo" },
  { label: "Antar Jemput", href: "#antar-jemput" },
  { label: "Hasil", href: "#hasil" },
  { label: "Kontak", href: "#kontak" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="relative block h-10 w-[150px] shrink-0 overflow-hidden md:h-12 md:w-[180px]"
          aria-label="Kembali ke beranda Prashoes"
        >
          <Image
            src="/images/logo:iconnav.avif"
            alt="Prashoes"
            fill
            sizes="(min-width: 768px) 180px, 150px"
            className="object-contain object-left"
            priority
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-yellow-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="#antar-jemput"
          className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-300"
        >
          Pesan Sekarang
        </a>
      </div>
    </header>
  );
}