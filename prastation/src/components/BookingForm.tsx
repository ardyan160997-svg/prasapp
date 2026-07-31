"use client";

import { useState } from "react";

export function BookingForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    bookingDate: "",
    serviceType: "Recording Studio",
    notes: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    setTimeout(() => {
      if (!form.fullName || !form.email || !form.phone || !form.bookingDate) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setForm({
        fullName: "",
        email: "",
        phone: "",
        bookingDate: "",
        serviceType: "Recording Studio",
        notes: "",
      });
    }, 1000);
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <section id="booking" className="w-full py-20 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm sm:p-12">
          <h2 className="mb-2 text-center text-3xl font-bold text-white">Booking Prastation</h2>
          <p className="mb-8 text-center text-sm text-zinc-400">
            Isi form di bawah ini untuk mengecek ketersediaan studio, equipment, atau event space.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-zinc-300">Nama Lengkap</label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-300">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-zinc-300">Nomor WhatsApp</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="08123456789"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bookingDate" className="mb-1 block text-sm font-medium text-zinc-300">Tanggal Booking</label>
                <input
                  id="bookingDate"
                  type="date"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                  value={form.bookingDate}
                  onChange={(e) => updateField("bookingDate", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="serviceType" className="mb-1 block text-sm font-medium text-zinc-300">Jenis Layanan</label>
                <select
                  id="serviceType"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                  value={form.serviceType}
                  onChange={(e) => updateField("serviceType", e.target.value)}
                >
                  <option value="Recording Studio">Recording Studio</option>
                  <option value="Photo Studio">Photo Studio</option>
                  <option value="Rehearsal Room">Rehearsal Room</option>
                  <option value="Event Space">Event Space</option>
                  <option value="Equipment Rental">Equipment Rental</option>
                  <option value="Paket Produksi">Paket Produksi</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-zinc-300">Catatan Tambahan</label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Jelaskan kebutuhan proyek, jumlah orang, jam estimasi, equipment khusus, dsb."
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400">Lengkapi semua field wajib terlebih dahulu.</p>
            )}
            {status === "success" && (
              <p className="text-sm text-green-400">Request booking terkirim. Tim Prastation akan menghubungi kamu segera.</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "Mengirim..." : "Kirim Request Booking"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}