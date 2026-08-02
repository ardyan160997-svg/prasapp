"use client";

import Link from "next/link";

export function Footer() {
  const navLinks = [
    { href: "#layanan", label: "Paket Sewa" },
    { href: "#booking", label: "Sewa Sekarang" },
    { href: "#studio", label: "Paket Populer" },
    { href: "#event", label: "Promo" },
    { href: "#equipment", label: "Game Library" },
    { href: "#komunitas", label: "Keunggulan" },
    { href: "#kontak", label: "Kontak" },
  ];

  const socialLinks = [
    { href: "https://instagram.com/prastation", label: "Instagram", icon: "Instagram" },
    { href: "https://tiktok.com/@prastation", label: "TikTok", icon: "TikTok" },
    { href: "https://youtube.com/@prastation", label: "YouTube", icon: "YouTube" },
    { href: "https://wa.me/6281234567890", label: "WhatsApp", icon: "WhatsApp" },
  ];

  return (
    <footer id="kontak" className="w-full border-t border-white/10 bg-zinc-950 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="relative mb-3 block h-10 w-[150px] overflow-hidden md:h-12 md:w-[180px]">
              <span className="text-2xl font-bold text-yellow-400">Prastation</span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-400">
              Rental PlayStation terpercaya untuk sewa PS5, PS4, controller, dan game favorit. Cocok untuk hiburan rumah, mabar, liburan, dan hadiah akhir pekan.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Navigasi</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 transition-colors hover:text-yellow-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Kontak</h3>
            <p className="mb-3 text-sm text-zinc-500">Hubungi kami via WhatsApp untuk tanya stok, harga, atau request antar-ambil.</p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-300"
            >
              Chat WhatsApp
            </a>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Jam Operasional</h3>
            <p className="text-sm text-zinc-500">Senin — Minggu</p>
            <p className="text-sm text-zinc-500">09.00 — 22.00 WIB</p>
            <p className="mt-2 text-sm text-zinc-500">Order malam tetap bisa masuk. Konfirmasi pengantaran menyesuaikan jadwal admin.</p>

            <h3 className="mt-6 mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Sosial Media</h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-all duration-300 hover:bg-yellow-400/20 hover:text-yellow-400"
                  aria-label={social.label}
                >
                  {social.icon === "Instagram" && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  )}
                  {social.icon === "TikTok" && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.545 9.375c-2.785 0-5.037 2.27-5.037 5.063 0 2.806 2.265 5.076 5.049 5.076 1.143 0 2.185-.383 3.026-1.027.468-.357.996-.65 1.577-.87.266-.1 1.832-.708 2.374-.683.287.012.578.019.866.019 1.701 0 3.077-1.389 3.077-3.098 0-1.698-1.387-3.086-3.089-3.086-1.209 0-2.238.725-2.66 1.758-.228.564-.596 1.033-1.053 1.365-.085.06-.182.123-.281.179.254-.116.476-.26.67-.426.025.072.053.143.083.215a4.036 4.036 0 0 0-4.76 1.578c.63-.503 1.109-1.156 1.423-1.886.054-.126.09-.257.12-.394-.409-.532-1.06-.939-1.824-1.192-.37-.123-.75-.223-1.13-.298v-.01z" />
                    </svg>
                  )}
                  {social.icon === "YouTube" && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  )}
                  {social.icon === "WhatsApp" && (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.52 3.48A11.86 11.86 0 0012.07 0C5.55 0 .25 5.3.25 11.82c0 2.08.54 4.1 1.57 5.87L0 24l6.5-1.7a11.8 11.8 0 005.57 1.42h.01c6.52 0 11.82-5.3 11.82-11.82 0-3.16-1.23-6.13-3.48-8.42zM12.08 21.7h-.01a9.84 9.84 0 01-5.02-1.37l-.36-.21-3.86 1.01 1.03-3.76-.24-.39a9.8 9.8 0 01-1.5-5.17c0-5.41 4.4-9.81 9.82-9.81 2.62 0 5.08 1.02 6.92 2.88a9.72 9.72 0 012.88 6.93c0 5.41-4.41 9.81-9.82 9.81zm5.39-7.36c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.37-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.23-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.5 1.71.64.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-zinc-600">
          © 2025 Prastation. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  );
}