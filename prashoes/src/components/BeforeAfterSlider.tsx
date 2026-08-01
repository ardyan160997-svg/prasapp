import { fetchGalleryItems } from "@/features/main/services/public-site-data";

export default async function BeforeAfterSlider() {
  const galleryItems = await fetchGalleryItems();

  return (
    <section id="hasil" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-2 text-center text-3xl font-bold text-white">
          Before & After
        </h2>
        <p className="mb-12 text-center text-sm text-zinc-400">
          Lihat perubahan sepatu setelah dirawat.
        </p>

        {galleryItems.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {galleryItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
              >
                <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                  <div className="bg-zinc-950/70 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.beforeUrl}
                      alt={`Before ${item.label}`}
                      className="aspect-[4/3] w-full rounded-2xl object-cover"
                    />
                    <p className="mt-3 text-xs font-bold tracking-[0.25em] text-zinc-400">
                      BEFORE
                    </p>
                  </div>
                  <div className="bg-zinc-950/70 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.afterUrl}
                      alt={`After ${item.label}`}
                      className="aspect-[4/3] w-full rounded-2xl object-cover"
                    />
                    <p className="mt-3 text-xs font-bold tracking-[0.25em] text-yellow-300">
                      AFTER
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 px-5 py-4 text-sm text-zinc-300">
                  {item.label}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center text-sm text-zinc-500">
            Belum ada data gallery before/after di database.
          </div>
        )}
      </div>
    </section>
  );
}
