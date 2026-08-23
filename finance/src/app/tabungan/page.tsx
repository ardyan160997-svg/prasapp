"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Target, Trash2, Edit, Calendar, ArrowDownRight, Save, Loader2, X } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  currentAmount: number;
  status: string;
  note: string | null;
  progress: number;
  entries: Array<{
    id: string;
    amount: number;
    entryDate: string;
    note: string | null;
    memberId: string;
  }>;
}

interface Member {
  id: string;
  name: string;
}

interface SavingsFormProps {
  initialData?: SavingsGoal | null;
  onClose: () => void;
  onSubmit: (data: {
    id?: string;
    name: string;
    targetAmount: number;
    targetDate: string | null;
    note: string;
  }) => Promise<void>;
}

function SavingsForm({ initialData, onClose, onSubmit }: SavingsFormProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    targetAmount: initialData?.targetAmount || "",
    targetDate: initialData?.targetDate?.split("T")[0] || "",
    note: initialData?.note || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nama target wajib diisi";
    if (!formData.targetAmount || Number(formData.targetAmount) <= 0) newErrors.targetAmount = "Target nominal harus > 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        targetAmount: Number(formData.targetAmount),
        targetDate: formData.targetDate || null,
        id: initialData?.id,
      });
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface)] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b px-5 py-4 rounded-t-3xl" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold">{isEditing ? "Edit Target" : "Tambah Target Tabungan"}</h2>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-[var(--surface-muted)] transition" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Target <span className="text-[var(--primary)]">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Contoh: Dana Darurat, Liburan Keluarga, Beli Motor"
              className="w-full rounded-2xl border px-4 py-3 text-base transition"
              style={{ borderColor: errors.name ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
            />
            {errors.name && <p className="mt-1 text-sm text-[var(--primary)]">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Nominal <span className="text-[var(--primary)]">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/50">Rp</span>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => handleChange("targetAmount", e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border pl-8 pr-4 py-3 text-base transition text-right"
                style={{ borderColor: errors.targetAmount ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
                min="1000"
                step="1000"
              />
            </div>
            {errors.targetAmount && <p className="mt-1 text-sm text-[var(--primary)]">{errors.targetAmount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Tanggal (opsional)</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => handleChange("targetDate", e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-base transition"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catatan</label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              className="w-full rounded-2xl border px-4 py-3 text-base transition resize-none"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border py-3 font-semibold transition hover:bg-[var(--surface-muted)]"
              style={{ borderColor: "var(--border)" }}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {isEditing ? "Simpan Perubahan" : "Simpan Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SetoranFormProps {
  goal: SavingsGoal;
  members: Member[];
  onClose: () => void;
  onSubmit: (data: {
    goalId: string;
    amount: number;
    entryDate: string;
    note: string;
    memberId: string;
  }) => Promise<void>;
}

function SetoranForm({ goal, members, onClose, onSubmit }: SetoranFormProps) {
  const [formData, setFormData] = useState({
    amount: "",
    entryDate: new Date().toISOString().split("T")[0],
    note: "",
    memberId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Nominal harus > 0";
    if (!formData.entryDate) newErrors.entryDate = "Tanggal wajib diisi";
    if (!formData.memberId) newErrors.memberId = "Member wajib dipilih";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        goalId: goal.id,
        amount: Number(formData.amount),
        entryDate: formData.entryDate,
        note: formData.note,
        memberId: formData.memberId,
      });
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface)] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b px-5 py-4 rounded-t-3xl" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold">Tambah Setoran ke {goal.name}</h2>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-[var(--surface-muted)] transition" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2 rounded-xl p-3" style={{ backgroundColor: "var(--surface-muted)" }}>
            <p className="text-sm text-[color:var(--foreground)]/60">Progress Saat Ini</p>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>{formatRupiah(goal.currentAmount)} / {formatRupiah(goal.targetAmount)}</span>
              <span className="font-semibold text-[var(--accent)]">{goal.progress.toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nominal <span className="text-[var(--primary)]">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/50">Rp</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border pl-8 pr-4 py-3 text-base transition text-right"
                style={{ borderColor: errors.amount ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
                min="1000"
                step="1000"
              />
            </div>
            {errors.amount && <p className="mt-1 text-sm text-[var(--primary)]">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tanggal <span className="text-[var(--primary)]">*</span></label>
            <input
              type="date"
              value={formData.entryDate}
              onChange={(e) => handleChange("entryDate", e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-base transition"
              style={{ borderColor: errors.entryDate ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
            />
            {errors.entryDate && <p className="mt-1 text-sm text-[var(--primary)]">{errors.entryDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dicatat oleh <span className="text-[var(--primary)]">*</span></label>
            <select
              value={formData.memberId}
              onChange={(e) => handleChange("memberId", e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-base transition"
              style={{ borderColor: errors.memberId ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
            >
              <option value="">Pilih member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {errors.memberId && <p className="mt-1 text-sm text-[var(--primary)]">{errors.memberId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catatan</label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              className="w-full rounded-2xl border px-4 py-3 text-base transition resize-none"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border py-3 font-semibold transition hover:bg-[var(--surface-muted)]"
              style={{ borderColor: "var(--border)" }}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Tambah Setoran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TabunganPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [showSetoranForm, setShowSetoranForm] = useState(false);
  const [selectedGoalForSetoran, setSelectedGoalForSetoran] = useState<SavingsGoal | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [goalsRes, membersRes] = await Promise.all([
        fetch("/api/tabungan"),
        fetch("/api/ringkasan"),
      ]);
      const [goalsData, ringkasanData] = await Promise.all([goalsRes.json(), membersRes.json()]);
      setGoals(goalsData.goals || []);
      setMembers(ringkasanData.members || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleGoalSubmit = async (data: {
    id?: string;
    name: string;
    targetAmount: number;
    targetDate: string | null;
    note: string;
  }) => {
    const method = data.id ? "PUT" : "POST";
    const url = data.id ? `/api/tabungan/${data.id}` : "/api/tabungan";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...body } = data;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Gagal menyimpan");
    }
  };

  const handleGoalDelete = async (id: string) => {
    if (!confirm("Hapus target tabungan ini?")) return;
    try {
      const res = await fetch(`/api/tabungan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus target");
    }
  };

  const handleSetoranSubmit = async (data: {
    goalId: string;
    amount: number;
    entryDate: string;
    note: string;
    memberId: string;
  }) => {
    const res = await fetch(`/api/tabungan/${data.goalId}/setoran`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Gagal menambah setoran");
    }
  };

  const handleSetoranDelete = async (goalId: string, entryId: string) => {
    if (!confirm("Hapus setoran ini?")) return;
    try {
      const res = await fetch(`/api/tabungan/${goalId}/setoran?entryId=${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus setoran");
    }
  };

  const handleNewGoal = () => {
    setEditingGoal(null);
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleAddSetoran = (goal: SavingsGoal) => {
    setSelectedGoalForSetoran(goal);
    setShowSetoranForm(true);
  };

  const statusLabels = {
    ACTIVE: "Aktif",
    COMPLETED: "Selesai",
    PAUSED: "Dijeda",
    CANCELLED: "Dibatalkan",
  };

  const statusColors = {
    ACTIVE: "bg-[var(--secondary-soft)] text-[var(--secondary)]",
    COMPLETED: "bg-[var(--accent-soft)] text-[var(--accent)]",
    PAUSED: "bg-[var(--accent-soft)] text-[var(--accent)]",
    CANCELLED: "bg-[var(--primary-soft)] text-[var(--primary)]",
  };

  return (
    <div className="container-app py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tabungan</h1>
            <p className="text-sm text-[color:var(--foreground)]/70">
              Kelola target tabungan per tujuan
            </p>
          </div>
          <button onClick={handleNewGoal} className="flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: "var(--primary)" }}>
            <Plus className="h-4 w-4" />
            Target Baru
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : goals.length === 0 ? (
          <div className="card-soft text-center py-12">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-30 text-[var(--foreground)]/40" />
            <p className="font-medium">Belum ada target tabungan</p>
            <p className="text-sm mt-1 text-[color:var(--foreground)]/60">
              Klik &quot;Target Baru&quot; untuk mulai menabung
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <div key={goal.id} className="card-soft space-y-4" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{goal.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[goal.status as keyof typeof statusColors]}`}>
                          {statusLabels[goal.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                      {goal.note && <p className="text-sm text-[color:var(--foreground)]/60">{goal.note}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--foreground)]/60">Target</span>
                      <span className="font-semibold text-[var(--accent)]">{formatRupiah(goal.targetAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--foreground)]/60">Terkumpul</span>
                      <span className="font-semibold text-[var(--secondary)]">{formatRupiah(goal.currentAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--foreground)]/60">Sisa</span>
                      <span className="font-semibold text-[var(--primary)]">{formatRupiah(Math.max(0, goal.targetAmount - goal.currentAmount))}</span>
                    </div>
                  </div>

                  <div className="h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[color:var(--foreground)]/60">{goal.progress.toFixed(1)}% tercapai</span>
                    {goal.targetDate && (
                      <span className="flex items-center gap-1" style={{ color: goal.progress >= 100 ? "var(--secondary)" : "var(--foreground)" }}>
                        <Calendar className="h-3 w-3" />
                        {formatDate(goal.targetDate)}
                      </span>
                    )}
                  </div>

                  {goal.entries.length > 0 && (
                    <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                      <p className="text-xs font-medium text-[color:var(--foreground)]/60 mb-2">Riwayat Setoran</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {goal.entries.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ backgroundColor: "var(--surface-muted)" }}>
                            <div>
                              <span className="font-medium text-[var(--secondary)]">{formatRupiah(entry.amount)}</span>
                              <span className="text-[color:var(--foreground)]/60 ml-2">{formatDate(entry.entryDate)}</span>
                            </div>
                            <button
                              onClick={() => handleSetoranDelete(goal.id, entry.id)}
                              className="p-1 hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] rounded transition"
                              aria-label="Hapus setoran"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {goal.entries.length > 5 && (
                          <p className="text-xs text-center text-[color:var(--foreground)]/50">+{goal.entries.length - 5} setoran lainnya</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => handleAddSetoran(goal)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-sm font-medium transition hover:bg-[var(--surface-muted)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <ArrowDownRight className="h-3 w-3" />
                      Setor
                    </button>
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="p-2 rounded-xl border transition hover:bg-[var(--surface-muted)]"
                      style={{ borderColor: "var(--border)" }}
                      aria-label="Edit target"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleGoalDelete(goal.id)}
                      className="p-2 rounded-xl border transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      style={{ borderColor: "var(--border)" }}
                      aria-label="Hapus target"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-soft space-y-4">
              <h2 className="text-lg font-semibold">Ringkasan Total</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1 rounded-xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-sm text-[color:var(--foreground)]/60">Total Target</p>
                  <p className="text-xl font-bold text-[var(--accent)]">
                    {formatRupiah(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
                  </p>
                </div>
                <div className="space-y-1 rounded-xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-sm text-[color:var(--foreground)]/60">Total Terkumpul</p>
                  <p className="text-xl font-bold text-[var(--secondary)]">
                    {formatRupiah(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
                  </p>
                </div>
                <div className="space-y-1 rounded-xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-sm text-[color:var(--foreground)]/60">Total Kekurangan</p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {formatRupiah(goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.currentAmount), 0))}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showGoalForm && (
        <SavingsForm
          initialData={editingGoal}
          onClose={() => {
            setShowGoalForm(false);
            setEditingGoal(null);
          }}
          onSubmit={handleGoalSubmit}
        />
      )}

      {showSetoranForm && selectedGoalForSetoran && (
        <SetoranForm
          goal={selectedGoalForSetoran}
          members={members}
          onClose={() => {
            setShowSetoranForm(false);
            setSelectedGoalForSetoran(null);
          }}
          onSubmit={handleSetoranSubmit}
        />
      )}
    </div>
  );
}