export const metadata = {
  title: "Admin | Prashoes",
  description: "Dashboard admin Prashoes sudah dipindahkan ke adminprashoes.prasapp.com.",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-yellow-400/20 bg-white/[0.04] p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300">
          Admin Prashoes
        </p>
        <h1 className="mt-4 text-3xl font-bold">Dashboard admin sudah pindah</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Kelola order, tracking, member, pickup, dan catatan keuangan dari dashboard VPS.
        </p>
        <a
          href="https://adminprashoes.prasapp.com"
          className="mt-6 inline-flex rounded-xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-yellow-300"
        >
          Buka Admin VPS
        </a>
      </div>
    </main>
  );
}
