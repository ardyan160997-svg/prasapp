"use client";

import { useEffect, useState } from "react";
import type { AdminSession } from "@/types/auth";
import type { BillingDashboardData, BillingStation } from "@/types/billing";

type BillingDashboardProps = {
  session: AdminSession;
};

const statusStyles: Record<BillingStation["status"], string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_USE: "bg-sky-50 text-sky-700 border-sky-200",
  RESERVED: "bg-violet-50 text-violet-700 border-violet-200",
  EXPIRED: "bg-amber-50 text-amber-700 border-amber-200",
  MAINTENANCE: "bg-stone-100 text-stone-700 border-stone-200",
  OUT_OF_SERVICE: "bg-rose-50 text-rose-700 border-rose-200",
};

function currency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelativeMinutes(value: number | null) {
  if (value === null) {
    return "Belum ada sesi";
  }

  if (value < 0) {
    return `${Math.abs(value)} menit lewat`;
  }

  return `${value} menit tersisa`;
}

export default function BillingDashboard({ session }: BillingDashboardProps) {
  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyStationId, setBusyStationId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function hydrateDashboard() {
      try {
        const response = await fetch("/api/admin/billing", {
          cache: "no-store",
        });

        if (ignore) {
          return;
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(payload?.error ?? "Gagal memuat dashboard billing.");
          setLoading(false);
          return;
        }

        const payload = (await response.json()) as BillingDashboardData;
        setData(payload);
        setLoading(false);
      } catch {
        if (ignore) {
          return;
        }

        setError("Dashboard billing belum bisa dijangkau.");
        setLoading(false);
      }
    }

    void hydrateDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  async function runStationAction(
    endpoint: string,
    stationId: string,
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusyStationId(stationId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | BillingDashboardData
        | { error?: string }
        | null;

      if (!response.ok) {
        const err = result && typeof result === 'object' && 'error' in result
          ? ((result as { error?: string }).error ?? 'Aksi billing gagal.')
          : 'Aksi billing gagal.';
        setError(err ?? 'Aksi billing gagal.');
        setBusyStationId(null);
        return;
      }

      setData(result as BillingDashboardData);
      setMessage(successMessage);
      setBusyStationId(null);
    } catch {
      setError("Aksi billing gagal dijangkau.");
      setBusyStationId(null);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-[var(--line)] bg-white/75 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Billing Station
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Dashboard kasir untuk memonitor unit aktif, expired, dan siap pakai.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:rgba(29,20,8,0.72)]">
            Login aktif sebagai <strong>{session.displayName}</strong> dengan role{" "}
            <strong>{session.role}</strong>. Area ini sudah memakai repository DB
            nyata untuk mulai sesi, tambah waktu, dan akhiri sesi per station.
          </p>
        </article>

        <article className="rounded-[28px] border border-[var(--line)] bg-[#1f140d] p-6 text-[#f7ead8]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f0bb8d]">
            Hak Akses Aktif
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {session.permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs"
              >
                {permission}
              </span>
            ))}
          </div>
        </article>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-[var(--line)] bg-white/65 p-10 text-sm">
          Memuat dashboard billing station...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Total Station"
              value={String(data.summary.totalStations)}
              detail={`${data.branch.name} • ${data.branch.code}`}
            />
            <MetricCard
              label="Tersedia"
              value={String(data.summary.availableStations)}
              detail="Siap untuk sesi baru"
            />
            <MetricCard
              label="Dipakai"
              value={String(data.summary.inUseStations)}
              detail="Sedang berjalan"
            />
            <MetricCard
              label="Expired"
              value={String(data.summary.expiredStations)}
              detail="Perlu tindakan kasir"
            />
            <MetricCard
              label="Revenue Aktif"
              value={currency(data.summary.activeSessionsRevenue)}
              detail={`${data.summary.occupiedRatePercent}% okupansi aktif`}
            />
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-dark)]">
                  Grid Station
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                  Status unit bermain per cabang
                </h3>
              </div>
              <p className="text-sm text-[color:rgba(29,20,8,0.68)]">
                Business date {data.branch.businessDate} • Server time{" "}
                {new Date(data.branch.serverTime).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {data.stations.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-8 text-sm text-[color:rgba(29,20,8,0.68)]">
                Belum ada station. Jalankan seed awal untuk mulai billing.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.stations.map((station) => (
                  <article
                    key={station.id}
                    className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5 shadow-[0_12px_24px_rgba(71,43,18,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                          {station.consoleType}
                        </p>
                        <h4 className="mt-2 text-xl font-semibold">{station.code}</h4>
                        <p className="mt-1 text-sm text-[color:rgba(29,20,8,0.65)]">
                          {station.label}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[station.status]}`}
                      >
                        {station.status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm">
                      <InfoRow
                        label="Pelanggan"
                        value={station.currentMemberName ?? "Belum ada"}
                      />
                      <InfoRow
                        label="Durasi"
                        value={
                          station.currentSessionMinutes === null
                            ? "Belum ada sesi"
                            : `${station.currentSessionMinutes} menit`
                        }
                      />
                      <InfoRow
                        label="Sisa waktu"
                        value={formatRelativeMinutes(station.remainingMinutes)}
                      />
                      <InfoRow
                        label="Tagihan berjalan"
                        value={currency(station.pendingAmount)}
                      />
                      <InfoRow
                        label="Update terakhir"
                        value={new Date(station.lastActionAt).toLocaleTimeString(
                          "id-ID",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      />
                    </div>

                    <StationActions
                      station={station}
                      busy={busyStationId === station.id}
                      onStart={(memberName, durationMinutes) =>
                        runStationAction(
                          "/api/admin/billing/start-session",
                          station.id,
                          {
                            stationId: station.id,
                            memberName,
                            durationMinutes,
                          },
                          `Sesi baru dimulai di ${station.code}.`,
                        )
                      }
                      onExtend={(durationMinutes) =>
                        runStationAction(
                          "/api/admin/billing/extend-session",
                          station.id,
                          {
                            stationId: station.id,
                            durationMinutes,
                          },
                          `Waktu sesi ${station.code} berhasil ditambah.`,
                        )
                      }
                      onEnd={() =>
                        runStationAction(
                          "/api/admin/billing/end-session",
                          station.id,
                          {
                            stationId: station.id,
                          },
                          `Sesi di ${station.code} berhasil diakhiri.`,
                        )
                      }
                    />
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function StationActions({
  station,
  busy,
  onStart,
  onExtend,
  onEnd,
}: {
  station: BillingStation;
  busy: boolean;
  onStart: (memberName: string, durationMinutes: number) => Promise<void>;
  onExtend: (durationMinutes: number) => Promise<void>;
  onEnd: () => Promise<void>;
}) {
  const [memberName, setMemberName] = useState("");
  const [startDuration, setStartDuration] = useState("60");
  const [extendDuration, setExtendDuration] = useState("30");

  if (
    station.status === "MAINTENANCE" ||
    station.status === "OUT_OF_SERVICE" ||
    station.status === "RESERVED"
  ) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-stone-50 px-4 py-4 text-sm text-stone-600">
        Station ini tidak dapat dipakai sampai status operasional diubah.
      </div>
    );
  }

  if (station.status === "AVAILABLE") {
    return (
      <div className="mt-5 grid gap-3 rounded-[22px] border border-[var(--line)] bg-[rgba(255,248,235,0.78)] p-4">
        <p className="text-sm font-semibold text-[var(--brand-dark)]">Mulai sesi baru</p>
        <input
          value={memberName}
          onChange={(event) => setMemberName(event.target.value)}
          className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
          placeholder="Nama pelanggan walk-in"
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-2 text-sm">
            Durasi
            <select
              value={startDuration}
              onChange={(event) => setStartDuration(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand)]"
            >
              <option value="30">30 menit</option>
              <option value="60">60 menit</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => onStart(memberName, Number(startDuration))}
            className="self-end rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Memulai..." : "Mulai sesi"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-3 rounded-[22px] border border-[var(--line)] bg-[rgba(255,248,235,0.78)] p-4">
      <p className="text-sm font-semibold text-[var(--brand-dark)]">Aksi sesi aktif</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="grid gap-2 text-sm">
          Tambah waktu
          <select
            value={extendDuration}
            onChange={(event) => setExtendDuration(event.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand)]"
          >
            <option value="30">30 menit</option>
            <option value="60">60 menit</option>
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => onExtend(Number(extendDuration))}
          className="self-end rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? "Memproses..." : "Tambah waktu"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onEnd()}
          className="self-end rounded-full bg-[#1f140d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#362115] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? "Memproses..." : "Akhiri sesi"}
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-[var(--line)] bg-white/75 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-dark)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-[color:rgba(29,20,8,0.62)]">{detail}</p>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[rgba(74,47,17,0.08)] pb-2 last:border-b-0 last:pb-0">
      <span className="text-[color:rgba(29,20,8,0.64)]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
