"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarClock,
  Heart,
  Landmark,
  PiggyBank,
  ReceiptText,
  Shield,
  ShoppingBasket,
  Sparkles,
  Wallet,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

type RingkasanData = {
  summary: {
    income: number;
    expense: number;
    netFlow: number;
    needs: number;
    wants: number;
    totalSavings: number;
    transactionCount: number;
  };
  breakdown: {
    expenseByCategory: Record<string, number>;
    incomeByCategory: Record<string, number>;
    expenseByMember: Record<string, number>;
  };
  savingsGoals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    status: string;
  }>;
  upcomingPlans: Array<{
    id: string;
    title: string;
    estimatedAmount: number;
    dueDate: string;
    priority: string;
    status: string;
    daysUntilDue: number;
  }>;
};

type QuickAction = {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "secondary" | "accent";
};

const quickActions: QuickAction[] = [
  {
    title: "Isi Pemasukan",
    subtitle: "Tambah uang masuk keluarga",
    href: "/catatan-keuangan",
    icon: BanknoteArrowUp,
    tone: "secondary",
  },
  {
    title: "Isi Pengeluaran",
    subtitle: "Catat uang keluar hari ini",
    href: "/catatan-keuangan",
    icon: BanknoteArrowDown,
    tone: "primary",
  },
  {
    title: "Kebutuhan Pokok",
    subtitle: "Belanja rutin & kebutuhan rumah",
    href: "/catatan-keuangan",
    icon: ShoppingBasket,
    tone: "secondary",
  },
  {
    title: "Hiburan",
    subtitle: "Jajan, jalan, dan santai",
    href: "/catatan-keuangan",
    icon: Heart,
    tone: "accent",
  },
  {
    title: "Wishlist",
    subtitle: "Tambah keinginan keluarga",
    href: "/wishlist",
    icon: Sparkles,
    tone: "accent",
  },
  {
    title: "Rencana",
    subtitle: "Buat rencana biaya ke depan",
    href: "/rencana",
    icon: CalendarClock,
    tone: "primary",
  },
  {
    title: "Cicilan",
    subtitle: "Pantau kewajiban bulanan",
    href: "/rencana",
    icon: ReceiptText,
    tone: "primary",
  },
  {
    title: "Dana Darurat",
    subtitle: "Amankan buffer keluarga",
    href: "/tabungan",
    icon: Shield,
    tone: "secondary",
  },
  {
    title: "Tabungan",
    subtitle: "Set target dan setor rutin",
    href: "/tabungan",
    icon: PiggyBank,
    tone: "accent",
  },
];

const toneStyles = {
  primary: {
    iconBg: "var(--primary-soft)",
    iconColor: "var(--primary)",
    glow: "rgba(249,115,22,0.18)",
  },
  secondary: {
    iconBg: "var(--secondary-soft)",
    iconColor: "var(--secondary)",
    glow: "rgba(20,184,166,0.18)",
  },
  accent: {
    iconBg: "var(--accent-soft)",
    iconColor: "var(--accent)",
    glow: "rgba(139,92,246,0.18)",
  },
} as const;

