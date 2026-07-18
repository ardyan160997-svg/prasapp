"use client";

import { useState } from "react";
import { fetchOrderTracking } from "@/lib/supabase-service";
import type { OrderTrackingResult } from "@/types";
import OrderItemBeforeAfter from "@/components/OrderItemBeforeAfter";

export default function TrackingSection() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<OrderTrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTrack() {
    setError(null);
    setResult(null);

    const trimmed = orderId.trim();
    if (!trimmed) {
      setError("Masukkan ID pesanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const tracking = await fetchOrderTracking(trimmed);
      if (tracking) {
        setResult(tracking);
      } else {
        setError(
          "ID pesanan belum ditemukan. Silakan periksa kembali atau hubungi admin Prashoes."
        );
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section id="lacak" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl">
          {/* Search box */}
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm sm:p-12">
            <h2 className="mb-2 text-center text-3xl font-bold text-white">
              Lacak Pesanan
            </h2>
            <p className="mb-8 text-center text-sm text-zinc-400">
              Masukkan ID pesanan kamu untuk melihat status terkini.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="order-id">
                ID Pesanan
              </label>
              <input
                id="order-id"
                type="text"
                placeholder="Contoh: PRS001"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTrack();
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-zinc-500 outline-none transition-colors focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30"
              />
              <button
                onClick={handleTrack}
                disabled={loading}
                className="rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Mencari..." : "Lacak"}
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Tracking result */}
          {result && (
            <div className="space-y-6">
              {/* Order header card */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">ID Pesanan</p>
                    <p className="text-xl font-bold text-white">
                      {result.order_code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-400">Status</p>
                    <p className="text-base font-semibold text-yellow-300">
                      {result.status}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Dibuat</p>
                    <p className="text-zinc-300">
                      {formatDateTime(result.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Terakhir diperbarui</p>
                    <p className="text-zinc-300">
                      {formatDateTime(result.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order items with before-after photos */}
              {result.items.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Item Sepatu ({result.items.length})
                  </h3>
                  <div className="space-y-4">
                    {result.items.map((item) => (
                      <OrderItemBeforeAfter
                        key={item.item_number}
                        itemNumber={item.item_number}
                        shoeDescription={item.shoe_description}
                        serviceName={item.service_name}
                        itemStatus={item.item_status}
                        notes={item.notes}
                        photos={item.photos}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}