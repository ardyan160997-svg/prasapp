"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Target, AlertTriangle, Users, DollarSign, ShoppingCart, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

interface RingkasanData {
  period: { month: number; year: number };
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
    targetDate: string | null;
    status: string;
    progress: number;
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
  members: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; type: string; icon: string | null; color: string | null }>;
}

export default function RingkasanPage() {
  const [data, setData] = useState<RingkasanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ringkasan?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleMonthChange = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const priorityColors = {
    HIGH: "bg-[var(--primary-soft)] text-[var(--primary)]",
    MEDIUM: "bg-[var(--accent-soft)] text-[var(--accent)]",
    LOW: "bg-[var(--secondary-soft)] text-[var(--secondary)]",
  };

  const priorityLabels = { HIGH: "Tinggi", MEDIUM: "Sedang", LOW: "Rendah" };

  if (isLoading) {
    return (
      <div className="container-app py-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container-app py-6">
        <div className="text-center py-12 text-[color:var(--foreground)]/60">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Gagal memuat ringkasan</p>
        </div>
      </div>
    );
  }

  const { period, summary, breakdown, savingsGoals, upcomingPlans } = data;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="container-app py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Ringkasan Bulanan</h1>
            <p className="text-sm text-[color:var(--foreground)]/70">
              {monthNames[period.month - 1]} {period.year}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-xl border transition hover:bg-[var(--surface-muted)]" style={{ borderColor: "var(--border)" }}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="px-4 py-2 font-semibold">{monthNames[currentMonth - 1]} {currentYear}</span>
            <button onClick={() => handleMonthChange(1)} className="p-2 rounded-xl border transition hover:bg-[var(--surface-muted)]" style={{ borderColor: "var(--border)" }}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-soft space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--secondary)]" />
              <span className="text-sm text-[color:var(--foreground)]/60">Pemasukan</span>
            </div>
            <p className="text-2xl font-bold text-[var(--secondary)]">{formatRupiah(summary.income)}</p>
          </div>
          <div className="card-soft space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-[var(--primary)]" />
              <span className="text-sm text-[color:var(--foreground)]/60">Pengeluaran</span>
            </div>
            <p className="text-2xl font-bold text-[var(--primary)]">{formatRupiah(summary.expense)}</p>
          </div>
          <div className="card-soft space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" style={{ color: summary.netFlow >= 0 ? "var(--secondary)" : "var(--primary)" }} />
              <span className="text-sm text-[color:var(--foreground)]/60">Net Flow</span>
            </div>
            <p className={`text-2xl font-bold ${summary.netFlow >= 0 ? "text-[var(--secondary)]" : "text-[var(--primary)]"}`}>
              {formatRupiah(summary.netFlow)}
            </p>
          </div>
          <div className="card-soft space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--accent)]" />
              <span className="text-sm text-[color:var(--foreground)]/60">Total Tabungan</span>
            </div>
            <p className="text-2xl font-bold text-[var(--accent)]">{formatRupiah(summary.totalSavings)}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-soft space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[var(--secondary)]" />
              <span className="text-sm text-[color:var(--foreground)]/60">Kebutuhan</span>
            </div>
            <p className="text-xl font-bold text-[var(--secondary)]">{formatRupiah(summary.needs)}</p>
          </div>
          <div className="card-soft space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-[var(--accent)]" />
              <span className="text-sm text-[color:var(--foreground)]/60">Keinginan</span>
            </div>
            <p className="text-xl font-bold text-[var(--accent)]">{formatRupiah(summary.wants)}</p>
          </div>
          <div className="card-soft space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--foreground)]/60" />
              <span className="text-sm text-[color:var(--foreground)]/60">Catatan</span>
            </div>
            <p className="text-xl font-bold">{summary.transactionCount}</p>
          </div>
          <div className="card-soft space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--foreground)]/60" />
              <span className="text-sm text-[color:var(--foreground)]/60">Target Aktif</span>
            </div>
            <p className="text-xl font-bold">{savingsGoals.length}</p>
          </div>
        </div>

        {Object.keys(breakdown.expenseByCategory).length > 0 && (
          <div className="card-soft space-y-4">
            <h2 className="text-lg font-semibold">Pengeluaran per Kategori</h2>
            <div className="space-y-3">
              {Object.entries(breakdown.expenseByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm">{category}</span>
                    <span className="font-semibold text-[var(--primary)]">{formatRupiah(amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {Object.keys(breakdown.incomeByCategory).length > 0 && (
          <div className="card-soft space-y-4">
            <h2 className="text-lg font-semibold">Pemasukan per Kategori</h2>
            <div className="space-y-3">
              {Object.entries(breakdown.incomeByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm">{category}</span>
                    <span className="font-semibold text-[var(--secondary)]">{formatRupiah(amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {Object.keys(breakdown.expenseByMember).length > 0 && (
          <div className="card-soft space-y-4">
            <h2 className="text-lg font-semibold">Pengeluaran per Member</h2>
            <div className="space-y-3">
              {Object.entries(breakdown.expenseByMember)
                .sort(([, a], [, b]) => b - a)
                .map(([member, amount]) => (
                  <div key={member} className="flex items-center justify-between">
                    <span className="text-sm">{member}</span>
                    <span className="font-semibold text-[var(--primary)]">{formatRupiah(amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {savingsGoals.length > 0 && (
          <div className="card-soft space-y-4">
            <h2 className="text-lg font-semibold flex items-center justify-between">
              Tabungan Aktif
              <span className="text-sm text-[color:var(--foreground)]/60">{savingsGoals.length} target</span>
            </h2>
            <div className="space-y-3">
              {savingsGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-sm font-semibold text-[var(--accent)]">
                      {formatRupiah(goal.currentAmount)} / {formatRupiah(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[color:var(--foreground)]/60">
                    <span>{goal.progress.toFixed(1)}% tercapai</span>
                    {goal.targetDate && (
                      <span>Target: {formatDate(goal.targetDate)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingPlans.length > 0 && (
          <div className="card-soft space-y-4">
            <h2 className="text-lg font-semibold flex items-center justify-between">
              Rencana Mendatang
              <span className="text-sm text-[color:var(--foreground)]/60">{upcomingPlans.length} rencana</span>
            </h2>
            <div className="space-y-3">
              {upcomingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: "var(--surface-muted)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[plan.priority as keyof typeof priorityColors]}`}
                    >
                      {priorityLabels[plan.priority as keyof typeof priorityLabels]}
                    </span>
                    <div>
                      <p className="font-medium">{plan.title}</p>
                      <p className="text-xs text-[color:var(--foreground)]/60">
                        Jatuh tempo: {formatDate(plan.dueDate)} ({plan.daysUntilDue} hari lagi)
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-[var(--primary)]">{formatRupiah(plan.estimatedAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {savingsGoals.length === 0 && upcomingPlans.length === 0 && summary.transactionCount === 0 && (
          <div className="card-soft text-center py-12">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-30 text-[var(--foreground)]/40" />
            <p className="font-medium">Belum ada data untuk periode ini</p>
            <p className="text-sm mt-1 text-[color:var(--foreground)]/60">
              Mulai catat keuangan di <a href="/catatan-keuangan" className="underline text-[var(--primary)]">Catatan Keuangan</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}