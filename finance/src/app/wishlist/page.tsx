"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Coins, Heart, PiggyBank, Plus, ReceiptText, Trash2, Target, ArrowRight } from "lucide-react";
import { formatDate, formatRupiah } from "@/lib/utils";

type Member = {
  id: string;
  name: string;
};

type WishlistSaving = {
  id: string;
  amount: number;
  savingDate: string;
  note: string | null;
  memberId: string;
};

type LinkedSavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  sourceType: string;
};

type WishlistItem = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  note: string | null;
  isInstallment: boolean;
  installmentMonths: number | null;
  installmentAmount: number | null;
  monthlySavingAmount: number | null;
  totalSaved: number;
  remainingAmount: number;
  savings: WishlistSaving[];
  savingsGoals: LinkedSavingsGoal[];
  priority?: string;
};

type WishlistFormState = {
  title: string;
  amount: string;
  dueDate: string;
  note: string;
  installmentMonths: string;
  monthlySavingAmount: string;
};

type SavingFormState = {
  amount: string;
  savingDate: string;
  memberId: string;
  note: string;
};

type StartSavingFormState = {
  name: string;
  targetAmount: string;
  targetDate: string;
  note: string;
};

const initialWishlistForm: WishlistFormState = {
  title: "",
  amount: "",
  dueDate: "",
  note: "",
  installmentMonths: "",
  monthlySavingAmount: "",
};

const initialSavingForm = (): SavingFormState => ({
  amount: "",
  savingDate: new Date().toISOString().split("T")[0],
  memberId: "",
  note: "",
});

