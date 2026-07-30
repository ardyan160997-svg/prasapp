"use client";

import { useState, useEffect } from "react";
import {
  calculatePickupPricing,
  createPickupRequest,
  fetchServiceOptions,
} from "@/features/main/services/public-site-data";

export default function PickupForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [requestCode, setRequestCode] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    whatsappNumber: "",
    email: "",
    pickupAddress: "",
    pickupLatitude: null as number | null,
    pickupLongitude: null as number | null,
    pickupShareUrl: "",
    shoeQuantity: 1,
    serviceType: "",
    isMember: false,
    memberCode: "",
    notes: "",
  });

  useEffect(() => {
    fetchServiceOptions().then((data) => {
      setOptions(data);
      setForm((current) => ({
        ...current,
        serviceType: current.serviceType || data[0] || "",
      }));
    });
  }, []);

  const normalizedServiceType = options.includes(form.serviceType)
    ? form.serviceType
    : (options[0] ?? "");
  const pricing = calculatePickupPricing({
    ...form,
    serviceType: normalizedServiceType,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setForm((current) => ({
      ...current,
      [name]:
        type === "number"
          ? Number(value)
          : type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value,
    }));
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Browser ini belum mendukung GPS perangkat.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage("");
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
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setLocationMessage("Izin lokasi ditolak. Lanjutkan dengan alamat manual.");
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!normalizedServiceType) {
      alert("Belum ada layanan di database.");
      return;
    }
    setLoading(true);
    try {
      const result = await createPickupRequest(form);
      if (result.success) {
        setRequestCode(result.requestCode ?? "");
        setSubmitted(true);
      } else {
        alert("Gagal mengirim permintaan. Silakan coba lagi.");
      }
    } catch {
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <section id="antar-jemput" className="w-full py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-yellow-400/20 bg-yellow-400/[0.06] p-8 text-center backdrop-blur-sm sm:p-12">
            <div className="mb-4 text-4xl">✅</div>
            <h2 className="mb-2 text-2xl font-bold text-white">Berhasil!</h2>
            <p className="text-sm text-zinc-300">
              Permintaan berhasil dibuat. Admin Prashoes akan segera
              menghubungi kamu.
            </p>
            {requestCode ? (
              <p className="mt-4 text-sm text-emerald-300">
                Kode permintaan: <span className="font-mono font-semibold">{requestCode}</span>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-zinc-400">
              Untuk non-member, nomor order final masih akan dikirim lewat WhatsApp saat
              pesanan diproses admin.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="antar-jemput" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm sm:p-12">
          <h2 className="mb-2 text-center text-3xl font-bold text-white">
            Antar Jemput
          </h2>
          <p className="mb-8 text-center text-sm text-zinc-400">
            Isi form di bawah ini untuk menjadwalkan penjempatan sepatu kamu.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Status Customer
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-zinc-200">
                  <input
                    type="radio"
                    name="isMember"
                    checked={!form.isMember}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        isMember: false,
                        memberCode: "",
                      }))
                    }
                  />
                  Non-member
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-zinc-200">
                  <input
                    type="radio"
                    name="isMember"
                    checked={form.isMember}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        isMember: true,
                      }))
                    }
                  />
                  Member
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Nama Lengkap
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>

            <div>
              <label
                htmlFor="whatsappNumber"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Nomor WhatsApp
              </label>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                required
                value={form.whatsappNumber}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Email (Opsional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>

            {form.isMember ? (
              <div>
                <label
                  htmlFor="memberCode"
                  className="mb-1 block text-sm font-medium text-zinc-300"
                >
                  Kode Member
                </label>
                <input
                  id="memberCode"
                  name="memberCode"
                  type="text"
                  value={form.memberCode}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                />
              </div>
            ) : null}

            <div>
              <label
                htmlFor="pickupAddress"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Alamat Penjemputan
              </label>
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locationLoading}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-yellow-400/50 hover:text-yellow-300 disabled:opacity-60"
                >
                  {locationLoading ? "Mengambil lokasi..." : "Pakai Lokasi Saya"}
                </button>
              </div>
              <textarea
                id="pickupAddress"
                name="pickupAddress"
                required
                value={form.pickupAddress}
                onChange={handleChange}
                placeholder="Alamat lengkap penjemputan"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
              />
              {form.pickupShareUrl ? (
                <p className="mt-2 text-xs text-emerald-300">
                  Share location siap: {form.pickupShareUrl}
                </p>
              ) : null}
              {locationMessage ? (
                <p className="mt-2 text-xs text-zinc-400">{locationMessage}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="shoeQuantity"
                  className="mb-1 block text-sm font-medium text-zinc-300"
                >
                  Jumlah Sepatu
                </label>
                <input
                  id="shoeQuantity"
                  name="shoeQuantity"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={form.shoeQuantity}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                />
              </div>
              <div>
                <label
                  htmlFor="serviceType"
                  className="mb-1 block text-sm font-medium text-zinc-300"
                >
                  Jenis Layanan
                </label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={normalizedServiceType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                >
                  {options.length > 0 ? (
                    options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))
                  ) : (
                    <option value="">Belum ada layanan</option>
                  )}
                </select>
              </div>
            </div>

            {options.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Belum ada layanan di database. Tambahkan data layanan terlebih dahulu.
              </p>
            ) : null}

            <div>
              <label
                htmlFor="notes"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Catatan Tambahan
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Contoh: minta pickup sore, patokan rumah, atau detail sepatu"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.06] p-4 text-sm text-zinc-200">
              <p className="font-semibold text-yellow-300">Ringkasan Benefit & Ongkir</p>
              <div className="mt-3 grid gap-2 text-sm">
                <p>Promo: {pricing.promoLabel}</p>
                <p>Diskon estimasi: Rp{pricing.discountAmount.toLocaleString("id-ID")}</p>
                <p>Ongkir: Rp{pricing.deliveryFee.toLocaleString("id-ID")}</p>
                <p>Total estimasi: {pricing.estimatedTotalLabel}</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                Member baru mendapat diskon 10%. Member gratis ongkir minimal 2 pair.
                Non-member dikenakan ongkir Rp5.000. Program loyalti: gratis 1x cuci
                setelah 10x Deep Clean.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim Permintaan Jemput"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
