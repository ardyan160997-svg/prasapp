"use client";

import { Fragment, useState, useTransition } from "react";
import type { AdminOrder, AdminOrderItem } from "@/features/admin/types";

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-300">
      {status || "-"}
    </span>
  );
}

function PhotoForm({
  item,
  photoType,
}: {
  item: AdminOrderItem;
  photoType: "before" | "after";
}) {
  const existingPhoto = item.photos.find((photo) => photo.photoType === photoType);
  const [imageUrl, setImageUrl] = useState(existingPhoto?.imageUrl ?? "");
  const [caption, setCaption] = useState(existingPhoto?.caption ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/order-items/${item.id}/photos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoType,
          imageUrl,
          caption,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Gagal menyimpan foto.");
        return;
      }

      setMessage("Foto tersimpan. Refresh halaman untuk melihat data terbaru.");
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
      <p className="text-sm font-semibold capitalize text-white">{photoType}</p>

      {existingPhoto?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={existingPhoto.imageUrl}
          alt={`${photoType} ${item.shoeDescription}`}
          className="mt-3 aspect-video w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mt-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-zinc-500">
          Belum ada foto {photoType}
        </div>
      )}

      <label className="mt-3 block text-xs text-zinc-500">URL Gambar</label>
      <input
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
        placeholder="https://..."
        className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-yellow-400/60"
      />

      <label className="mt-3 block text-xs text-zinc-500">Caption</label>
      <input
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        placeholder="Opsional"
        className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-yellow-400/60"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-3 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Menyimpan..." : `Simpan ${photoType}`}
      </button>

      {message ? <p className="mt-2 text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}

function UploadBeforeAfterPanel({ order }: { order: AdminOrder }) {
  return (
    <div className="border-t border-white/10 bg-zinc-950/40 px-5 py-5">
      <h3 className="text-sm font-semibold text-white">Upload Before / After</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Masukkan URL foto before/after untuk setiap item sepatu pada order {order.orderCode}.
      </p>

      <div className="mt-4 space-y-4">
        {order.items.length > 0 ? (
          order.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-white">
                  Item #{item.itemNumber} — {item.shoeDescription || "Sepatu"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{item.itemStatus}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PhotoForm item={item} photoType="before" />
                <PhotoForm item={item} photoType="after" />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-white/10 p-4 text-sm text-zinc-500">
            Belum ada item sepatu untuk order ini.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-5 py-3">Nama Customer</th>
            <th className="px-5 py-3">WhatsApp</th>
            <th className="px-5 py-3">Layanan</th>
            <th className="px-5 py-3">QTY</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Tanggal</th>
            <th className="px-5 py-3">Payment</th>
            <th className="px-5 py-3">Promo</th>
            <th className="px-5 py-3">Upload B/A</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {orders.length > 0 ? (
            orders.map((order) => {
              const isOpen = openOrderId === order.id;

              return (
                <Fragment key={order.id}>
                <tr className="text-zinc-300">
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{order.customerName || "-"}</div>
                    <div className="mt-1 text-xs text-yellow-300">{order.orderCode}</div>
                  </td>
                  <td className="px-5 py-4">{order.whatsappNumber || "-"}</td>
                  <td className="px-5 py-4">{order.serviceType || "-"}</td>
                  <td className="px-5 py-4">{order.shoeQuantity || "-"}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 text-zinc-500">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4">{order.paymentMethod || "-"}</td>
                  <td className="px-5 py-4">{order.promoLabel || "-"}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-yellow-400/60 hover:text-yellow-300"
                    >
                      {isOpen ? "Tutup" : "Upload B/A"}
                    </button>
                  </td>
                </tr>

                {isOpen ? (
                  <tr className="text-zinc-300">
                    <td colSpan={9} className="p-0">
                      <UploadBeforeAfterPanel order={order} />
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              );
            })
          ) : (
            <tr>
              <td className="px-5 py-8 text-center text-zinc-500" colSpan={9}>
                Belum ada riwayat pesanan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}