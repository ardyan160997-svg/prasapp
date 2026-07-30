import { fetchServices } from "@/features/main/services/public-site-data";

export default async function PricelistSection() {
  const services = await fetchServices();
  return (
    <section id="harga" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-2 text-center text-3xl font-bold text-white">
          Daftar Harga
        </h2>
        <p className="mb-12 text-center text-sm text-zinc-400">
          Pilih layanan yang sesuai dengan kebutuhan sepatu kamu.
        </p>

        {services.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-yellow-400/30 hover:bg-white/[0.07]"
              >
                <h3 className="mb-1 text-lg font-semibold text-white">
                  {svc.name}
                </h3>
                <p className="mb-3 text-sm font-medium text-yellow-400">
                  {svc.startingPrice}
                </p>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {svc.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center text-sm text-zinc-500">
            Belum ada data layanan di database.
          </div>
        )}
      </div>
    </section>
  );
}
