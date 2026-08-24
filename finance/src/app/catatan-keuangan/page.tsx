"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Filter, X, DollarSign, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import TransactionForm from "@/components/TransactionForm";

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

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  memberId: string;
  amount: number;
  transactionDate: string;
  note: string | null;
  expenseMode: "NEEDS" | "WANTS" | null;
  paymentMethod: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: "INCOME" | "EXPENSE";
  };
  member: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string | null;
  color: string | null;
}

interface Member {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CatatanKeuanganPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    categoryId: "",
    memberId: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Refs to track if initial data has been loaded
  const initialLoadRef = useRef(true);
  const categoriesLoadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filters.type) params.set("type", filters.type);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.memberId) params.set("memberId", filters.memberId);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await fetch(`/api/catatan-keuangan?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchCategoriesAndMembers = useCallback(async () => {
    try {
      const catsRes = await fetch("/api/ringkasan");
      const ringkasan = await catsRes.json();
      setCategories(ringkasan.categories || []);
      setMembers(ringkasan.members || []);
      categoriesLoadedRef.current = true;
    } catch (error) {
      console.error("Fetch categories/members error:", error);
    }
  }, []);

  // Initial load - runs once on mount
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      fetchCategoriesAndMembers();
      fetchData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // Fetch categories/members when needed (e.g., after form submit)
  useEffect(() => {
    if (!categoriesLoadedRef.current) {
      fetchCategoriesAndMembers();
    }
  }, [fetchCategoriesAndMembers]);

  const handleSubmit = async (data: TransactionFormData) => {
    const method = data.id ? "PUT" : "POST";
    const url = data.id ? `/api/catatan-keuangan/${data.id}` : "/api/catatan-keuangan";
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

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    try {
      const res = await fetch(`/api/catatan-keuangan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus catatan");
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ type: "", categoryId: "", memberId: "", startDate: "", endDate: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const incomeTotal = transactions.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = transactions.filter((t) => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);

  const typeLabels = { INCOME: "Pemasukan", EXPENSE: "Pengeluaran" };
  const modeLabels = { NEEDS: "Kebutuhan", WANTS: "Keinginan" };
  const modeColors = { NEEDS: "bg-[var(--secondary-soft)] text-[var(--secondary)]", WANTS: "bg-[var(--accent-soft)] text-[var(--accent)]" };

  return (
    <div className="container-app py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Catatan Keuangan</h1>
            <p className="text-sm text-[color:var(--foreground)]/70">
              Kelola pemasukan, pengeluaran (kebutuhan & keinginan)
            </p>
          </div>
          <button onClick={handleNew} className="flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: "var(--primary)" }}>
            <Plus className="h-4 w-4" />
            Tambah Catatan
          </button>
        </div>

        <div className="card-soft space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
              <p className="text-sm text-[color:var(--foreground)]/60">Total Pemasukan</p>
              <p className="text-2xl font-bold text-[var(--secondary)]">{formatRupiah(incomeTotal)}</p>
            </div>
            <div className="space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
              <p className="text-sm text-[color:var(--foreground)]/60">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-[var(--primary)]">{formatRupiah(expenseTotal)}</p>
            </div>
            <div className="space-y-2 rounded-2xl p-4" style={{ backgroundColor: "var(--surface-muted)" }}>
              <p className="text-sm text-[color:var(--foreground)]/60">Net Flow</p>
              <p className={`text-2xl font-bold ${incomeTotal - expenseTotal >= 0 ? "text-[var(--secondary)]" : "text-[var(--primary)]"}`}>
                {formatRupiah(incomeTotal - expenseTotal)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-muted)]" style={{ borderColor: "var(--border)" }}>
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs text-white">{Object.values(filters).filter((v) => v).length}</span>}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-muted)]" style={{ borderColor: "var(--border)" }}>
                <X className="h-4 w-4 mr-1" />
                Bersihkan
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-slide-down">
              <div>
                <label className="block text-sm font-medium mb-1">Jenis</label>
                <select value={filters.type} onChange={(e) => handleFilterChange("type", e.target.value)} className="w-full rounded-2xl border px-4 py-2 text-sm transition" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                  <option value="">Semua</option>
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select value={filters.categoryId} onChange={(e) => handleFilterChange("categoryId", e.target.value)} className="w-full rounded-2xl border px-4 py-2 text-sm transition" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                  <option value="">Semua</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Member</label>
                <select value={filters.memberId} onChange={(e) => handleFilterChange("memberId", e.target.value)} className="w-full rounded-2xl border px-4 py-2 text-sm transition" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                  <option value="">Semua</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} className="w-full rounded-2xl border px-4 py-2 text-sm transition" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Akhir</label>
                <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} className="w-full rounded-2xl border px-4 py-2 text-sm transition" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }} />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-[color:var(--foreground)]/60">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada catatan</p>
              <p className="text-sm mt-1">Klik &quot;Tambah Catatan&quot; untuk mulai mencatat</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[color:var(--foreground)]/50 border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="pb-2 pr-4">Tanggal</th>
                      <th className="pb-2 pr-4">Jenis</th>
                      <th className="pb-2 pr-4">Kategori</th>
                      <th className="pb-2 pr-4">Member</th>
                      <th className="pb-2 pr-4 text-right">Nominal</th>
                      <th className="pb-2 pr-4">Catatan</th>
                      <th className="pb-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b hover:bg-[var(--surface-muted)] transition" style={{ borderColor: "var(--border)" }}>
                        <td className="py-3 pr-4 whitespace-nowrap">{formatDate(tx.transactionDate)}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tx.type === "INCOME" ? "bg-[var(--secondary-soft)] text-[var(--secondary)]" : "bg-[var(--primary-soft)] text-[var(--primary)]"}`}>
                            <DollarSign className="h-3 w-3" />
                            {typeLabels[tx.type]}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs" style={{ backgroundColor: tx.category.color ? `${tx.category.color}20` : "var(--surface-muted)", color: tx.category.color || "var(--foreground)", borderColor: tx.category.color ? `${tx.category.color}40` : "var(--border)" }}>
                            {tx.category.icon ? tx.category.icon : ""} {tx.category.name}
                            {tx.expenseMode && (
                              <span className={`ml-1 rounded px-1 py-0.5 text-[10px] font-medium ${modeColors[tx.expenseMode]}`}>
                                {modeLabels[tx.expenseMode]}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{tx.member.name}</td>
                        <td className="py-3 pr-4 text-right font-mono font-semibold" style={{ color: tx.type === "INCOME" ? "var(--secondary)" : "var(--primary)" }}>
                          {tx.type === "INCOME" ? "+" : "-"}{formatRupiah(tx.amount)}
                        </td>
                        <td className="py-3 pr-4 text-[color:var(--foreground)]/70 truncate max-w-[200px]">{tx.note || "—"}</td>
                        <td className="py-3 flex items-center gap-2">
                          <button onClick={() => handleEdit(tx)} className="p-2 rounded-xl hover:bg-[var(--surface-muted)] transition" aria-label="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(tx.id)} className="p-2 rounded-xl hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition" aria-label="Hapus">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm text-[color:var(--foreground)]/60">
                    Halaman {pagination.page} dari {pagination.totalPages} &bull; Total {pagination.total} catatan
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-xl border disabled:opacity-30 disabled:cursor-not-allowed transition hover:bg-[var(--surface-muted)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 rounded-xl border disabled:opacity-30 disabled:cursor-not-allowed transition hover:bg-[var(--surface-muted)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && (
        <TransactionForm
          key={editingTransaction?.id ?? "new"}
          initialData={editingTransaction}
          categories={categories}
          members={members}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}