const initialStartSavingForm = (item?: WishlistItem): StartSavingFormState => ({
  name: item?.title || "",
  targetAmount: item ? String(item.amount) : "",
  targetDate: item?.dueDate ? item.dueDate.split("T")[0] : "",
  note: item?.note || "",
});

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWishlistForm, setShowWishlistForm] = useState(false);
  const [showSavingFormForId, setShowSavingFormForId] = useState<string | null>(null);
  const [showStartSavingForId, setShowStartSavingForId] = useState<string | null>(null);
  const [wishlistForm, setWishlistForm] = useState<WishlistFormState>(initialWishlistForm);
  const [savingForm, setSavingForm] = useState<SavingFormState>(initialSavingForm);
  const [startSavingForm, setStartSavingForm] = useState<StartSavingFormState>(initialStartSavingForm);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [startSavingError, setStartSavingError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, ringkasanRes] = await Promise.all([fetch("/api/rencana?priority=LOW"), fetch("/api/ringkasan")]);
      const [plansData, ringkasanData] = await Promise.all([plansRes.json(), ringkasanRes.json()]);

      const rawPlans = (plansData.plans || []) as WishlistItem[];
      const wishlistPlans = rawPlans.filter((plan) => plan.priority === undefined || true);
      setItems(wishlistPlans);
      setMembers(ringkasanData.members || []);
    } catch (error) {
      console.error("Fetch wishlist error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.target += item.amount;
        acc.saved += item.totalSaved;
        acc.remaining += item.remainingAmount;
        return acc;
      },
      { target: 0, saved: 0, remaining: 0 }
    );
  }, [items]);

  const handleWishlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(wishlistForm.amount);
    const installmentMonths = wishlistForm.installmentMonths ? Number(wishlistForm.installmentMonths) : null;
    const monthlySavingAmount = wishlistForm.monthlySavingAmount ? Number(wishlistForm.monthlySavingAmount) : null;

    if (!wishlistForm.title.trim() || !amount || amount <= 0 || !wishlistForm.dueDate) return;

    const normalizedInstallmentMonths = installmentMonths && installmentMonths > 0 ? installmentMonths : null;
    const derivedMonthlySaving = normalizedInstallmentMonths
      ? Math.ceil(amount / normalizedInstallmentMonths)
      : monthlySavingAmount && monthlySavingAmount > 0
        ? monthlySavingAmount
        : null;

    const res = await fetch("/api/rencana", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: wishlistForm.title,
        estimatedAmount: amount,
        dueDate: wishlistForm.dueDate,
        priority: "LOW",
        status: "READY",
        note: wishlistForm.note || null,
        isInstallment: true,
        installmentMonths: normalizedInstallmentMonths,
        installmentAmount: derivedMonthlySaving,
        monthlySavingAmount: derivedMonthlySaving,
      }),
    });

    if (!res.ok) return;

    setWishlistForm(initialWishlistForm);
    setShowWishlistForm(false);
    await fetchData();
  };

  const handleDeleteWishlist = async (id: string) => {
    if (!confirm("Hapus wishlist ini?")) return;
    const res = await fetch(`/api/rencana/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    await fetchData();
  };

  const handleStartSavingSubmit = async (e: React.FormEvent, item: WishlistItem) => {
    e.preventDefault();
    setStartSavingError(null);

    const targetAmount = Number(startSavingForm.targetAmount);
    if (!startSavingForm.name.trim() || !targetAmount || targetAmount <= 0) {
      setStartSavingError("Nama target dan nominal wajib diisi.");
      return;
    }

    const res = await fetch("/api/tabungan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: startSavingForm.name,
        targetAmount,
        targetDate: startSavingForm.targetDate || null,
        note: startSavingForm.note || `Target tabungan dari wishlist: ${item.title}`,
        sourceType: "WISHLIST",
        sourcePlanId: item.id,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      setStartSavingError(error.error || "Gagal membuat target tabungan.");
      return;
    }

    setShowStartSavingForId(null);
    setStartSavingForm(initialStartSavingForm());
    await fetchData();
  };

  const handleSavingSubmit = async (e: React.FormEvent, item: WishlistItem) => {
    e.preventDefault();
    setSavingError(null);

    const amount = Number(savingForm.amount);
    if (!amount || amount <= 0 || !savingForm.savingDate || !savingForm.memberId) {
      setSavingError("Nominal, tanggal, dan member wajib diisi.");
      return;
    }

    const res = await fetch(`/api/rencana/${item.id}/savings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        savingDate: savingForm.savingDate,
        memberId: savingForm.memberId,
        note: savingForm.note || null,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      setSavingError(error.error || "Gagal menyimpan cicilan wishlist.");
      return;
    }

    setSavingForm(initialSavingForm());
    setShowSavingFormForId(null);
    await fetchData();
  };

  const handleDeleteSaving = async (itemId: string, savingId: string) => {
    if (!confirm("Hapus catatan cicilan bulan ini?")) return;
    const res = await fetch(`/api/rencana/${itemId}/savings?savingId=${savingId}`, { method: "DELETE" });
    if (!res.ok) return;
    await fetchData();
  };

  return (
    <div className="container-app py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wishlist Cicilan</h1>
          <p className="text-sm text-[color:var(--foreground)]/70">
            Catat keinginan, estimasi biaya, lalu isi nominal cicilan/tabungan manual tiap bulan ke rekening.
            Aplikasi ini hanya mencatat progresnya.
          </p>
        </div>
        <button
          onClick={() => setShowWishlistForm((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <Plus className="h-4 w-4" />
          Tambah Wishlist Cicilan
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-soft space-y-1">
          <p className="text-sm text-[color:var(--foreground)]/60">Total Target Wishlist</p>
          <p className="text-2xl font-bold text-[var(--primary)]">{formatRupiah(totals.target)}</p>
        </div>
        <div className="card-soft space-y-1">
          <p className="text-sm text-[color:var(--foreground)]/60">Total Sudah Dicicil</p>
          <p className="text-2xl font-bold text-[var(--secondary)]">{formatRupiah(totals.saved)}</p>
        </div>
        <div className="card-soft space-y-1">
          <p className="text-sm text-[color:var(--foreground)]/60">Total Sisa</p>
          <p className="text-2xl font-bold text-[var(--accent)]">{formatRupiah(totals.remaining)}</p>
        </div>
      </div>

      {showWishlistForm && (
        <form onSubmit={handleWishlistSubmit} className="card-soft space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={wishlistForm.title}
              onChange={(e) => setWishlistForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Nama wishlist"
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              value={wishlistForm.amount}
              onChange={(e) => setWishlistForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Estimasi biaya total"
              type="number"
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              value={wishlistForm.dueDate}
              onChange={(e) => setWishlistForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              type="date"
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              value={wishlistForm.installmentMonths}
              onChange={(e) => setWishlistForm((prev) => ({ ...prev, installmentMonths: e.target.value }))}
              type="number"
              min="1"
              placeholder="Mau dicicil berapa bulan"
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              value={wishlistForm.monthlySavingAmount}
              onChange={(e) => setWishlistForm((prev) => ({ ...prev, monthlySavingAmount: e.target.value }))}
              type="number"
              min="0"
              placeholder="Target tabung per bulan (opsional)"
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              value={wishlistForm.note}
              onChange={(e) => setWishlistForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Catatan, misal transfer manual ke rekening wishlist"
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <button type="submit" className="rounded-2xl px-4 py-2 font-semibold text-white" style={{ backgroundColor: "var(--primary)" }}>
            Simpan Wishlist
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card-soft text-center py-12">
          <Heart className="mx-auto mb-3 h-12 w-12 opacity-30 text-[var(--foreground)]/40" />
          <p className="font-medium">Belum ada wishlist cicilan</p>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/60">Tambah wishlist dulu, lalu isi cicilan tiap bulan secara manual.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => {
            const linkedGoal = item.savingsGoals[0] || null;
            const progress = linkedGoal
              ? Math.min(linkedGoal.progress, 100)
              : item.amount > 0
                ? Math.min((item.totalSaved / item.amount) * 100, 100)
                : 0;
            const savedAmount = linkedGoal ? linkedGoal.currentAmount : item.totalSaved;
            const remainingAmount = Math.max(0, item.amount - savedAmount);
            return (
              <div key={item.id} className="card-soft space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{item.title}</h2>
                    {item.note && <p className="mt-1 text-sm text-[color:var(--foreground)]/70">{item.note}</p>}
                  </div>
                  <button onClick={() => handleDeleteWishlist(item.id)} className="rounded-xl border p-2" style={{ borderColor: "var(--border)" }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                    <p className="text-xs text-[color:var(--foreground)]/55">Estimasi Biaya</p>
                    <p className="text-lg font-bold text-[var(--primary)]">{formatRupiah(item.amount)}</p>
                  </div>
                  <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                    <p className="text-xs text-[color:var(--foreground)]/55">Sudah Terkumpul</p>
                    <p className="text-lg font-bold text-[var(--secondary)]">{formatRupiah(savedAmount)}</p>
                  </div>
                  <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                    <p className="text-xs text-[color:var(--foreground)]/55\">Sisa</p>
                    <p className="text-lg font-bold text-[var(--accent)]">{formatRupiah(remainingAmount)}</p>
                  </div>
                  <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                    <p className="text-xs text-[color:var(--foreground)]/55\">Target Cicilan/Bulan</p>
                    <p className="text-lg font-bold">
                      {formatRupiah(item.monthlySavingAmount || item.installmentAmount || 0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl p-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      {linkedGoal ? <Target className="h-4 w-4" /> : <PiggyBank className="h-4 w-4" />}
                      {linkedGoal ? "Progress Tabungan" : "Progress Cicilan"}
                    </span>
                    <span className="font-semibold">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                    <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--foreground)]/65">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Target: {formatDate(item.dueDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ReceiptText className="h-3 w-3" />
                      {item.installmentMonths ? `${item.installmentMonths} bulan` : "Cicilan fleksibel"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      Transfer manual, dicatat di app
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {linkedGoal ? (
                    <button
                      onClick={() => window.location.href = `/tabungan`}
                      className="rounded-2xl px-4 py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Kelola Tabungan
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowStartSavingForId(showStartSavingForId === item.id ? null : item.id);
                          setStartSavingForm(initialStartSavingForm(item));
                          setStartSavingError(null);
                        }}
                        className="rounded-2xl px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: "var(--secondary)" }}
                      >
                        <Target className="h-4 w-4 mr-1" />
                        Mulai Tabung
                      </button>
                      <button
                        onClick={() => {
                          setShowSavingFormForId(showSavingFormForId === item.id ? null : item.id);
                          setSavingForm(initialSavingForm());
                          setSavingError(null);
                        }}
                        className="rounded-2xl px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        Isi Cicilan Bulan Ini
                      </button>
                    </>
                  )}
                </div>

                {showStartSavingForId === item.id && (
                  <form onSubmit={(event) => handleStartSavingSubmit(event, item)} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Mulai tabungan dari wishlist ini</p>
                      <p className="text-xs text-[color:var(--foreground)]/65">Wishlist tetap tampil di sini. Progress tabungan akan dibaca dari dashboard Tabungan.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={startSavingForm.name}
                        onChange={(e) => setStartSavingForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Nama target tabungan"
                        className="rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      />
                      <input
                        value={startSavingForm.targetAmount}
                        onChange={(e) => setStartSavingForm((prev) => ({ ...prev, targetAmount: e.target.value }))}
                        type="number"
                        min="1"
                        placeholder="Target nominal tabungan"
                        className="rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      />
                      <input
                        value={startSavingForm.targetDate}
                        onChange={(e) => setStartSavingForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                        type="date"
                        className="rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      />
                      <input
                        value={startSavingForm.note}
                        onChange={(e) => setStartSavingForm((prev) => ({ ...prev, note: e.target.value }))}
                        placeholder="Catatan target tabungan"
                        className="rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                    {startSavingError && <p className="text-sm text-[var(--primary)]">{startSavingError}</p>}
                    <button type="submit" className="rounded-2xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--secondary)" }}>
                      Buat Target Tabungan
                    </button>
                  </form>
                )}

                {showSavingFormForId === item.id && (
                  <form onSubmit={(event) => handleSavingSubmit(event, item)} className="space-y-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={savingForm.amount}
                        onChange={(e) => setSavingForm((prev) => ({ ...prev, amount: e.target.value }))}
                        type="number"
                        min="1"
                        placeholder="Nominal ditabung bulan ini"
                        className="rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      />
                      <input
                        value={savingForm.savingDate}
                        onChange={(e) => setSavingForm((prev) => ({ ...prev, savingDate: e.target.value }))}
                        type="date"
                        className="rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      />
                      <select
                        value={savingForm.memberId}
                        onChange={(e) => setSavingForm((prev) => ({ ...prev, memberId: e.target.value }))}
                        className="rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <option value="">Pilih yang transfer manual</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={savingForm.note}
                        onChange={(e) => setSavingForm((prev) => ({ ...prev, note: e.target.value }))}
                        placeholder="Catatan transfer manual"
                        className="rounded-2xl border px-4 py-3"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                    {savingError && <p className="text-sm text-[var(--primary)]">{savingError}</p>}
                    <button type="submit" className="rounded-2xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--primary)" }}>
                      Simpan Catatan Cicilan
                    </button>
                  </form>
                )}
                {item.savings.length > 0 && (
                  <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm font-semibold">Riwayat Cicilan / Tabungan Manual</p>
                    <div className="space-y-2">
                      {item.savings.map((saving) => (
                        <div key={saving.id} className="flex items-center justify-between rounded-2xl p-3 text-sm" style={{ backgroundColor: "var(--surface-muted)" }}>
                          <div>
                            <p className="font-semibold text-[var(--secondary)]">{formatRupiah(saving.amount)}</p>
                            <p className="text-xs text-[color:var(--foreground)]/60">{formatDate(saving.savingDate)}{saving.note ? ` · ${saving.note}` : ""}</p>
                          </div>
                          <button onClick={() => handleDeleteSaving(item.id, saving.id)} className="rounded-xl border p-2" style={{ borderColor: "var(--border)" }}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
