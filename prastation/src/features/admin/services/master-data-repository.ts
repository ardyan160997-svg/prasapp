import { queryDb } from "@/lib/db";
import type {
  BranchRecord,
  AuditLogRecord,
  AuditLogFilterOptions,
  MasterDataSnapshot,
  MemberRecord,
  PaginatedResult,
  PricingRuleRecord,
  StationRecord,
} from "@/types/master-data";
import { listAdminUsers, listAllAdminUsers } from "@/features/admin/services/admin-user-repository";

export async function getMasterDataSnapshot(options?: {
  includeAdminUsers?: boolean;
  includeStations?: boolean;
  includeMembers?: boolean;
  includePricingRules?: boolean;
  includeAuditLogs?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<MasterDataSnapshot> {
  const includeAdminUsers = options?.includeAdminUsers ?? true;
  const includeStations = options?.includeStations ?? true;
  const includeMembers = options?.includeMembers ?? true;
  const includePricingRules = options?.includePricingRules ?? true;
  const includeAuditLogs = options?.includeAuditLogs ?? true;

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;

  const [adminUsers, stations, members, pricingRules, auditLogs] = await Promise.all([
    includeAdminUsers
      ? listAdminUsers({ page, pageSize })
      : Promise.resolve(emptyPaginated<import("@/types/master-data").AdminUserRecord>(page, pageSize)),
    includeStations
      ? listStations({ page, pageSize })
      : Promise.resolve(emptyPaginated<StationRecord>(page, pageSize)),
    includeMembers
      ? listMembers({ page, pageSize })
      : Promise.resolve(emptyPaginated<MemberRecord>(page, pageSize)),
    includePricingRules
      ? listPricingRules({ page, pageSize })
      : Promise.resolve(emptyPaginated<PricingRuleRecord>(page, pageSize)),
    includeAuditLogs
      ? listAuditLogs({ page, pageSize })
      : Promise.resolve(emptyPaginated<AuditLogRecord>(page, pageSize)),
  ]);

  const auditLogFilterOptions = includeAuditLogs
    ? await getAuditLogFilterOptions()
    : { actors: [], actions: [], entityTypes: [] };
  const branches = await listBranches();

  return {
    adminUsers,
    stations,
    members,
    pricingRules,
    auditLogs,
    auditLogFilterOptions,
    branches,
  };
}

export async function listStations(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<StationRecord>> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, options?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const [{ rows }, countResult] = await Promise.all([
    queryDb<{
      id: string;
      branch_id: string;
      code: string;
      label: string;
      console_type: "PS3" | "PS4" | "PS5";
      status: StationRecord["status"];
      sort_order: number;
    }>(
      `
        SELECT id, branch_id, code, label, console_type, status, sort_order
        FROM stations
        ORDER BY sort_order ASC, code ASC
        LIMIT $1 OFFSET $2
      `,
      [pageSize, offset],
    ),
    queryDb<{ count: string }>(`SELECT COUNT(*)::text AS count FROM stations`),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    code: row.code,
    label: row.label,
    consoleType: row.console_type,
    status: row.status,
    sortOrder: row.sort_order,
  }));

  const total = Number(countResult.rows[0]?.count ?? "0");

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listMembers(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<MemberRecord>> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, options?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const [{ rows }, countResult] = await Promise.all([
    queryDb<{
      id: string;
      branch_id: string;
      member_code: string;
      name: string;
      phone: string | null;
      email: string | null;
      is_active: boolean;
    }>(
      `
        SELECT id, branch_id, member_code, name, phone, email, is_active
        FROM members
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [pageSize, offset],
    ),
    queryDb<{ count: string }>(`SELECT COUNT(*)::text AS count FROM members`),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    memberCode: row.member_code,
    name: row.name,
    phone: row.phone,
    email: row.email,
    isActive: row.is_active,
  }));

  const total = Number(countResult.rows[0]?.count ?? "0");

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listPricingRules(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<PricingRuleRecord>> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, options?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const [{ rows }, countResult] = await Promise.all([
    queryDb<{
      id: string;
      branch_id: string;
      name: string;
      pricing_type: "HOURLY" | "PACKAGE";
      console_type: "PS3" | "PS4" | "PS5" | null;
      priority: number;
      duration_minutes: number | null;
      price_amount: number;
      is_active: boolean;
    }>(
      `
        SELECT id, branch_id, name, pricing_type, console_type, priority, duration_minutes, price_amount, is_active
        FROM pricing_rules
        ORDER BY priority ASC, name ASC
        LIMIT $1 OFFSET $2
      `,
      [pageSize, offset],
    ),
    queryDb<{ count: string }>(`SELECT COUNT(*)::text AS count FROM pricing_rules`),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    name: row.name,
    pricingType: row.pricing_type,
    consoleType: row.console_type,
    priority: row.priority,
    durationMinutes: row.duration_minutes,
    priceAmount: row.price_amount,
    isActive: row.is_active,
  }));

  const total = Number(countResult.rows[0]?.count ?? "0");

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createStation(input: Omit<StationRecord, "id">) {
  const { rows } = await queryDb<{ id: string }>(
    `
      INSERT INTO stations (id, branch_id, code, label, console_type, status, sort_order)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      input.branchId,
      input.code,
      input.label,
      input.consoleType,
      input.status,
      input.sortOrder,
    ],
  );

  return rows[0].id;
}

export async function updateStation(id: string, input: Omit<StationRecord, "id">) {
  await queryDb(
    `
      UPDATE stations
      SET branch_id = $2,
          code = $3,
          label = $4,
          console_type = $5,
          status = $6,
          sort_order = $7,
          updated_at = NOW()
      WHERE id = $1
    `,
    [id, input.branchId, input.code, input.label, input.consoleType, input.status, input.sortOrder],
  );
}

export async function deleteStation(id: string) {
  await queryDb(`DELETE FROM stations WHERE id = $1`, [id]);
}


export async function createMember(input: Omit<MemberRecord, "id" | "memberCode">) {
  await queryDb(
    `
      INSERT INTO members (id, branch_id, member_code, qr_token, name, phone, email, is_active)
      VALUES (
        gen_random_uuid(),
        $1,
        CONCAT('MBR-', FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::bigint),
        CONCAT('qr-', gen_random_uuid()),
        $2,
        $3,
        $4,
        $5
      )
    `,
    [input.branchId, input.name, input.phone, input.email, input.isActive],
  );
}

export async function updateMember(
  id: string,
  input: Omit<MemberRecord, "id" | "memberCode">,
) {
  await queryDb(
    `
      UPDATE members
      SET branch_id = $2,
          name = $3,
          phone = $4,
          email = $5,
          is_active = $6,
          updated_at = NOW()
      WHERE id = $1
    `,
    [id, input.branchId, input.name, input.phone, input.email, input.isActive],
  );
}

export async function deleteMember(id: string) {
  await queryDb(`DELETE FROM members WHERE id = $1`, [id]);
}


export async function createPricingRule(input: Omit<PricingRuleRecord, "id">) {
  await queryDb(
    `
      INSERT INTO pricing_rules (
        id, branch_id, name, pricing_type, console_type, priority,
        duration_minutes, price_amount, is_active
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      input.branchId,
      input.name,
      input.pricingType,
      input.consoleType,
      input.priority,
      input.durationMinutes,
      input.priceAmount,
      input.isActive,
    ],
  );
}

export async function updatePricingRule(id: string, input: Omit<PricingRuleRecord, "id">) {
  await queryDb(
    `
      UPDATE pricing_rules
      SET branch_id = $2,
          name = $3,
          pricing_type = $4,
          console_type = $5,
          priority = $6,
          duration_minutes = $7,
          price_amount = $8,
          is_active = $9,
          updated_at = NOW()
      WHERE id = $1
    `,
    [
      id,
      input.branchId,
      input.name,
      input.pricingType,
      input.consoleType,
      input.priority,
      input.durationMinutes,
      input.priceAmount,
      input.isActive,
    ],
  );
}

export async function deletePricingRule(id: string) {
  await queryDb(`DELETE FROM pricing_rules WHERE id = $1`, [id]);
}

export async function listAuditLogs(filters?: {
  page?: number;
  pageSize?: number;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PaginatedResult<AuditLogRecord>> {
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, filters?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters?.actorUserId) {
    values.push(filters.actorUserId);
    conditions.push(`a.actor_user_id = $${values.length}`);
  }

  if (filters?.action) {
    values.push(filters.action);
    conditions.push(`a.action = $${values.length}`);
  }

  if (filters?.entityType) {
    values.push(filters.entityType);
    conditions.push(`a.entity_type = $${values.length}`);
  }

  if (filters?.dateFrom) {
    values.push(filters.dateFrom);
    conditions.push(`a.created_at >= $${values.length}::timestamptz`);
  }

  if (filters?.dateTo) {
    values.push(filters.dateTo);
    conditions.push(`a.created_at <= $${values.length}::timestamptz`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [{ rows }, countResult] = await Promise.all([
    queryDb<{
      id: string;
      branch_id: string | null;
      actor_user_id: string | null;
      actor_display_name: string | null;
      entity_type: string;
      entity_id: string | null;
      action: string;
      metadata_json: Record<string, unknown>;
      created_at: string;
    }>(
      `
        SELECT
          a.id,
          a.branch_id,
          a.actor_user_id,
          u.display_name AS actor_display_name,
          a.entity_type,
          a.entity_id,
          a.action,
          a.metadata_json,
          a.created_at::text
        FROM audit_logs a
        LEFT JOIN admin_users u ON u.id = a.actor_user_id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `,
      [...values, pageSize, offset],
    ),
    queryDb<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM audit_logs a
        ${whereClause}
      `,
      values,
    ),
  ]);
  const items = rows.map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    actorUserId: row.actor_user_id,
    actorDisplayName: row.actor_display_name,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    metadataJson: row.metadata_json,
    createdAt: row.created_at,
  }));

  const total = Number(countResult.rows[0]?.count ?? "0");

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAuditLogFilterOptions(): Promise<AuditLogFilterOptions> {
  const [actors, actions, entityTypes] = await Promise.all([
    listAllAdminUsers(),
    queryDb<{ action: string }>(
      `
        SELECT DISTINCT action
        FROM audit_logs
        ORDER BY action ASC
      `,
    ),
    queryDb<{ entity_type: string }>(
      `
        SELECT DISTINCT entity_type
        FROM audit_logs
        ORDER BY entity_type ASC
      `,
    ),
  ]);

  return {
    actors: actors.map((actor) => ({
      id: actor.id,
      label: `${actor.displayName} (${actor.username})`,
    })),
    actions: actions.rows.map((row) => row.action),
    entityTypes: entityTypes.rows.map((row) => row.entity_type),
  };
}

export async function listBranches(): Promise<BranchRecord[]> {
  const { rows } = await queryDb<BranchRecord>(
    `
      SELECT id, code, name
      FROM branches
      ORDER BY name ASC
    `,
  );

  return rows;
}

export async function exportAuditLogsCsv(filters?: {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const result = await listAuditLogs({
    ...filters,
    page: 1,
    pageSize: 1000,
  });

  const rows = [
    [
      "created_at",
      "actor_display_name",
      "action",
      "entity_type",
      "entity_id",
      "metadata_json",
    ],
    ...result.items.map((item) => [
      item.createdAt,
      item.actorDisplayName ?? "",
      item.action,
      item.entityType,
      item.entityId ?? "",
      JSON.stringify(item.metadataJson),
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}

function emptyPaginated<T>(page: number, pageSize: number): PaginatedResult<T> {
  return {
    items: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
  };
}
