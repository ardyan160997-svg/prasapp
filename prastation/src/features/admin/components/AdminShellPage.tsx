"use client";

import { useState } from "react";
import BillingDashboard from "@/features/billing/components/BillingDashboard";
import MasterDataManager from "@/features/admin/components/MasterDataManager";
import type { AdminSession } from "@/types/auth";

type AdminShellPageProps = {
  session: AdminSession | null;
};

const milestones = [
  "Auth admin/kasir berbasis cookie httpOnly",
  "Route public, member, dan admin aktif",
  "Endpoint health, login, dan logout siap",
];

export default function AdminShellPage({ session }: AdminShellPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-[var(--line)] bg-[#1f140d] p-8 text-[#f7ead8] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f0bb8d]">
              Admin / Kasir
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Portal operasional PraStation dimulai dari login yang ringan dan aman.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#dfcfbf] sm:text-base">
              Fase fondasi ini menyiapkan akses untuk kasir dan owner/admin. Setelah
              login, dashboard akan menjadi titik masuk billing station, member, dan
              transaksi harian.
            </p>
            <div className="mt-8 grid gap-3">
              {milestones.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-[#f4dfc7]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[0_20px_70px_rgba(71,43,18,0.08)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-dark)]">
              Login
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Masuk sebagai admin atau kasir
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:rgba(29,20,8,0.7)]">
              Gunakan akun yang terdaftar di environment. Role akan menentukan hak
              akses billing, station, pricing, dan laporan.
            </p>

            <form
              className="mt-8 grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                setLoading(true);

                const formData = new FormData(event.currentTarget);
                const payload = {
                  username: String(formData.get("username") ?? ""),
                  password: String(formData.get("password") ?? ""),
                };

                const response = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });

                if (!response.ok) {
                  const data = (await response.json().catch(() => null)) as
                    | { error?: string }
                    | null;
                  setError(data?.error ?? "Login gagal.");
                  setLoading(false);
                  return;
                }

                window.location.reload();
              }}
            >
              <label className="grid gap-2 text-sm font-medium">
                Username
                <input
                  required
                  name="username"
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  placeholder="owner atau kasir1"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Password
                <input
                  required
                  name="password"
                  type="password"
                  className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand)]"
                  placeholder="Password bersama"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Memproses..." : "Masuk ke portal"}
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 sm:px-10">
      <section className="mx-auto grid max-w-7xl gap-6">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-dark)]">
              Dashboard Billing
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Halo, {session.displayName}. Billing station PraStation sudah aktif.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:rgba(29,20,8,0.72)]">
              Role aktif Anda adalah <strong>{session.role}</strong>. Fase berikutnya
              akan melanjutkan aksi start session, add time, pindah unit, dan
              penyelesaian transaksi langsung dari dashboard ini.
            </p>
          </div>

          <form
            action="/api/auth/logout"
            method="post"
            onSubmit={() => {
              setLoading(true);
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand-dark)]"
            >
              {loading ? "Keluar..." : "Logout"}
            </button>
          </form>
        </header>
        <BillingDashboard session={session} />
        <MasterDataManager session={session} />
      </section>
    </main>
  );
}
