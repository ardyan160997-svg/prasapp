const highlights = [
  "Billing station real-time berbasis waktu server",
  "Member QR permanen untuk check-in lebih cepat",
  "Siap mendukung rental bawa pulang dan inventaris",
];

const roadmap = [
  "Dashboard billing kasir",
  "Portal member dengan QR dan riwayat transaksi",
  "Master station, pricing, promo, dan laporan harian",
];

export default function PublicLandingPage() {
  return (
    <main className="px-6 py-8 sm:px-10 lg:px-16">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-between gap-8 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[0_24px_80px_rgba(71,43,18,0.08)] backdrop-blur md:p-12">
        <div className="animate-rise-in flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-dark)]">
              PraStation MVP
            </p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Fondasi sistem operasional rental PlayStation yang cepat dipakai kasir.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:rgba(29,20,8,0.72)] sm:text-lg">
                Fase pertama sudah menyiapkan shell aplikasi untuk website publik,
                portal member, dan admin billing. Struktur ini siap dilanjutkan ke
                master data, sesi bermain, pricing, dan laporan.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/admin"
                className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)]"
              >
                Buka Portal Admin
              </a>
              <a
                href="/member"
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand-dark)]"
              >
                Lihat Portal Member
              </a>
            </div>
          </div>

          <div className="grid w-full max-w-xl gap-4 rounded-[28px] bg-[var(--surface-strong)] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Fokus Sprint Awal
            </p>
            <div className="grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-sm leading-6 text-[color:rgba(29,20,8,0.78)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-t border-[var(--line)] pt-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-dark)]">
              Cakupan Fondasi
            </p>
            <ul className="grid gap-3 text-sm leading-6 text-[color:rgba(29,20,8,0.74)]">
              {roadmap.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[var(--line)] bg-white/65 px-4 py-4"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[#20140b] p-6 text-[#f8efe0]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f0bb8d]">
              Surface Siap Dikembangkan
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-[#e8d9c7]">
              <p>`/` untuk website publik dan pricing info.</p>
              <p>`/member` untuk QR member, riwayat, dan profil.</p>
              <p>`/admin` untuk login kasir/admin dan dashboard billing.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
