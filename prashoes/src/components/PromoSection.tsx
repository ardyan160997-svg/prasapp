import Link from "next/link";
import {
  fetchPromos,
  fetchMemberBenefits,
} from "@/features/main/services/public-site-data";

export default async function PromoSection() {
  const promos = await fetchPromos();
  const benefits = await fetchMemberBenefits();

  return (
    <section id="promo" className="w-full py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-2 text-center text-3xl font-bold text-white">
          Member & Promo
        </h2>
        <p className="mb-12 text-center text-sm text-zinc-400">
          Bergabung jadi member dan nikmati keuntungannya.
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Member Benefits Card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/20">
                <span className="text-xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold text-white">
                Keuntungan Member
              </h3>
            </div>
            {benefits.length > 0 ? (
              <ul className="mb-6 space-y-3">
                {benefits.map((benefit, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <span className="mt-0.5 text-yellow-400">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mb-6 rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-500">
                Belum ada benefit member di database.
              </div>
            )}
            <Link
              href="/member/daftar"
              className="inline-flex w-full justify-center rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black transition-colors hover:bg-yellow-300 sm:w-auto"
            >
              Daftar Member
            </Link>
          </div>

          {/* Promo Cards */}
          {promos.length > 0 ? (
            <div className="space-y-6">
              {promos.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-3xl border border-yellow-400/20 bg-yellow-400/[0.06] p-6"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {promo.title}
                    </h3>
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                      {promo.discountLabel}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{promo.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-500">
              Belum ada promo aktif di database.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
