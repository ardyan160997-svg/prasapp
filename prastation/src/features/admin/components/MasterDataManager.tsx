"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminSession } from "@/types/auth";
import type {
  AdminUserRecord,
  AuditLogFilterOptions,
  AuditLogRecord,
  MasterDataSnapshot,
  MemberRecord,
  PaginatedResult,
  PermissionMatrixPayload,
  PricingRuleRecord,
  StationRecord,
} from "@/types/master-data";

type Props = {
  session: AdminSession;
};

const defaultBranchId = "11111111-1111-1111-1111-111111111111";

type SubmitResult =
  | MasterDataSnapshot
  | PaginatedResult<AdminUserRecord>
  | PaginatedResult<StationRecord>
  | PaginatedResult<MemberRecord>
  | PaginatedResult<PricingRuleRecord>
  | PaginatedResult<AuditLogRecord>
  | PermissionMatrixPayload
  | { error?: string }
  | null;

export default function MasterDataManager({ session }: Props) {
  const [data, setData] = useState<MasterDataSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const response = await fetch("/api/admin/master-data", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | MasterDataSnapshot
          | { error?: string }
          | null;

        if (ignore) {
          return;
        }

        if (!response.ok) {
          setError(getErrorMessage(payload, "Gagal memuat master data."));
        } else {
          setData(payload as MasterDataSnapshot);
        }
      } catch {
        if (!ignore) {
          setError("Master data belum bisa dijangkau.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  async function submit(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: unknown,
  ) {
    setError(null);
    setMessage(null);

    const response = await fetch(endpoint, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json().catch(() => null)) as SubmitResult;

    if (!response.ok) {
      setError(getErrorMessage(payload, "Permintaan gagal."));
      return null;
    }

    setMessage("Data berhasil diperbarui.");
    return payload;
  }

  if (loading) {
    return (
      <section className="rounded-[28px] border border-[var(--line)] bg-white/70 p-6 text-sm">
        Memuat master data...
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Master data kosong."}
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Master Data & Admin
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Kelola akun admin, station, member, pricing, dan jejak aktivitas.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[color:rgba(29,20,8,0.72)]">
          Login aktif sebagai <strong>{session.displayName}</strong>. Owner/admin bisa
          mengelola akses tim, reset password, permission matrix, dan ekspor audit log
          langsung dari portal.
        </p>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {session.permissions.includes("admin_users:view") ? (
          <AdminUsersPanel
            session={session}
            adminUsers={data.adminUsers}
            branches={data.branches}
            onChanged={async (next) => setData({ ...data, adminUsers: next })}
            submit={submit}
          />
        ) : null}
        {session.permissions.includes("audit_logs:view") ? (
          <AuditLogsPanel
            initialAuditLogs={data.auditLogs}
            filterOptions={data.auditLogFilterOptions}
          />
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {session.permissions.includes("stations:view") ? (
          <StationPanel
            session={session}
            stations={data.stations}
            onChanged={async (next) => setData({ ...data, stations: next })}
            submit={submit}
          />
        ) : null}
        {session.permissions.includes("members:view") ? (
          <MemberPanel
            session={session}
            members={data.members}
            onChanged={async (next) => setData({ ...data, members: next })}
            submit={submit}
          />
        ) : null}
        {session.permissions.includes("pricing:view") ? (
          <PricingPanel
            session={session}
            pricingRules={data.pricingRules}
            onChanged={async (next) => setData({ ...data, pricingRules: next })}
            submit={submit}
          />
        ) : null}
      </div>
    </section>
  );
}

function AdminUsersPanel({
  session,
  adminUsers,
  branches,
  submit,
  onChanged,
}: {
  session: AdminSession;
  adminUsers: PaginatedResult<AdminUserRecord>;
  branches: { id: string; code: string; name: string }[];
  submit: (endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown) => Promise<SubmitResult>;
  onChanged: (adminUsers: PaginatedResult<AdminUserRecord>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    branchId: defaultBranchId,
    username: "",
    displayName: "",
    role: "CASHIER",
    password: "",
    isActive: true,
  });
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [matrix, setMatrix] = useState<PermissionMatrixPayload | null>(null);
  const [matrixScope, setMatrixScope] = useState<string>("global");

  async function loadMatrix(userId: string) {
    const response = await fetch(`/api/admin/admin-users/${userId}/permissions`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as PermissionMatrixPayload;
    setMatrix(payload);
  }

  return (
    <PanelCard title="Admin Users">
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await submit("/api/admin/admin-users", "POST", form);
          if (isPaginatedAdminUsers(result)) {
            await onChanged(result);
            setForm({ ...form, username: "", displayName: "", password: "" });
          }
        }}
      >
        <TextInput label="Username" value={form.username} onChange={(value) => setForm({ ...form, username: value })} />
        <TextInput label="Nama tampilan" value={form.displayName} onChange={(value) => setForm({ ...form, displayName: value })} />
        <SelectInput label="Role" value={form.role} options={["OWNER_ADMIN", "CASHIER"]} onChange={(value) => setForm({ ...form, role: value })} />
        <TextInput label="Password awal" value={form.password} onChange={(value) => setForm({ ...form, password: value })} type="password" />
        <button type="submit" className="rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white">
          Tambah admin user
        </button>
      </form>

      <SimpleList
        items={adminUsers.items.map((item) => ({
          id: item.id,
          title: `${item.displayName} • ${item.username}`,
          subtitle: `${item.role} • ${item.isActive ? "Aktif" : "Nonaktif"}`,
          disabledDelete: item.id === session.userId,
          extraActions: [
            {
              label: "Permissions",
              onClick: async () => {
                setSelectedUser(item);
                setMatrixScope("global");
                await loadMatrix(item.id);
              },
            },
            {
              label: "Reset password",
              onClick: async () => {
                const password = window.prompt(`Password baru untuk ${item.username}`);
                if (!password) {
                  return;
                }
                if (!window.confirm(`Reset password untuk ${item.username}?`)) {
                  return;
                }
                const result = await submit(
                  `/api/admin/admin-users/${item.id}/reset-password`,
                  "POST",
                  { password },
                );
                if (isPaginatedAdminUsers(result)) {
                  await onChanged(result);
                }
              },
            },
          ],
          onEdit: async () => {
            const displayName = window.prompt("Nama tampilan admin", item.displayName);
            if (!displayName) return;
            const nextRole =
              window.prompt("Role admin (OWNER_ADMIN/CASHIER)", item.role) ?? item.role;
            const isActive =
              item.id === session.userId
                ? item.isActive
                : window.confirm("Biarkan akun ini tetap aktif?") ? true : false;

            if (!window.confirm(`Simpan perubahan untuk ${item.username}?`)) {
              return;
            }

            const result = await submit(`/api/admin/admin-users/${item.id}`, "PUT", {
              branchId: item.branchId,
              username: item.username,
              displayName,
              role: nextRole,
              isActive,
            });
            if (isPaginatedAdminUsers(result)) {
              await onChanged(result);
            }
          },
          onDelete: async () => {
            if (!window.confirm(`Hapus admin user ${item.username}?`)) {
              return;
            }
            const result = await submit(`/api/admin/admin-users/${item.id}`, "DELETE");
            if (isPaginatedAdminUsers(result)) {
              await onChanged(result);
            }
          },
        }))}
      />

      <PaginationControls
        page={adminUsers.page}
        totalPages={adminUsers.totalPages}
        onChange={async (page) => {
          const response = await fetch(
            `/api/admin/admin-users?page=${page}&pageSize=${adminUsers.pageSize}`,
            { cache: "no-store" },
          );
          const payload = (await response.json()) as PaginatedResult<AdminUserRecord>;
          await onChanged(payload);
        }}
      />

      {selectedUser && matrix ? (
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Permission Matrix</p>
              <p className="text-sm text-[color:rgba(29,20,8,0.68)]">
                {selectedUser.displayName} • {selectedUser.username}
              </p>
            </div>
            <SelectInput
              label="Scope"
              value={matrixScope}
              options={[
                "global",
                ...branches.map((branch) => branch.id),
              ]}
              labels={Object.fromEntries(
                branches.map((branch) => [branch.id, `${branch.name} (${branch.code})`]),
              )}
              onChange={setMatrixScope}
            />
          </div>
          <div className="mt-4 grid gap-3">
            {matrix.permissions.map((permission) => {
              const override = matrix.overrides.find(
                (item) =>
                  item.permission === permission &&
                  (matrixScope === "global"
                    ? item.branchId === null
                    : item.branchId === matrixScope),
              );

              return (
                <div key={permission} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
                  <span className="text-sm font-medium">{permission}</span>
                  <select
                    value={override?.effect ?? "DEFAULT"}
                    onChange={(event) => {
                      const effect = event.target.value as "ALLOW" | "DENY" | "DEFAULT";
                      setMatrix((current) => {
                        if (!current) return current;
                        const filtered = current.overrides.filter(
                          (item) =>
                            !(
                              item.permission === permission &&
                              ((matrixScope === "global" && item.branchId === null) ||
                                item.branchId === matrixScope)
                            ),
                        );

                        if (effect === "DEFAULT") {
                          return { ...current, overrides: filtered };
                        }

                        return {
                          ...current,
                          overrides: [
                            ...filtered,
                            {
                              id: `${permission}-${matrixScope}`,
                              userId: selectedUser.id,
                              branchId: matrixScope === "global" ? null : matrixScope,
                              permission,
                              effect,
                            },
                          ],
                        };
                      });
                    }}
                    className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
                  >
                    <option value="DEFAULT">Default</option>
                    <option value="ALLOW">Allow</option>
                    <option value="DENY">Deny</option>
                  </select>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
              onClick={async () => {
                if (!window.confirm(`Simpan permission matrix untuk ${selectedUser.username}?`)) {
                  return;
                }
                const response = await fetch(
                  `/api/admin/admin-users/${selectedUser.id}/permissions`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      entries: matrix.overrides.map((item) => ({
                        branchId: item.branchId,
                        permission: item.permission,
                        effect: item.effect,
                      })),
                    }),
                  },
                );
                if (response.ok) {
                  const payload = (await response.json()) as PermissionMatrixPayload;
                  setMatrix(payload);
                }
              }}
            >
              Simpan matrix
            </button>
            <button
              type="button"
              className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold"
              onClick={() => {
                setSelectedUser(null);
                setMatrix(null);
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </PanelCard>
  );
}

function AuditLogsPanel({
  initialAuditLogs,
  filterOptions,
}: {
  initialAuditLogs: PaginatedResult<AuditLogRecord>;
  filterOptions: AuditLogFilterOptions;
}) {
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [filters, setFilters] = useState({
    actorUserId: "",
    action: "",
    entityType: "",
    dateFrom: "",
    dateTo: "",
  });

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    return `/api/admin/audit-logs/export?${params.toString()}`;
  }, [filters]);

  async function loadPage(page: number) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    params.set("page", String(page));
    params.set("pageSize", String(auditLogs.pageSize));
    const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as PaginatedResult<AuditLogRecord>;
    setAuditLogs(payload);
  }

  return (
    <PanelCard title="Audit Log">
      <div className="grid gap-3 md:grid-cols-2">
        <SelectInput
          label="Actor"
          value={filters.actorUserId}
          options={["", ...filterOptions.actors.map((actor) => actor.id)]}
          labels={Object.fromEntries(
            filterOptions.actors.map((actor) => [actor.id, actor.label]),
          )}
          onChange={(value) => setFilters({ ...filters, actorUserId: value })}
        />
        <SelectInput
          label="Action"
          value={filters.action}
          options={["", ...filterOptions.actions]}
          onChange={(value) => setFilters({ ...filters, action: value })}
        />
        <SelectInput
          label="Entity type"
          value={filters.entityType}
          options={["", ...filterOptions.entityTypes]}
          onChange={(value) => setFilters({ ...filters, entityType: value })}
        />
        <TextInput
          label="Date from"
          value={filters.dateFrom}
          onChange={(value) => setFilters({ ...filters, dateFrom: value })}
          type="date"
        />
        <TextInput
          label="Date to"
          value={filters.dateTo}
          onChange={(value) => setFilters({ ...filters, dateTo: value })}
          type="date"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void loadPage(1)}
          className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold"
        >
          Terapkan filter
        </button>
        <a
          href={exportHref}
          className="rounded-full bg-[#1f140d] px-4 py-3 text-sm font-semibold text-white"
        >
          Export CSV
        </a>
      </div>
      {auditLogs.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-stone-50 p-4 text-sm text-stone-600">
          Belum ada audit log.
        </div>
      ) : (
        <div className="grid max-h-[38rem] gap-3 overflow-y-auto pr-1">
          {auditLogs.items.map((log) => (
            <div key={log.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {log.action} • {log.entityType}
                  </p>
                  <p className="mt-1 text-sm text-[color:rgba(29,20,8,0.68)]">
                    {log.actorDisplayName ?? "Sistem"} •{" "}
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-white/70 p-3 text-xs text-[color:rgba(29,20,8,0.8)]">
                {JSON.stringify(log.metadataJson, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
      <PaginationControls
        page={auditLogs.page}
        totalPages={auditLogs.totalPages}
        onChange={loadPage}
      />
    </PanelCard>
  );
}

function StationPanel({
  session,
  stations,
  submit,
  onChanged,
}: {
  session: AdminSession;
  stations: PaginatedResult<StationRecord>;
  submit: (endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown) => Promise<SubmitResult>;
  onChanged: (stations: PaginatedResult<StationRecord>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    branchId: defaultBranchId,
    code: "",
    label: "",
    consoleType: "PS4" as StationRecord["consoleType"],
    status: "AVAILABLE" as StationRecord["status"],
    sortOrder: String(stations.total + 1),
  });

  return (
    <PaginatedMasterPanel
      title="Station"
      page={stations.page}
      totalPages={stations.totalPages}
      onPageChange={async (page) => {
        const response = await fetch(
          `/api/admin/stations?page=${page}&pageSize=${stations.pageSize}`,
          { cache: "no-store" },
        );
        await onChanged((await response.json()) as PaginatedResult<StationRecord>);
      }}
      form={
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await submit("/api/admin/stations", "POST", {
              ...form,
              sortOrder: Number(form.sortOrder),
            });
            if (isPaginatedStations(result)) {
              await onChanged(result);
              setForm({ ...form, code: "", label: "" });
            }
          }}
        >
          <TextInput label="Kode" value={form.code} onChange={(value) => setForm({ ...form, code: value })} />
          <TextInput label="Label" value={form.label} onChange={(value) => setForm({ ...form, label: value })} />
          <SelectInput label="Console" value={form.consoleType} options={["PS3", "PS4", "PS5"]} onChange={(value) => setForm({ ...form, consoleType: value as StationRecord["consoleType"] })} />
          <SelectInput label="Status" value={form.status} options={["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"]} onChange={(value) => setForm({ ...form, status: value as StationRecord["status"] })} />
          <TextInput label="Urutan" value={form.sortOrder} onChange={(value) => setForm({ ...form, sortOrder: value })} />
          {session.permissions.includes("stations:manage") ? <button type="submit" className="rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white">Tambah station</button> : null}
        </form>
      }
      list={
        <SimpleList
          items={stations.items.map((item) => ({
            id: item.id,
            title: `${item.code} • ${item.consoleType}`,
            subtitle: `${item.label} • ${item.status}`,
            onDelete: async () => {
              if (!session.permissions.includes("stations:manage")) return;
              if (!window.confirm(`Hapus station ${item.code}?`)) return;
              const result = await submit(`/api/admin/stations/${item.id}`, "DELETE");
              if (isPaginatedStations(result)) {
                await onChanged(result);
              }
            },
            onEdit: async () => {
              if (!session.permissions.includes("stations:manage")) return;
              const label = window.prompt("Label station", item.label);
              if (!label) return;
              if (!window.confirm(`Simpan perubahan station ${item.code}?`)) return;
              const result = await submit(`/api/admin/stations/${item.id}`, "PUT", {
                ...item,
                branchId: item.branchId,
                label,
                sortOrder: item.sortOrder,
              });
              if (isPaginatedStations(result)) {
                await onChanged(result);
              }
            },
          }))}
        />
      }
    />
  );
}

function MemberPanel({
  session,
  members,
  submit,
  onChanged,
}: {
  session: AdminSession;
  members: PaginatedResult<MemberRecord>;
  submit: (endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown) => Promise<SubmitResult>;
  onChanged: (members: PaginatedResult<MemberRecord>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    branchId: defaultBranchId,
    name: "",
    phone: "",
    email: "",
    isActive: true,
  });

  return (
    <PaginatedMasterPanel
      title="Member"
      page={members.page}
      totalPages={members.totalPages}
      onPageChange={async (page) => {
        const response = await fetch(
          `/api/admin/members?page=${page}&pageSize=${members.pageSize}`,
          { cache: "no-store" },
        );
        await onChanged((await response.json()) as PaginatedResult<MemberRecord>);
      }}
      form={
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await submit("/api/admin/members", "POST", form);
            if (isPaginatedMembers(result)) {
              await onChanged(result);
              setForm({ ...form, name: "", phone: "", email: "" });
            }
          }}
        >
          <TextInput label="Nama" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextInput label="Nomor HP" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <TextInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          {session.permissions.includes("members:manage") ? <button type="submit" className="rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white">Tambah member</button> : null}
        </form>
      }
      list={
        <SimpleList
          items={members.items.map((item) => ({
            id: item.id,
            title: `${item.name} • ${item.memberCode}`,
            subtitle: [item.phone, item.email].filter(Boolean).join(" • ") || "Tanpa kontak",
            onDelete: async () => {
              if (!session.permissions.includes("members:manage")) return;
              if (!window.confirm(`Hapus member ${item.name}?`)) return;
              const result = await submit(`/api/admin/members/${item.id}`, "DELETE");
              if (isPaginatedMembers(result)) {
                await onChanged(result);
              }
            },
            onEdit: async () => {
              if (!session.permissions.includes("members:manage")) return;
              const name = window.prompt("Nama member", item.name);
              if (!name) return;
              if (!window.confirm(`Simpan perubahan member ${item.name}?`)) return;
              const result = await submit(`/api/admin/members/${item.id}`, "PUT", {
                branchId: item.branchId,
                name,
                phone: item.phone,
                email: item.email,
                isActive: item.isActive,
              });
              if (isPaginatedMembers(result)) {
                await onChanged(result);
              }
            },
          }))}
        />
      }
    />
  );
}

function PricingPanel({
  session,
  pricingRules,
  submit,
  onChanged,
}: {
  session: AdminSession;
  pricingRules: PaginatedResult<PricingRuleRecord>;
  submit: (endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown) => Promise<SubmitResult>;
  onChanged: (pricingRules: PaginatedResult<PricingRuleRecord>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    branchId: defaultBranchId,
    name: "",
    pricingType: "PACKAGE" as PricingRuleRecord["pricingType"],
    consoleType: "PS4" as NonNullable<PricingRuleRecord["consoleType"]>,
    priority: "10",
    durationMinutes: "60",
    priceAmount: "28000",
    isActive: true,
  });

  return (
    <PaginatedMasterPanel
      title="Pricing"
      page={pricingRules.page}
      totalPages={pricingRules.totalPages}
      onPageChange={async (page) => {
        const response = await fetch(
          `/api/admin/pricing?page=${page}&pageSize=${pricingRules.pageSize}`,
          { cache: "no-store" },
        );
        await onChanged((await response.json()) as PaginatedResult<PricingRuleRecord>);
      }}
      form={
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await submit("/api/admin/pricing", "POST", {
              ...form,
              priority: Number(form.priority),
              durationMinutes: Number(form.durationMinutes),
              priceAmount: Number(form.priceAmount),
            });
            if (isPaginatedPricingRules(result)) {
              await onChanged(result);
              setForm({ ...form, name: "" });
            }
          }}
        >
          <TextInput label="Nama tarif" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <SelectInput label="Tipe" value={form.pricingType} options={["PACKAGE", "HOURLY"]} onChange={(value) => setForm({ ...form, pricingType: value as PricingRuleRecord["pricingType"] })} />
          <SelectInput label="Console" value={form.consoleType} options={["PS3", "PS4", "PS5"]} onChange={(value) => setForm({ ...form, consoleType: value as NonNullable<PricingRuleRecord["consoleType"]> })} />
          <TextInput label="Durasi (menit)" value={form.durationMinutes} onChange={(value) => setForm({ ...form, durationMinutes: value })} />
          <TextInput label="Harga" value={form.priceAmount} onChange={(value) => setForm({ ...form, priceAmount: value })} />
          <TextInput label="Prioritas" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} />
          {session.permissions.includes("pricing:manage") ? <button type="submit" className="rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white">Tambah tarif</button> : null}
        </form>
      }
      list={
        <SimpleList
          items={pricingRules.items.map((item) => ({
            id: item.id,
            title: `${item.name} • Rp${item.priceAmount.toLocaleString("id-ID")}`,
            subtitle: `${item.consoleType ?? "Semua console"} • ${item.durationMinutes ?? 0} menit • prioritas ${item.priority}`,
            onDelete: async () => {
              if (!session.permissions.includes("pricing:manage")) return;
              if (!window.confirm(`Hapus tarif ${item.name}?`)) return;
              const result = await submit(`/api/admin/pricing/${item.id}`, "DELETE");
              if (isPaginatedPricingRules(result)) {
                await onChanged(result);
              }
            },
            onEdit: async () => {
              if (!session.permissions.includes("pricing:manage")) return;
              const priceAmount = window.prompt("Harga tarif", String(item.priceAmount));
              if (!priceAmount) return;
              if (!window.confirm(`Simpan perubahan tarif ${item.name}?`)) return;
              const result = await submit(`/api/admin/pricing/${item.id}`, "PUT", {
                ...item,
                branchId: item.branchId,
                priceAmount: Number(priceAmount),
              });
              if (isPaginatedPricingRules(result)) {
                await onChanged(result);
              }
            },
          }))}
        />
      }
    />
  );
}

function PaginatedMasterPanel({
  title,
  form,
  list,
  page,
  totalPages,
  onPageChange,
}: {
  title: string;
  form: React.ReactNode;
  list: React.ReactNode;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => Promise<void>;
}) {
  return (
    <PanelCard title={title}>
      {form}
      {list}
      <PaginationControls page={page} totalPages={totalPages} onChange={onPageChange} />
    </PanelCard>
  );
}

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-[28px] border border-[var(--line)] bg-white/80 p-6">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-4 grid gap-4">{children}</div>
    </article>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password" | "date";
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand)]"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--brand)]"
      >
        {options.map((option) => (
          <option key={option || "__all"} value={option}>
            {option ? labels?.[option] ?? option : "Semua"}
          </option>
        ))}
      </select>
    </label>
  );
}

function PaginationControls({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => void onChange(page - 1)}
        className="rounded-full border border-[var(--line)] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sebelumnya
      </button>
      <span>
        Halaman {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => void onChange(page + 1)}
        className="rounded-full border border-[var(--line)] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Berikutnya
      </button>
    </div>
  );
}

