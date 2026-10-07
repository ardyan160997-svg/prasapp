"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PieChart, Wallet, PiggyBank, Heart, ShoppingCart } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

type RingkasanData = {
  summary: {
    income: number;
    expense: number;
    needs: number;
    wants: number;
    totalSavings: number;
    netFlow: number;
  };
};

export default function AlokasiPage() {
  const [data, setData] = useState<RingkasanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ringkasan");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Fetch alokasi error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allocation = useMemo(() => {
    const income = data?.summary.income || 0;
    const expense = data?.summary.expense || 0;
    const needs = data?.summary.needs || 0;
    const wants = data?.summary.wants || 0;
    const savings = data?.summary.totalSavings || 0;
    const remaining = Math.max(0, income - expense);
    const totalBase = income || needs + wants + savings || 1;

    return [
      { label: "Kebutuhan", value: needs, color: "var(--secondary)", icon: ShoppingCart },
      { label: "Keinginan", value: wants, color: "var(--accent)", icon: Heart },
      { label: "Tabungan", value: savings, color: "var(--primary)", icon: PiggyBank },
      { label: "Sisa Uang", value: remaining, color: "#64748b", icon: Wallet },
    ].map((item) => ({ ...item, percent: totalBase > 0 ? (item.value / totalBase) * 100 : 0 }));
  }, [data]);

  return (
    <div className="container-app py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alokasi</h1>
        <p className="text-sm text-[color:var(--foreground)]/70">Bagi uang ke kebutuhan, keinginan, tabungan, dan sisa uang.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>
      ) : (
        <>
          <div className="card-soft space-y-4">
            <div className="flex items-center gap-2"><PieChart className="h-5 w-5 text-[var(--primary)]" /><h2 className="text-lg font-semibold">Pembagian Saat Ini</h2></div>
            <div className="space-y-4">
              {allocation.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" />{item.label}</span>
                      <span className="font-semibold">{formatRupiah(item.value)} · {item.percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(item.percent, 100)}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {allocation.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="card-soft space-y-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--surface-muted)", color: item.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-[color:var(--foreground)]/60">{item.label}</p>
                  <p className="text-xl font-bold">{formatRupiah(item.value)}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
