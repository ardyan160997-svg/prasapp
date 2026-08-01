import Link from "next/link";
import { fetchMemberDashboardData } from "@/features/member/services/member-dashboard-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function MemberDashboardPage() {
  const data = await fetchMemberDashboardData();

  const stats = [
    {
      label: "Poin Member",
      value: data.profile.points,
      description: "Poin aktif yang bisa dipakai untuk reward.",
    },
    {
      label: "Order Aktif",
      value: data.profile.activeOrders,
      description: "Pesanan yang masih dalam proses treatment.",
    },
    {
      label: "Order Selesai",
      value: data.profile.completedOrders,
      description: "Pesanan yang sudah siap atau selesai diproses.",
    },
    {
      label: "Total Order",
      value: data.profile.totalOrders,
      description: "Riwayat order yang tampil di dashboard member.",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.12),_transparent_24%),linear-gradient(180deg,_rgba(9,9,11,0.98),_rgba(9,9,11,0.92))]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-yellow-400">
              Prashoes Member
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Dashboard Member
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Pantau progres order, benefit member, promo aktif, dan poin reward dari
              satu halaman yang ringkas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/#lacak"
              className="inline-flex rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-300"
            >
              Lacak Pesanan
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-yellow-400/60 hover:text-yellow-300"
            >
              Kembali ke Website
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 via-white/[0.03] to-transparent p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm text-yellow-300">{data.profile.tier}</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">{data.profile.name}</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Member ID {data.profile.memberCode}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100">
                <p className="font-semibold text-emerald-300">Reward berikutnya</p>
                <p className="mt-1">{data.profile.nextReward}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold text-white">Pengingat Member</p>
            <div className="mt-4 space-y-3">
              {data.reminders.map((reminder) => (
                <div
                  key={reminder}
                  className="rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-sm leading-relaxed text-zinc-300"
                >
                  {reminder}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/10"
            >
              <p className="text-sm text-zinc-400">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold">Order Terbaru</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ringkasan progres order yang sedang dipantau member.
              </p>
            </div>

            {data.recentOrders.length > 0 ? (
              <div className="divide-y divide-white/10">
                {data.recentOrders.map((order) => (
                  <article
                    key={order.orderCode}
                    className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm text-zinc-500">ID Pesanan</p>
                      <h3 className="mt-1 text-xl font-semibold text-white">
                        {order.orderCode}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">{order.status}</p>
                    </div>

                    <div className="grid gap-3 text-sm text-zinc-300 md:text-right">
                      <div>
                        <p className="text-zinc-500">Layanan utama</p>
                        <p className="font-medium text-white">{order.primaryService}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Total item</p>
                        <p>{order.itemCount} pasang</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Update terakhir</p>
                        <p>{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-sm text-zinc-500">
                Belum ada riwayat order member di database.
              </div>
            )}
          </section>

          <div className="space-y-8">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold">Benefit Member</h2>
              <div className="mt-4 space-y-3">
                {data.benefits.length > 0 ? (
                  data.benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300"
                    >
                      {benefit}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-4 py-4 text-sm text-zinc-500">
                    Belum ada benefit member di database.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold">Promo Aktif</h2>
              <div className="mt-4 space-y-3">
                {data.promos.length > 0 ? (
                  data.promos.map((promo) => (
                    <article
                      key={promo.id}
                      className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-white">{promo.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                            {promo.description}
                          </p>
                        </div>
                        <span className="rounded-full border border-yellow-400/30 bg-black/20 px-3 py-1 text-xs font-semibold text-yellow-300">
                          {promo.discountLabel}
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-4 py-4 text-sm text-zinc-500">
                    Belum ada promo member di database.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
