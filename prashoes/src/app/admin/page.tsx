import Link from "next/link";
import AdminOrdersTable from "@/components/admin/AdminOrdersTable";
import { fetchAdminDashboardData } from "@/lib/supabase-service";

export const metadata = {
  title: "Admin | Prashoes",
  description: "Dashboard admin Prashoes untuk memantau pesanan dan permintaan antar jemput.",
};

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AdminPage() {
  const data = await fetchAdminDashboardData();

  const stats = [
    {
      label: "Pickup Request",
      value: data.stats.pickupRequests,
      description: "Total permintaan antar jemput",
    },
    {
      label: "Order",
      value: data.stats.orders,
      description: "Total pesanan terdaftar",
    },
    {
      label: "Promo Aktif",
      value: data.stats.activePromos,
      description: "Promo yang sedang tampil",
    },
    {
      label: "Layanan",
      value: data.stats.services,
      description: "Jenis layanan tersedia",
    },
    {
      label: "Total Pemasukan",
      value: formatCurrency(data.stats.totalRevenue),
      description: "Akumulasi revenue order",
    },
    {
      label: "Total Cost",
      value: formatCurrency(data.stats.totalCost),
      description: "Production, bahan baku, dan lain-lain",
    },
    {
      label: "Estimasi Profit",
      value: formatCurrency(data.stats.totalProfit),
      description: "Pemasukan dikurangi semua cost",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10 bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-yellow-400">
              Prashoes Admin
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Dashboard Admin
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Pantau permintaan antar jemput, pesanan terbaru, promo aktif, dan layanan
              yang tersedia dari satu halaman.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-yellow-400/60 hover:text-yellow-300"
          >
            Kembali ke Website
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/10"
            >
              <p className="text-sm text-zinc-400">{item.label}</p>
              <p className="mt-3 text-2xl font-bold text-white md:text-3xl">{item.value}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold">Permintaan Antar Jemput Terbaru</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Data terbaru dari form pickup customer.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">WhatsApp</th>
                    <th className="px-5 py-3">Layanan</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.recentPickupRequests.length > 0 ? (
                    data.recentPickupRequests.map((request) => (
                      <tr key={request.id} className="text-zinc-300">
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{request.fullName}</div>
                          <div className="mt-1 max-w-[220px] truncate text-xs text-zinc-500">
                            {request.pickupAddress}
                          </div>
                        </td>
                        <td className="px-5 py-4">{request.whatsappNumber}</td>
                        <td className="px-5 py-4">{request.serviceType}</td>
                        <td className="px-5 py-4">{request.shoeQuantity}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-5 py-4 text-zinc-500">
                          {formatDate(request.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-8 text-center text-zinc-500" colSpan={6}>
                        Belum ada data pickup request.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] xl:col-span-2">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold">Riwayat Pesanan</h2>
            </div>

            <AdminOrdersTable orders={data.recentOrders} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] xl:col-span-2">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold">Cashflow</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Riwayat transaksi pemasukkan dan pengeluaran operasional.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Transaksi</th>
                    <th className="px-5 py-3">Keterangan</th>
                    <th className="px-5 py-3">Jumlah</th>
                    <th className="px-5 py-3">QTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.cashflowTransactions.length > 0 ? (
                    data.cashflowTransactions.map((transaction) => (
                      <tr key={transaction.id} className="text-zinc-300">
                        <td className="px-5 py-4 text-zinc-500">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={
                              transaction.transactionType === "pemasukkan"
                                ? "inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
                                : "inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-300"
                            }
                          >
                            {transaction.transactionType}
                          </span>
                        </td>
                        <td className="px-5 py-4">{transaction.description || "-"}</td>
                        <td className="px-5 py-4 font-semibold text-white">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-5 py-4">{transaction.quantity}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-8 text-center text-zinc-500" colSpan={5}>
                        Belum ada data cashflow.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5 text-sm leading-relaxed text-yellow-100">
          <p className="font-semibold text-yellow-300">Catatan keamanan</p>
          <p className="mt-2 text-yellow-100/80">
            Halaman ini masih berupa dashboard admin awal dan belum memakai login.
            Untuk production, tambahkan proteksi route dengan autentikasi admin.
          </p>
        </div>
      </section>
    </main>
  );
}