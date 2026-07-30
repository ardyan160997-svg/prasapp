"use client";

import Image from "next/image";
import type { OrderItemPhoto } from "@/features/main/types";

interface OrderItemBeforeAfterProps {
  itemNumber: number;
  shoeDescription: string;
  serviceName: string | null;
  itemStatus: string;
  notes: string;
  photos: OrderItemPhoto[];
}

// Status badge color mapping
const statusColor: Record<string, string> = {
  Selesai: "bg-green-500/20 text-green-300 border-green-500/30",
  "Siap diambil": "bg-green-500/20 text-green-300 border-green-500/30",
  "Siap diantar": "bg-green-500/20 text-green-300 border-green-500/30",
  "Quality check": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Sedang diperiksa": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Proses pembersihan": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Proses pengeringan": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Sepatu diterima": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Pesanan dibuat": "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

function getStatusStyle(status: string): string {
  return (
    statusColor[status] ??
    "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
  );
}

// Get before and after photos
function getPhoto(
  photos: OrderItemPhoto[],
  type: "before" | "after"
): OrderItemPhoto | undefined {
  return photos.find((p) => p.photo_type === type);
}

export default function OrderItemBeforeAfter({
  itemNumber,
  shoeDescription,
  serviceName,
  itemStatus,
  notes,
  photos,
}: OrderItemBeforeAfterProps) {
  const beforePhoto = getPhoto(photos, "before");
  const afterPhoto = getPhoto(photos, "after");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors duration-200 hover:border-white/20">
      {/* Header: item number & description */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-white">
            Sepatu {itemNumber}
          </h4>
          <p className="mt-0.5 text-sm text-zinc-400">{shoeDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {serviceName && (
            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-300">
              {serviceName}
            </span>
          )}
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(itemStatus)}`}
          >
            {itemStatus}
          </span>
        </div>
      </div>

      {/* Before-After comparison */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        {/* Before */}
        <div className="rounded-xl border border-white/5 bg-zinc-800/60 p-4">
          <p className="mb-2 text-center text-xs font-bold tracking-widest text-zinc-400">
            SEBELUM
          </p>
          {beforePhoto ? (
            beforePhoto.image_url ? (
              <Image
                src={beforePhoto.image_url}
                alt={beforePhoto.caption || "Foto sebelum"}
                width={512}
                height={384}
                unoptimized
                className="mx-auto h-28 w-full rounded-lg object-cover sm:h-36"
              />
            ) : (
              <div className="mx-auto flex h-28 w-full items-center justify-center rounded-lg bg-zinc-700/60 sm:h-36">
                <div className="text-center">
                  <div className="mx-auto mb-1 h-16 w-24 rounded-lg bg-zinc-600/50 sm:h-20 sm:w-32" />
                  <p className="text-[10px] text-zinc-500">
                    {beforePhoto.caption || "Foto sebelum"}
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="mx-auto flex h-28 w-full items-center justify-center rounded-lg bg-zinc-700/60 sm:h-36">
              <p className="text-center text-xs text-zinc-500">
                Foto sebelum belum tersedia.
              </p>
            </div>
          )}
        </div>

        {/* After */}
        <div className="rounded-xl border border-yellow-500/10 bg-yellow-900/10 p-4">
          <p className="mb-2 text-center text-xs font-bold tracking-widest text-yellow-300">
            SESUDAH
          </p>
          {afterPhoto ? (
            afterPhoto.image_url ? (
              <Image
                src={afterPhoto.image_url}
                alt={afterPhoto.caption || "Foto sesudah"}
                width={512}
                height={384}
                unoptimized
                className="mx-auto h-28 w-full rounded-lg object-cover sm:h-36"
              />
            ) : (
              <div className="mx-auto flex h-28 w-full items-center justify-center rounded-lg bg-yellow-800/30 sm:h-36">
                <div className="text-center">
                  <div className="mx-auto mb-1 h-16 w-24 rounded-lg bg-yellow-700/30 sm:h-20 sm:w-32" />
                  <p className="text-[10px] text-yellow-500/70">
                    {afterPhoto.caption || "Foto sesudah"}
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="mx-auto flex h-28 w-full items-center justify-center rounded-lg bg-yellow-800/30 sm:h-36">
              <p className="text-center text-xs text-yellow-500/60">
                Foto sesudah belum tersedia.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <p className="text-xs italic text-zinc-500">
          <span className="text-zinc-400">Catatan:</span> {notes}
        </p>
      )}
    </div>
  );
}
