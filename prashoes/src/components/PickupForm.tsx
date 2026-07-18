"use client";

import { useState, useEffect } from "react";
import { serviceOptions as fallbackOptions } from "@/lib/placeholder";
import { createPickupRequest, fetchServiceOptions } from "@/lib/supabase-service";

export default function PickupForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>(fallbackOptions);
  const [form, setForm] = useState({
    fullName: "",
    whatsappNumber: "",
    pickupAddress: "",
    shoeQuantity: 1,
    serviceType: fallbackOptions[0],
  });

  useEffect(() => {
    fetchServiceOptions().then(setOptions);
  }, []);

  useEffect(() => {
    // Sync serviceType if options change and current selection is out of range
    if (!options.includes(form.serviceType) && options.length > 0) {
      setForm((prev) => ({ ...prev, serviceType: options[0] }));
    }
  }, [options, form.serviceType]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createPickupRequest(form);
      if (result.success) {
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
                placeholder="Contoh: 08123456789"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
              />
            </div>

            <div>
              <label
                htmlFor="pickupAddress"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Alamat Penjemputan
              </label>
              <input
                id="pickupAddress"
                name="pickupAddress"
                type="text"
                required
                value={form.pickupAddress}
                onChange={handleChange}
                placeholder="Alamat lengkap penjemputan"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
              />
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
                  value={form.serviceType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
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