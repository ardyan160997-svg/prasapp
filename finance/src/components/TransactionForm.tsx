"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, DollarSign, Save, Loader2 } from "lucide-react";

type TransactionFormData = {
  id?: string;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  memberId: string;
  amount: number;
  transactionDate: string;
  note: string | null;
  expenseMode: "NEEDS" | "WANTS" | null;
  paymentMethod: string | null;
};

interface TransactionFormProps {
  initialData?: TransactionFormData | null;
  categories: Array<{
    id: string;
    name: string;
    type: "INCOME" | "EXPENSE";
    icon: string | null;
    color: string | null;
  }>;
  members: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
}

export default function TransactionForm({
  initialData,
  categories,
  members,
  onClose,
  onSubmit,
}: TransactionFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    type: (initialData?.type || "EXPENSE") as "INCOME" | "EXPENSE",
    categoryId: initialData?.categoryId || "",
    amount: initialData?.amount?.toString() || "",
    transactionDate: initialData?.transactionDate?.split("T")[0] || new Date().toISOString().split("T")[0],
    note: initialData?.note || "",
    expenseMode: (initialData?.expenseMode || "NEEDS") as "NEEDS" | "WANTS",
    paymentMethod: initialData?.paymentMethod || "",
    memberId: initialData?.memberId || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryId) newErrors.categoryId = "Kategori wajib dipilih";
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Nominal harus > 0";
    if (!formData.transactionDate) newErrors.transactionDate = "Tanggal wajib diisi";
    if (!formData.memberId) newErrors.memberId = "Member wajib dipilih";
    if (formData.type === "EXPENSE" && !formData.expenseMode) newErrors.expenseMode = "Pilih Kebutuhan/Keinginan";

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
        amount: Number(formData.amount),
        id: initialData?.id,
      });
      router.refresh();
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

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface)] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b px-5 py-4 rounded-t-3xl" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-bold">{isEditing ? "Edit Catatan" : "Tambah Catatan"}</h2>
          <button onClick={onClose} className="p-1 rounded-xl hover:bg-[var(--surface-muted)] transition" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="INCOME"
                checked={formData.type === "INCOME"}
                onChange={() => handleChange("type", "INCOME")}
                className="sr-only"
              />
              <div className={`rounded-2xl p-4 text-center font-semibold transition ${formData.type === "INCOME" ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[color:var(--foreground)]/60 hover:bg-[var(--surface-muted)]"}`} style={{ borderColor: "var(--border)" }}>
                <DollarSign className="h-5 w-5 mx-auto mb-1" />
                Pemasukan
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="EXPENSE"
                checked={formData.type === "EXPENSE"}
                onChange={() => handleChange("type", "EXPENSE")}
                className="sr-only"
              />
              <div className={`rounded-2xl p-4 text-center font-semibold transition ${formData.type === "EXPENSE" ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[color:var(--foreground)]/60 hover:bg-[var(--surface-muted)]"}`} style={{ borderColor: "var(--border)" }}>
                <DollarSign className="h-5 w-5 mx-auto mb-1" />
                Pengeluaran
              </div>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Kategori <span className="text-[var(--primary)]">*</span></label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleChange("categoryId", e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-base transition"
                style={{ borderColor: errors.categoryId ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
              >
                <option value="">Pilih kategori</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-[var(--primary)]">{errors.categoryId}</p>}
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
                  min="1"
                  step="1000"
                />
              </div>
              {errors.amount && <p className="mt-1 text-sm text-[var(--primary)]">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tanggal <span className="text-[var(--primary)]">*</span></label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => handleChange("transactionDate", e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-base transition"
                style={{ borderColor: errors.transactionDate ? "var(--primary)" : "var(--border)", backgroundColor: "var(--surface)" }}
              />
              {errors.transactionDate && <p className="mt-1 text-sm text-[var(--primary)]">{errors.transactionDate}</p>}
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

            {formData.type === "EXPENSE" && (
              <div>
                <label className="block text-sm font-medium mb-1">Jenis <span className="text-[var(--primary)]">*</span></label>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="expenseMode"
                      value="NEEDS"
                      checked={formData.expenseMode === "NEEDS"}
                      onChange={() => handleChange("expenseMode", "NEEDS")}
                      className="sr-only"
                    />
                    <div className={`rounded-2xl p-3 text-center text-sm font-medium transition ${formData.expenseMode === "NEEDS" ? "bg-[var(--secondary-soft)] text-[var(--secondary)]" : "hover:bg-[var(--surface-muted)]"}`} style={{ borderColor: "var(--border)" }}>
                      Kebutuhan
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="expenseMode"
                      value="WANTS"
                      checked={formData.expenseMode === "WANTS"}
                      onChange={() => handleChange("expenseMode", "WANTS")}
                      className="sr-only"
                    />
                    <div className={`rounded-2xl p-3 text-center text-sm font-medium transition ${formData.expenseMode === "WANTS" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "hover:bg-[var(--surface-muted)]"}`} style={{ borderColor: "var(--border)" }}>
                      Keinginan
                    </div>
                  </label>
                </div>
                {errors.expenseMode && <p className="mt-1 text-sm text-[var(--primary)]">{errors.expenseMode}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Metode Bayar</label>
              <input
                type="text"
                value={formData.paymentMethod}
                onChange={(e) => handleChange("paymentMethod", e.target.value)}
                placeholder="Tunai, Transfer, E-Wallet, dll"
                className="w-full rounded-2xl border px-4 py-3 text-base transition"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
              />
            </div>

            <div className="sm:col-span-2">
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
              {isEditing ? "Simpan Perubahan" : "Simpan Catatan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}