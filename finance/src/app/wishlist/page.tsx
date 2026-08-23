"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Plus, Trash2, Calendar, PiggyBank } from "lucide-react";
import { formatDate, formatRupiah } from "@/lib/utils";

type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  progress: number;
};

type Plan = {
  id: string;
  title: string;
  estimatedAmount: number;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PLANNED" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED";
  note: string | null;
};

type WishlistItem = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  note: string | null;
};

export default function WishlistPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", dueDate: "", note: "" });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, goalsRes] = await Promise.all([fetch("/api/rencana"), fetch("/api/tabungan")]);
      const [plansData, goalsData] = await Promise.all([plansRes.json(), goalsRes.json()]);

      const rawPlans = (plansData.plans || []) as Plan[];
      const wishlistPlans = rawPlans.filter((plan) => plan.priority === "LOW" || plan.status === "READY");
      setPlans(wishlistPlans);
      setGoals(goalsData.goals || []);
      setItems(
        wishlistPlans.map((plan) => ({
          id: plan.id,
          title: plan.title,
          amount: plan.estimatedAmount,
          dueDate: plan.dueDate,
          note: plan.note,
        }))
      );
    } catch (error) {
      console.error("Fetch wishlist error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !amount || amount <= 0 || !form.dueDate) return;

    const res = await fetch("/api/rencana", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        estimatedAmount: amount,
        dueDate: form.dueDate,
        priority: "LOW",
        status: "READY",
        note: form.note || null,
      }),
    });

    if (!res.ok) return;

    setForm({ title: "", amount: "", dueDate: "", note: "" });
    setShowForm(false);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus wishlist ini?")) return;
    const res = await fetch(`/api/rencana/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    await fetchData();
  };

  const totalWishlist = items.reduce((sum, item) => sum + item.amount, 0);
  const totalSavings = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const nearestGoal = goals
    .filter((goal) => goal.targetDate)
    .sort((a, b) => new Date(a.targetDate || 0).getTime() - new Date(b.targetDate || 0).getTime())[0];

  return (
    <div className="container-app py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Wishlist</h1>
          <p className="text-sm text-[color:var(--foreground)]/70">Daftar keinginan yang ingin dicapai setelah kebutuhan utama aman.</p>
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <Plus className="h-4 w-4" />
          Tambah Wishlist
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-soft space-y-1">
          <p className="text-sm text-[color:var(--foreground)]/60">Total Wishlist</p>
          <p className="text-2xl font-bold text-[var(--primary)]">{formatRupiah(totalWishlist)}</p>
        </div>
        <div className="card-soft space-y-1">
          <p className="text-sm text-[color:var(--foreground)]/60">Saldo Tabungan Saat Ini</p>
          <p className="text-2xl font-bold text-[var(--secondary)]">{formatRupiah(totalSavings)}</p>
        </div>
        <div className="card-soft space-y-1">
          <p className="text-sm text-[color:var(--foreground)]/60">Target Terdekat</p>
          <p className="text-lg font-bold">{nearestGoal ? nearestGoal.name : "Belum ada target"}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-soft space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Nama wishlist" className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }} />
            <input value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Nominal" type="number" className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }} />
            <input value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} type="date" className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }} />
            <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Catatan singkat" className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }} />
          </div>
          <button type="submit" className="rounded-2xl px-4 py-2 font-semibold text-white" style={{ backgroundColor: "var(--primary)" }}>Simpan</button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>
      ) : items.length === 0 ? (
        <div className="card-soft text-center py-12">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-30 text-[var(--foreground)]/40" />
          <p className="font-medium">Belum ada wishlist</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="card-soft space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{item.title}</h2>
                  {item.note && <p className="text-sm text-[color:var(--foreground)]/70 mt-1">{item.note}</p>}
                </div>
                <button onClick={() => handleDelete(item.id)} className="rounded-xl border p-2" style={{ borderColor: "var(--border)" }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span>Nominal</span><span className="font-semibold text-[var(--primary)]">{formatRupiah(item.amount)}</span></div>
                <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />Target</span><span>{formatDate(item.dueDate)}</span></div>
                <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><PiggyBank className="h-4 w-4" />Estimasi Sanggup</span><span>{totalSavings >= item.amount ? "Sudah cukup" : formatRupiah(item.amount - totalSavings)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
