const cards = [
  {
    title: "QR Member",
    description: "Area ini disiapkan untuk QR permanen yang aman dan mudah dipindai kasir.",
  },
  {
    title: "Riwayat Sewa",
    description: "Struktur halaman siap menampung transaksi bermain dan rental bawa pulang.",
  },
  {
    title: "Voucher & Promo",
    description: "Tempat menampilkan promo yang relevan untuk member aktif di cabang.",
  },
];

export default function MemberPortalPage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10">
      <section className="mx-auto grid max-w-6xl gap-8">
        <header className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Portal Member
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Kerangka member area sudah siap untuk QR, riwayat, dan promo.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[color:rgba(29,20,8,0.72)]">
            Pada fase berikutnya halaman ini akan dihubungkan ke autentikasi member,
            QR token aman, dan daftar transaksi per cabang.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[24px] border border-[var(--line)] bg-white/70 p-6"
            >
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[color:rgba(29,20,8,0.72)]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
