"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, Users, Tags, Download } from "lucide-react";

type Member = { id: string; name: string };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE"; icon: string | null; color: string | null };
type RingkasanData = {
  members: Member[];
  categories: Category[];
};

export default function PengaturanPage() {
  const [data, setData] = useState<RingkasanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ringkasan");
      const result = await res.json();
      setData({ members: result.members || [], categories: result.categories || [] });
    } catch (error) {
      console.error("Fetch pengaturan error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedCategories = useMemo(() => ({
    income: (data?.categories || []).filter((category) => category.type === "INCOME"),
    expense: (data?.categories || []).filter((category) => category.type === "EXPENSE"),
  }), [data]);

  return (
    <div className="container-app py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-[color:var(--foreground)]/70">Lihat anggota keluarga, kategori pencatatan, dan info dasar aplikasi.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card-soft space-y-2">
              <Users className="h-5 w-5 text-[var(--primary)]" />
              <p className="text-sm text-[color:var(--foreground)]/60">Anggota Aktif</p>
              <p className="text-2xl font-bold">{data?.members.length || 0}</p>
            </div>
            <div className="card-soft space-y-2">
              <Tags className="h-5 w-5 text-[var(--accent)]" />
              <p className="text-sm text-[color:var(--foreground)]/60">Kategori Pemasukan</p>
              <p className="text-2xl font-bold">{groupedCategories.income.length}</p>
            </div>
            <div className="card-soft space-y-2">
              <Settings className="h-5 w-5 text-[var(--secondary)]" />
              <p className="text-sm text-[color:var(--foreground)]/60">Kategori Pengeluaran</p>
              <p className="text-2xl font-bold">{groupedCategories.expense.length}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-soft space-y-4">
              <h2 className="text-lg font-semibold">Anggota Keluarga</h2>
              <div className="space-y-2">
                {(data?.members || []).map((member) => (
                  <div key={member.id} className="rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                    {member.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="card-soft space-y-4">
              <h2 className="text-lg font-semibold">Kategori Pemasukan</h2>
              <div className="space-y-2">
                {groupedCategories.income.map((category) => (
                  <div key={category.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                    <span>{category.icon || "•"}</span>
                    <span>{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card-soft space-y-4">
            <h2 className="text-lg font-semibold">Kategori Pengeluaran</h2>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {groupedCategories.expense.map((category) => (
                <div key={category.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--surface-muted)" }}>
                  <span>{category.icon || "•"}</span>
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-soft flex items-start gap-3">
            <Download className="h-5 w-5 text-[var(--primary)] mt-1" />
            <div>
              <h2 className="font-semibold">Info</h2>
              <p className="text-sm text-[color:var(--foreground)]/70">Data utama sudah tersimpan di Vercel + Supabase. Untuk perubahan anggota, kategori, atau export detail, tahap berikutnya bisa ditambah dari halaman ini.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
