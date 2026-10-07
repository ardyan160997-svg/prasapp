"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, AlertTriangle, Target, Trash2, Edit, Save, Loader2, X, Flag, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

interface FinancialPlan {
  id: string;
  title: string;
  estimatedAmount: number;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PLANNED" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED";
  note: string | null;
  linkedSavingsGoalId: string | null;
  linkedSavingsGoal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
  } | null;
  daysUntilDue: number;
  createdAt: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  status?: string;
}

interface PlanFormProps {
  initialData?: FinancialPlan | null;
  savingsGoals: SavingsGoal[];
  onClose: () => void;
  onSubmit: (data: {
    id?: string;
    title: string;
    estimatedAmount: number;
    dueDate: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    status: "PLANNED" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED";
    note: string;
    linkedSavingsGoalId: string | null;
  }) => Promise<void>;
}

function PlanForm({ initialData, savingsGoals, onClose, onSubmit }: PlanFormProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    estimatedAmount: initialData?.estimatedAmount || "",
    dueDate:
      initialData?.dueDate?.split("T")[0] ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    priority: initialData?.priority || "MEDIUM",
    status: initialData?.status || "PLANNED",
    note: initialData?.note || "",
    linkedSavingsGoalId: initialData?.linkedSavingsGoalId || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Judul rencana wajib diisi";
    if (!formData.estimatedAmount || Number(formData.estimatedAmount) <= 0) {
      newErrors.estimatedAmount = "Nominal harus > 0";
    }
    if (!formData.dueDate) newErrors.dueDate = "Tanggal wajib diisi";
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
        estimatedAmount: Number(formData.estimatedAmount),
        linkedSavingsGoalId: formData.linkedSavingsGoalId || null,
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
          <h2 className="text-lg font-bold">{isEditing ? "Edit Rencana" : "Tambah Rencana Keuangan"}</h2>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-[var(--surface-muted)] transition" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Judul <span className="text-[var(--primary)]">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Contoh: Beli Mobil Baru, Renovasi Rumah, Dana Pendidikan"
              className="w-full rounded-2xl border px-4 py-3 text-base transition"
              style={{ borderColor: errors.title ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
            />
            {errors.title && <p className="mt-1 text-sm text-[var(--primary)]">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estimasi Biaya <span className="text-[var(--primary)]">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/50">Rp</span>
              <input
                type="number"
                value={formData.estimatedAmount}
                onChange={(e) => handleChange("estimatedAmount", e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border pl-8 pr-4 py-3 text-base transition text-right"
                style={{ borderColor: errors.estimatedAmount ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
                min="1000"
                step="1000"
              />
            </div>
            {errors.estimatedAmount && <p className="mt-1 text-sm text-[var(--primary)]">{errors.estimatedAmount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Jatuh Tempo <span className="text-[var(--primary)]">*</span></label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-base transition"
              style={{ borderColor: errors.dueDate ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
            />
            {errors.dueDate && <p className="mt-1 text-sm text-[var(--primary)]">{errors.dueDate}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Prioritas</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-base transition"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <option value="HIGH">Tinggi</option>
                <option value="MEDIUM">Sedang</option>
                <option value="LOW">Rendah</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-base transition"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <option value="PLANNED">Direncanakan</option>
                <option value="IN_PROGRESS">Sedang Berjalan</option>
                <option value="READY">Siap Eksekusi</option>
                <option value="COMPLETED">Selesai</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Link ke Tabungan (opsional)</label>
            <select
              value={formData.linkedSavingsGoalId}
              onChange={(e) => handleChange("linkedSavingsGoalId", e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-base transition"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            >
              <option value="">— Pilih target tabungan —</option>
              {savingsGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({formatRupiah(g.currentAmount)} / {formatRupiah(g.targetAmount)})
                </option>
              ))}
            </select>
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
              {isEditing ? "Simpan Perubahan" : "Simpan Rencana"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RencanaPageClient() {
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FinancialPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, tabunganRes] = await Promise.all([
        fetch("/api/rencana"),
        fetch("/api/tabungan"),
      ]);
      const [plansData, tabunganData] = await Promise.all([plansRes.json(), tabunganRes.json()]);
      setPlans(plansData.plans || []);
      setSavingsGoals(
        (tabunganData.goals || [])
          .filter((g: SavingsGoal) => g.status === "ACTIVE")
          .map((g: SavingsGoal) => ({
            id: g.id,
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount,
          }))
      );
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: {
    id?: string;
    title: string;
    estimatedAmount: number;
    dueDate: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    status: "PLANNED" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED";
    note: string;
    linkedSavingsGoalId: string | null;
  }) => {
    const method = data.id ? "PUT" : "POST";
    const url = data.id ? `/api/rencana/${data.id}` : "/api/rencana";
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

    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus rencana ini?")) return;
    try {
      const res = await fetch(`/api/rencana/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      await fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus rencana");
    }
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setShowForm(true);
  };

  const handleEditPlan = (plan: FinancialPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const filteredPlans = plans
    .filter((p) => filterStatus === "all" || p.status === filterStatus)
    .filter((p) => filterPriority === "all" || p.priority === filterPriority);

  const priorityColors = {
    HIGH: "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)]",
    MEDIUM: "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]",
    LOW: "bg-[var(--secondary-soft)] text-[var(--secondary)] border-[var(--secondary)]",
  };

  const priorityIcons = {
    HIGH: <Flag className="h-4 w-4" />,
    MEDIUM: <AlertTriangle className="h-4 w-4" />,
    LOW: <Target className="h-4 w-4" />,
  };

  const statusLabels = {
    PLANNED: "Direncanakan",
    IN_PROGRESS: "Sedang Berjalan",
    READY: "Siap Eksekusi",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };

  const statusColors = {
    PLANNED: "bg-[var(--secondary-soft)] text-[var(--secondary)]",
    IN_PROGRESS: "bg-[var(--accent-soft)] text-[var(--accent)]",
    READY: "bg-[var(--primary-soft)] text-[var(--primary)]",
    COMPLETED: "bg-[var(--accent-soft)] text-[var(--accent)]",
    CANCELLED: "bg-[var(--primary-soft)] text-[var(--primary)]",
  };

  const statusIcons = {
    PLANNED: <Clock className="h-3 w-3" />,
    IN_PROGRESS: <AlertCircle className="h-3 w-3" />,
    READY: <Target className="h-3 w-3" />,
    COMPLETED: <CheckCircle className="h-3 w-3" />,
    CANCELLED: <AlertCircle className="h-3 w-3" />,
  };

  return (
    <div className="container-app py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Rencana Keuangan</h1>
            <p className="text-sm text-[color:var(--foreground)]/70">
              Kelola rencana pengeluaran besar dengan prioritas & jatuh tempo
            </p>
          </div>
          <button onClick={handleNewPlan} className="flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: "var(--primary)" }}>
            <Plus className="h-4 w-4" />
            Rencana Baru
          </button>
        </div>

        <div className="card-soft flex flex-wrap gap-2 p-3" style={{ borderColor: "var(--border)" }}>
          <span className="text-sm text-[color:var(--foreground)]/60">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <option value="all">Semua Status</option>
            <option value="PLANNED">Direncanakan</option>
            <option value="IN_PROGRESS">Sedang Berjalan</option>
            <option value="READY">Siap Eksekusi</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <option value="all">Semua Prioritas</option>
            <option value="HIGH">Tinggi</option>
            <option value="MEDIUM">Sedang</option>
            <option value="LOW">Rendah</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="card-soft text-center py-12">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-30 text-[var(--foreground)]/40" />
            <p className="font-medium">Belum ada rencana keuangan</p>
            <p className="text-sm mt-1 text-[color:var(--foreground)]/60">
              Klik &quot;Rencana Baru&quot; untuk mulai merencanakan
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="card-soft space-y-4" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{plan.title}</h3>
                      {plan.note && <p className="text-sm text-[color:var(--foreground)]/60 mt-1">{plan.note}</p>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[plan.priority]}`}>
                      {priorityIcons[plan.priority]}
                      {["Tinggi", "Sedang", "Rendah"][["HIGH", "MEDIUM", "LOW"].indexOf(plan.priority)]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[color:var(--foreground)]/60">Estimasi Biaya</span>
                      <span className="font-semibold text-[var(--primary)]">{formatRupiah(plan.estimatedAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[color:var(--foreground)]/60">Jatuh Tempo</span>
                      <span className={`font-semibold ${plan.daysUntilDue < 0 ? "text-[var(--primary)]" : plan.daysUntilDue <= 7 ? "text-[var(--accent)]" : "text-[var(--secondary)]"}`}>
                        {formatDate(plan.dueDate)}
                        <span className="ml-2 text-xs opacity-75">
                          {plan.daysUntilDue > 0
                            ? `(${plan.daysUntilDue} hari lagi)`
                            : plan.daysUntilDue === 0
                              ? "(HARI INI)"
                              : `(${Math.abs(plan.daysUntilDue)} hari lalu)`}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[color:var(--foreground)]/60">Status</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[plan.status]}`}>
                        {statusIcons[plan.status]}
                        {statusLabels[plan.status]}
                      </span>
                    </div>
                  </div>

                  {plan.linkedSavingsGoal && (
                    <div className="space-y-2 rounded-xl p-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                      <p className="text-xs font-medium text-[color:var(--foreground)]/60 flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Terkait: {plan.linkedSavingsGoal.name}
                      </p>
                      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] transition-all duration-300"
                          style={{ width: `${Math.min((plan.linkedSavingsGoal.currentAmount / plan.linkedSavingsGoal.targetAmount) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[color:var(--foreground)]/60">
                          {formatRupiah(plan.linkedSavingsGoal.currentAmount)} / {formatRupiah(plan.linkedSavingsGoal.targetAmount)}
                        </span>
                        <span className="font-semibold text-[var(--accent)]">
                          {((plan.linkedSavingsGoal.currentAmount / plan.linkedSavingsGoal.targetAmount) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-sm font-medium transition hover:bg-[var(--surface-muted)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-2 rounded-xl border transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                      style={{ borderColor: "var(--border)" }}
                      aria-label="Hapus rencana"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-soft space-y-4">
              <h2 className="text-lg font-semibold">Ringkasan</h2>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1 rounded-xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-sm text-[color:var(--foreground)]/60">Total Rencana</p>
                  <p className="text-xl font-bold">{plans.length}</p>
                </div>
                <div className="space-y-1 rounded-xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-sm text-[color:var(--foreground)]/60">Total Estimasi</p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {formatRupiah(plans.reduce((sum, p) => sum + p.estimatedAmount, 0))}
                  </p>
                </div>
                <div className="space-y-1 rounded-xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-sm text-[color:var(--foreground)]/60">Prioritas Tinggi</p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {plans.filter((p) => p.priority === "HIGH").length}
                  </p>
                </div>
                <div className="space-y-1 rounded-xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <p className="text-sm text-[color:var(--foreground)]/60">Jatuh Tempo ≤ 7 hari</p>
                  <p className="text-xl font-bold text-[var(--accent)]">
                    {plans.filter((p) => p.daysUntilDue >= 0 && p.daysUntilDue <= 7).length}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <PlanForm
          initialData={editingPlan}
          savingsGoals={savingsGoals}
          onClose={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