export default function HomePage() {
  const [data, setData] = useState<RingkasanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ringkasan", { credentials: "include" });
      if (res.status === 401) {
        setIsLocked(true);
        setData(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch ringkasan");
      const result = (await res.json()) as RingkasanData;
      setData(result);
      setIsLocked(false);
    } catch (error) {
      console.error("Fetch homepage summary error:", error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartRows = useMemo(() => {
    if (!data) return [];
    const totalBase = Math.max(data.summary.income, 1);
    return [
      {
        label: "Pemasukan",
        value: data.summary.income,
        color: "var(--secondary)",
      },
      {
        label: "Pengeluaran",
        value: data.summary.expense,
        color: "var(--primary)",
      },
      {
        label: "Kebutuhan Pokok",
        value: data.summary.needs,
        color: "#22c55e",
      },
      {
        label: "Hiburan / Keinginan",
        value: data.summary.wants,
        color: "var(--accent)",
      },
      {
        label: "Tabungan",
        value: data.summary.totalSavings,
        color: "#eab308",
      },
    ].map((item) => ({
      ...item,
      percent: Math.min((item.value / totalBase) * 100, 100),
    }));
  }, [data]);

  const topExpenses = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.breakdown.expenseByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);
  }, [data]);

  const summaryCards = data
    ? [
        {
          label: "Pemasukan",
          value: formatRupiah(data.summary.income),
          tone: "secondary" as const,
        },
        {
          label: "Pengeluaran",
          value: formatRupiah(data.summary.expense),
          tone: "primary" as const,
        },
        {
          label: "Dana Tersisa",
          value: formatRupiah(data.summary.netFlow),
          tone: data.summary.netFlow >= 0 ? ("secondary" as const) : ("primary" as const),
        },
        {
          label: "Tabungan",
          value: formatRupiah(data.summary.totalSavings),
          tone: "accent" as const,
        },
      ]
    : [];

  return (
    <main className="min-h-screen">
      <section className="container-app py-6 sm:py-8 lg:py-10">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span
                className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}
              >
                <Wallet className="h-4 w-4" />
                Dashboard Keuangan Keluarga
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  Isi data keuangan lebih cepat, lihat grafiknya langsung.
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-[color:var(--foreground)]/75 sm:text-base">
                  Semua tombol penting ada di depan: pemasukan, pengeluaran, kebutuhan pokok, hiburan,
                  wishlist, rencana, cicilan, dana darurat, dan tabungan.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/catatan-keuangan"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--primary)" }}
              >
                Isi Catatan Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/ringkasan"
                className="inline-flex items-center rounded-full border px-5 py-3 text-sm font-semibold transition hover:bg-[var(--surface-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                Lihat Grafik Ringkasan
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map(({ title, subtitle, href, icon: Icon, tone }) => {
              const style = toneStyles[tone];
              return (
                <Link
                  key={title}
                  href={href}
                  className="card-soft group flex items-center justify-between gap-4 transition hover:-translate-y-0.5"
                  style={{ boxShadow: `0 10px 30px ${style.glow}` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: style.iconBg, color: style.iconColor }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-bold sm:text-lg">{title}</h2>
                      <p className="text-sm leading-6 text-[color:var(--foreground)]/68">{subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--foreground)]/35 transition group-hover:text-[color:var(--foreground)]/70" />
                </Link>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <div className="card-soft space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--primary)]">Grafik Utama</p>
                  <h2 className="text-xl font-bold">Arus uang bulan ini</h2>
                </div>
                <Link href="/ringkasan" className="text-sm font-semibold text-[var(--primary)]">
                  Buka detail
                </Link>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                </div>
              ) : isLocked ? (
                <div className="rounded-3xl border px-5 py-8 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-lg font-bold">Masuk dulu buat lihat grafik keluarga</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]/70">
                    Setelah login, dashboard ini langsung tampilkan pemasukan, pengeluaran, tabungan, dan kategori paling besar.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    Buka Halaman Login
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : data ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((item) => {
                      const tone = toneStyles[item.tone];
                      return (
                        <div key={item.label} className="rounded-3xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                          <p className="text-sm text-[color:var(--foreground)]/60">{item.label}</p>
                          <p className="mt-2 text-xl font-bold" style={{ color: tone.iconColor }}>
                            {item.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4 rounded-3xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                    {chartRows.map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-[color:var(--foreground)]/70">{formatRupiah(item.value)}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border px-5 py-8 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-lg font-bold">Grafik belum bisa dimuat</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]/70">Coba buka ringkasan atau login ulang dulu.</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="card-soft space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--accent)]">Sorotan Cepat</p>
                  <h2 className="text-xl font-bold">Kategori yang paling makan budget</h2>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--surface-muted)" }} />
                    ))}
                  </div>
                ) : topExpenses.length > 0 ? (
                  <div className="space-y-3">
                    {topExpenses.map(([category, amount], index) => (
                      <div
                        key={category}
                        className="rounded-2xl border p-4"
                        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-muted)" }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/45">
                              Top {index + 1}
                            </p>
                            <p className="text-sm font-bold sm:text-base">{category}</p>
                          </div>
                          <p className="text-sm font-semibold text-[var(--primary)]">{formatRupiah(amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border p-4 text-sm text-[color:var(--foreground)]/70" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-muted)" }}>
                    Belum ada pengeluaran tercatat. Mulai isi pemasukan atau pengeluaran dulu dari tombol di atas.
                  </div>
                )}
              </div>

              <div className="card-soft space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--secondary)]">Target Keuangan</p>
                  <h2 className="text-xl font-bold">Tabungan & rencana terdekat</h2>
                </div>

                {data && (data.savingsGoals.length > 0 || data.upcomingPlans.length > 0) ? (
                  <div className="space-y-4">
                    {data.savingsGoals.slice(0, 2).map((goal) => (
                      <div key={goal.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold">{goal.name}</p>
                          <p className="text-sm font-semibold text-[var(--accent)]">{goal.progress.toFixed(0)}%</p>
                        </div>
                        <p className="mt-1 text-sm text-[color:var(--foreground)]/70">
                          {formatRupiah(goal.currentAmount)} / {formatRupiah(goal.targetAmount)}
                        </p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(goal.progress, 100)}%` }} />
                        </div>
                      </div>
                    ))}

                    {data.upcomingPlans.slice(0, 2).map((plan) => (
                      <div key={plan.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold">{plan.title}</p>
                          <p className="text-sm font-semibold text-[var(--primary)]">{formatRupiah(plan.estimatedAmount)}</p>
                        </div>
                        <p className="mt-1 text-sm text-[color:var(--foreground)]/70">
                          {plan.daysUntilDue >= 0 ? `${plan.daysUntilDue} hari lagi` : "Sudah lewat jatuh tempo"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border p-4 text-sm text-[color:var(--foreground)]/70" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-muted)" }}>
                    Belum ada tabungan atau rencana aktif. Pakai tombol Dana Darurat, Tabungan, atau Rencana untuk mulai isi.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