function SimpleList({
  items,
}: {
  items: {
    id: string;
    title: string;
    subtitle: string;
    onEdit: () => Promise<void>;
    onDelete: () => Promise<void>;
    disabledDelete?: boolean;
    extraActions?: Array<{ label: string; onClick: () => Promise<void> }>;
  }[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-stone-50 p-4 text-sm text-stone-600">
        Belum ada data.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-[color:rgba(29,20,8,0.68)]">{item.subtitle}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {item.extraActions?.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => void action.onClick()}
                  className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold"
                >
                  {action.label}
                </button>
              ))}
              <button type="button" onClick={() => void item.onEdit()} className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold">
                Edit
              </button>
              <button
                type="button"
                disabled={item.disabledDelete}
                onClick={() => void item.onDelete()}
                className="rounded-full bg-[#1f140d] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getErrorMessage(payload: SubmitResult, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    return payload.error ?? fallback;
  }

  return fallback;
}

function isPaginatedAdminUsers(value: SubmitResult): value is PaginatedResult<AdminUserRecord> {
  return Boolean(value && typeof value === "object" && "items" in value);
}

function isPaginatedStations(value: SubmitResult): value is PaginatedResult<StationRecord> {
  return Boolean(value && typeof value === "object" && "items" in value);
}

function isPaginatedMembers(value: SubmitResult): value is PaginatedResult<MemberRecord> {
  return Boolean(value && typeof value === "object" && "items" in value);
}

function isPaginatedPricingRules(value: SubmitResult): value is PaginatedResult<PricingRuleRecord> {
  return Boolean(value && typeof value === "object" && "items" in value);
}
