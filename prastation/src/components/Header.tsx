"use client";

import Link from "next/link";

export function Header() {
  const navLinks = [
    { href: "#layanan", label: "Layanan" },
    { href: "#booking", label: "Booking" },
    { href: "#studio", label: "Studio" },
    { href: "#event", label: "Event" },
    { href: "#equipment", label: "Equipment" },
    { href: "#komunitas", label: "Komunitas" },
    { href: "#kontak", label: "Kontak" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="relative block h-10 w-[150px] shrink-0 overflow-hidden md:h-12 md:w-[180px]" aria-label="Kembali ke beranda Prastation">
          <span className="text-2xl font-bold text-yellow-400">Prastation</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-yellow-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="#booking"
          className="rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-300"
        >
          Booking Sekarang
        </Link>
      </div>
    </header>
  );
}