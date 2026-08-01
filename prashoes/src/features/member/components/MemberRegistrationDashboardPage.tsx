"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gift, MapPinned, Sparkles, Stars, TicketPercent, Truck } from "lucide-react";
import { createMemberRegistration, fetchMemberBenefits, fetchPromos } from "@/features/main/services/public-site-data";
import type { PromoItem } from "@/features/main/types";

const registrationSteps = [
  "Isi nama, nomor WhatsApp aktif, dan alamat pickup utama.",
  "Gunakan tombol lokasi untuk menyimpan titik pickup dari GPS perangkat.",
  "Simpan kode member untuk memantau progres sepatu dari halaman member.",
] as const;

export default function MemberRegistrationDashboardPage() {
  const [benefits, setBenefits] = useState<string[]>([]);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [message, setMessage] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    whatsappNumber: "",
    email: "",
    pickupAddress: "",
    pickupLatitude: null as number | null,
    pickupLongitude: null as number | null,
    pickupShareUrl: "",
  });

  useEffect(() => {
    fetchMemberBenefits().then((data) => {
      if (data.length > 0) setBenefits(data);
    });
    fetchPromos().then((data) => {
      if (data.length > 0) setPromos(data);
    });
  }, []);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setMessage("Browser ini belum mendukung GPS perangkat.");
      return;
    }

    setLoadingLocation(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setForm((current) => ({
          ...current,
          pickupLatitude: latitude,
          pickupLongitude: longitude,
          pickupShareUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
        }));
        setLoadingLocation(false);
      },
      () => {
        setLoadingLocation(false);
        setMessage("Izin lokasi ditolak. Kamu masih bisa isi alamat manual.");
      }
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingSubmit(true);
    setMessage("");
    setMemberCode("");

    const result = await createMemberRegistration(form);
    if (!result.success) {
      setMessage(result.error || "Pendaftaran member gagal.");
      setLoadingSubmit(false);
      return;
    }

    setMemberCode(result.memberCode || "");
    setMessage("Pendaftaran member berhasil. Simpan kode member kamu.");
    setForm({
      fullName: "",
      whatsappNumber: "",
      email: "",
      pickupAddress: "",
      pickupLatitude: null,
      pickupLongitude: null,
      pickupShareUrl: "",
    });
    setLoadingSubmit(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.14),_transparent_28%),linear-gradient(180deg,_rgba(9,9,11,0.98),_rgba(9,9,11,0.92))]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-yellow-400">
              Prashoes Member
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Daftar Member Baru
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Daftar member untuk dapat promo 10%, free ongkir minimal 2 pair, dan
              program gratis 1x cuci setelah 10x Deep Clean.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/member"
              className="inline-flex rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-yellow-400/60 hover:text-yellow-300"
            >
              Halaman Member
            </Link>
            <Link
              href="/#antar-jemput"
              className="inline-flex rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-300"
            >
              Booking Pickup
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_32%),linear-gradient(180deg,_rgba(24,24,27,0.95),_rgba(14,14,16,0.96))] p-6">
            <div className="pointer-events-none absolute -left-10 top-16 h-32 w-32 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="pointer-events-none absolute right-6 top-6 rounded-full border border-yellow-300/20 bg-yellow-400/10 p-3 text-yellow-200">
              <Stars className="h-5 w-5" />
            </div>
            <div className="pointer-events-none absolute bottom-6 left-6 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300">
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-yellow-300">
                <Sparkles className="h-3.5 w-3.5" />
                Hero Benefit
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Benefit Member</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-300">
                Member Prashoes bukan cuma dapat diskon. Benefit utama dibuat terasa
                jelas sejak awal: hemat, praktis, dan progres sepatu lebih mudah dipantau.
              </p>

              <div className="relative mt-6 overflow-hidden rounded-3xl border border-yellow-400/20 bg-black/20 p-5">
                <div className="animate-shimmer absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-yellow-300/10 to-transparent" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-yellow-400/15 p-3 text-yellow-300">
                        <TicketPercent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Promo Baru</p>
                        <p className="text-lg font-semibold text-white">Diskon 10%</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pickup Benefit</p>
                        <p className="text-lg font-semibold text-white">Free Ongkir 2 Pair</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {benefits.length > 0 ? (
                  benefits.map((benefit, index) => {
                    const Icon = [Gift, Sparkles, Truck, MapPinned][index] ?? Sparkles;
                    return (
                      <div
                        key={benefit}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400/30 hover:bg-zinc-900"
                      >
                        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yellow-300 via-yellow-500 to-transparent opacity-70" />
                        <div className="flex items-start gap-3 pl-2">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-yellow-300 transition-colors duration-300 group-hover:border-yellow-400/30 group-hover:bg-yellow-400/10">
                            <Icon className="h-4 w-4" />
                          </div>
                          <p className="text-sm leading-relaxed text-zinc-300">{benefit}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-4 py-4 text-sm text-zinc-500">
                    Belum ada benefit member di database.
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.06] p-5">
                <p className="text-sm font-semibold text-yellow-300">Alur Member</p>
                <div className="mt-3 space-y-3 text-sm text-zinc-300">
                  {registrationSteps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-400/10 text-xs font-bold text-yellow-300">
                        {index + 1}
                      </div>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 via-white/[0.03] to-transparent p-6 shadow-2xl shadow-black/20">
            <h2 className="text-2xl font-bold tracking-tight">Form Daftar Member</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Cukup isi data utama. Email opsional, dan alamat pickup bisa dibantu lewat
              GPS perangkat saat ini.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300" htmlFor="fullName">
                  Nama
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300" htmlFor="whatsappNumber">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  required
                  value={form.whatsappNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300" htmlFor="email">
                  Email (Opsional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-zinc-300" htmlFor="pickupAddress">
                    Alamat Pickup
                  </label>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    disabled={loadingLocation}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-yellow-400/50 hover:text-yellow-300 disabled:opacity-60"
                  >
                    {loadingLocation ? "Mengambil lokasi..." : "Pakai Lokasi Saya"}
                  </button>
                </div>
                <textarea
                  id="pickupAddress"
                  name="pickupAddress"
                  required
                  value={form.pickupAddress}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                />
                {form.pickupShareUrl ? (
                  <p className="mt-2 text-xs text-emerald-300">
                    Share location siap: {form.pickupShareUrl}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loadingSubmit}
                className="w-full rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black transition-colors hover:bg-yellow-300 disabled:opacity-60"
              >
                {loadingSubmit ? "Mendaftarkan..." : "Daftar Member"}
              </button>

              {message ? <p className="text-sm text-zinc-200">{message}</p> : null}
              {memberCode ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  <p className="font-semibold text-emerald-300">Kode Member</p>
                  <p className="mt-1 font-mono text-base">{memberCode}</p>
                  <p className="mt-2">
                    Simpan kode ini. Gunakan di halaman member untuk pantau progres sepatu.
                  </p>
                </div>
              ) : null}
            </form>
          </section>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">Promo Aktif</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {promos.length > 0 ? (
              promos.map((promo) => (
                <article
                  key={promo.id}
                  className="rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.06] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{promo.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                        {promo.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                      {promo.discountLabel}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-500 lg:col-span-2">
                Belum ada promo member di database.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
