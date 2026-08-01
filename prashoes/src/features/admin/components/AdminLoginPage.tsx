"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

type AdminLoginPageProps = {
  isConfigured: boolean;
};

export default function AdminLoginPage({ isConfigured }: AdminLoginPageProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.error || "Login gagal.");
        return;
      }

      setPassword("");
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_28%),linear-gradient(180deg,_#111827_0%,_#020617_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/images/logo:iconnav.avif"
              alt="Prashoes"
              width={88}
              height={88}
              className="mb-4 h-22 w-22 object-contain"
              priority
            />
            <h1 className="text-3xl font-bold tracking-tight text-white">Login admin</h1>
          </div>

          {!isConfigured ? (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-relaxed text-red-100">
              `ADMIN_USERNAMES` (atau `ADMIN_USERNAME`), `ADMIN_PASSWORD`, atau
              `ADMIN_AUTH_SECRET` belum diisi
              di `.env.local`.
            </div>
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-200">Username</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                disabled={!isConfigured || isPending}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-yellow-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={!isConfigured || isPending}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-yellow-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={!isConfigured || isPending}
              className="w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Memproses..." : "Login Admin"}
            </button>

            {message ? <p className="text-sm text-red-300">{message}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
