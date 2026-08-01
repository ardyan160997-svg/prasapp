import type { PoolClient } from "pg";
import { queryDb, withTransaction } from "@/lib/db";
import type { BillingDashboardData, BillingStation } from "@/types/billing";

type StationDashboardRow = {
  station_id: string;
  station_code: string;
  station_label: string;
  branch_code: string;
  branch_name: string;
  console_type: "PS3" | "PS4" | "PS5";
  station_status: BillingStation["status"];
  current_member_name: string | null;
  session_started_at: string | null;
  planned_end_at: string | null;
  current_price_amount: number | null;
  updated_at: string;
};

type StationActionInput = {
  stationId: string;
  actorUsername: string;
  memberId?: string | null;
  memberName?: string | null;
  durationMinutes?: number;
};

type PlaySessionRow = {
  id: string;
  branch_id: string;
  station_id: string;
  member_id: string | null;
  transaction_id: string;
  status: "ACTIVE" | "EXPIRED" | "COMPLETED" | "CANCELLED";
  started_at: string;
  planned_end_at: string;
  actual_end_at: string | null;
  current_price_amount: number;
};

type PricingRow = {
  id: string;
  price_amount: number;
  duration_minutes: number | null;
  pricing_type: "HOURLY" | "PACKAGE";
};

const dashboardQuery = `
  SELECT
    s.id AS station_id,
    s.code AS station_code,
    s.label AS station_label,
    b.code AS branch_code,
    b.name AS branch_name,
    s.console_type,
    s.status AS station_status,
    m.name AS current_member_name,
    ps.started_at::text AS session_started_at,
    ps.planned_end_at::text AS planned_end_at,
    ps.current_price_amount,
    GREATEST(s.updated_at, COALESCE(ps.updated_at, s.updated_at))::text AS updated_at
  FROM stations s
  INNER JOIN branches b ON b.id = s.branch_id
  LEFT JOIN play_sessions ps
    ON ps.station_id = s.id
   AND ps.status IN ('ACTIVE', 'EXPIRED')
  LEFT JOIN members m ON m.id = ps.member_id
  ORDER BY s.sort_order ASC, s.code ASC
`;

export async function getBillingDashboardData() {
  const { rows } = await queryDb<StationDashboardRow>(dashboardQuery);
  return mapDashboardRows(rows);
}

async function getBillingDashboardDataFromClient(client: PoolClient) {
  const { rows } = await client.query<StationDashboardRow>(dashboardQuery);
  return mapDashboardRows(rows);
}

function mapDashboardRows(rows: StationDashboardRow[]) {
  const now = new Date();
  const stations = rows.map((row) => mapBillingStation(row, now));
  const totalStations = stations.length;
  const availableStations = stations.filter((station) => station.status === "AVAILABLE").length;
  const inUseStations = stations.filter((station) => station.status === "IN_USE").length;
  const expiredStations = stations.filter((station) => station.status === "EXPIRED").length;
  const maintenanceStations = stations.filter(
    (station) => station.status === "MAINTENANCE",
  ).length;

  const firstStation = rows[0];

  return {
    branch: {
      code: firstStation?.branch_code ?? process.env.DEFAULT_BRANCH_CODE ?? "BRANCH-001",
      name: firstStation?.branch_name ?? process.env.DEFAULT_BRANCH_NAME ?? "PraStation Utama",
      businessDate: now.toISOString().slice(0, 10),
      serverTime: now.toISOString(),
    },
    summary: {
      totalStations,
      availableStations,
      inUseStations,
      expiredStations,
      maintenanceStations,
      occupiedRatePercent:
        totalStations === 0 ? 0 : Math.round(((inUseStations + expiredStations) / totalStations) * 100),
      activeSessionsRevenue: stations.reduce((sum, station) => sum + station.pendingAmount, 0),
    },
    stations,
  } satisfies BillingDashboardData;
}

function mapBillingStation(row: StationDashboardRow, now: Date): BillingStation {
  const startedAt = row.session_started_at ? new Date(row.session_started_at) : null;
  const plannedEndAt = row.planned_end_at ? new Date(row.planned_end_at) : null;
  const currentSessionMinutes = startedAt
    ? Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 60000))
    : null;
  const remainingMinutes = plannedEndAt
    ? Math.round((plannedEndAt.getTime() - now.getTime()) / 60000)
    : null;
  const status =
    row.station_status === "IN_USE" && remainingMinutes !== null && remainingMinutes < 0
      ? "EXPIRED"
      : row.station_status;

  return {
    id: row.station_id,
    code: row.station_code,
    label: row.station_label,
    consoleType: row.console_type,
    branchCode: row.branch_code,
    status,
    currentMemberName: row.current_member_name,
    currentSessionMinutes,
    remainingMinutes,
    pendingAmount: row.current_price_amount ?? 0,
    lastActionAt: row.updated_at,
  };
}

export async function startBillingSession(input: StationActionInput) {
  return withTransaction(async (client) => {
    const actorUserId = await getActorUserId(client, input.actorUsername);
    const station = await client.query<{
      id: string;
      branch_id: string;
      console_type: "PS3" | "PS4" | "PS5";
      status: BillingStation["status"];
    }>(
      `
        SELECT id, branch_id, console_type, status
        FROM stations
        WHERE id = $1
        FOR UPDATE
      `,
      [input.stationId],
    );

    if (station.rowCount !== 1) {
      throw new Error("Station tidak ditemukan.");
    }

    const stationRow = station.rows[0];

    if (stationRow.status !== "AVAILABLE") {
      throw new Error("Station tidak tersedia untuk sesi baru.");
    }

    const pricing = await resolvePricingRule(
      client,
      stationRow.branch_id,
      stationRow.console_type,
      input.durationMinutes ?? 60,
    );

    const now = new Date();
    const plannedEndAt = new Date(now.getTime() + (input.durationMinutes ?? 60) * 60000);
    const transactionId = crypto.randomUUID();
    const playSessionId = crypto.randomUUID();
    const member = await ensureWalkInMember(client, {
      branchId: stationRow.branch_id,
      actorUserId,
      memberId: input.memberId ?? null,
      memberName: input.memberName ?? null,
    });

    await client.query(
      `
        INSERT INTO transactions (
          id, branch_id, member_id, transaction_number, status,
          subtotal_amount, total_amount, created_by_user_id
        )
        VALUES ($1, $2, $3, $4, 'UNPAID', $5, $5, $6)
      `,
      [
        transactionId,
        stationRow.branch_id,
        member?.id ?? null,
        `TRX-${now.getTime()}`,
        pricing.price_amount,
        actorUserId,
      ],
    );

    await client.query(
      `
        INSERT INTO play_sessions (
          id, branch_id, station_id, member_id, transaction_id, status,
          started_at, planned_end_at, current_price_amount, created_by_user_id
        )
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7, $8, $9)
      `,
      [
        playSessionId,
        stationRow.branch_id,
        input.stationId,
        member?.id ?? null,
        transactionId,
        now.toISOString(),
        plannedEndAt.toISOString(),
        pricing.price_amount,
        actorUserId,
      ],
    );

    await client.query(
      `
        UPDATE stations
        SET status = 'IN_USE', updated_at = NOW()
        WHERE id = $1
      `,
      [input.stationId],
    );

    await insertAuditLog(client, {
      branchId: stationRow.branch_id,
      actorUserId,
      entityType: "play_session",
      entityId: playSessionId,
      action: "SESSION_STARTED",
      metadata: {
        stationId: input.stationId,
        durationMinutes: input.durationMinutes ?? 60,
      },
    });

    return getBillingDashboardDataFromClient(client);
  });
}

export async function extendBillingSession(input: StationActionInput) {
  return withTransaction(async (client) => {
    const actorUserId = await getActorUserId(client, input.actorUsername);
    const session = await getActivePlaySessionForUpdate(client, input.stationId);
    const pricing = await resolvePricingRule(
      client,
      session.branch_id,
      await getStationConsoleType(client, input.stationId),
      input.durationMinutes ?? 30,
    );

    const plannedEndAt = new Date(session.planned_end_at);
    plannedEndAt.setMinutes(plannedEndAt.getMinutes() + (input.durationMinutes ?? 30));
    const updatedAmount = session.current_price_amount + pricing.price_amount;

    await client.query(
      `
        UPDATE play_sessions
        SET planned_end_at = $2, current_price_amount = $3, updated_at = NOW()
        WHERE id = $1
      `,
      [session.id, plannedEndAt.toISOString(), updatedAmount],
    );

    await client.query(
      `
        UPDATE transactions
        SET subtotal_amount = $2, total_amount = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [session.transaction_id, updatedAmount],
    );

    await insertAuditLog(client, {
      branchId: session.branch_id,
      actorUserId,
      entityType: "play_session",
      entityId: session.id,
      action: "SESSION_EXTENDED",
      metadata: {
        stationId: input.stationId,
        durationMinutes: input.durationMinutes ?? 30,
      },
    });

    return getBillingDashboardDataFromClient(client);
  });
}

export async function endBillingSession(input: StationActionInput) {
  return withTransaction(async (client) => {
    const actorUserId = await getActorUserId(client, input.actorUsername);
    const session = await getActivePlaySessionForUpdate(client, input.stationId);
    const now = new Date().toISOString();

    await client.query(
      `
        UPDATE play_sessions
        SET status = 'COMPLETED', actual_end_at = $2, ended_by_user_id = $3, updated_at = NOW()
        WHERE id = $1
      `,
      [session.id, now, actorUserId],
    );

    await client.query(
      `
        UPDATE stations
        SET status = 'AVAILABLE', updated_at = NOW()
        WHERE id = $1
      `,
      [input.stationId],
    );

    await insertAuditLog(client, {
      branchId: session.branch_id,
      actorUserId,
      entityType: "play_session",
      entityId: session.id,
      action: "SESSION_COMPLETED",
      metadata: {
        stationId: input.stationId,
      },
    });

    return getBillingDashboardDataFromClient(client);
  });
}

async function getActivePlaySessionForUpdate(client: PoolClient, stationId: string) {
  const result = await client.query<PlaySessionRow>(
    `
      SELECT
        id, branch_id, station_id, member_id, transaction_id, status,
        started_at::text, planned_end_at::text, actual_end_at::text, current_price_amount
      FROM play_sessions
      WHERE station_id = $1
        AND status IN ('ACTIVE', 'EXPIRED')
      FOR UPDATE
    `,
    [stationId],
  );

  if (result.rowCount !== 1) {
    throw new Error("Tidak ada sesi aktif pada station ini.");
  }

  return result.rows[0];
}

async function getStationConsoleType(client: PoolClient, stationId: string) {
  const result = await client.query<{ console_type: "PS3" | "PS4" | "PS5" }>(
    `
      SELECT console_type
      FROM stations
      WHERE id = $1
    `,
    [stationId],
  );

  if (result.rowCount !== 1) {
    throw new Error("Station tidak ditemukan.");
  }

  return result.rows[0].console_type;
}

async function resolvePricingRule(
  client: PoolClient,
  branchId: string,
  consoleType: "PS3" | "PS4" | "PS5",
  durationMinutes: number,
) {
  const result = await client.query<PricingRow>(
    `
      SELECT id, price_amount, duration_minutes, pricing_type
      FROM pricing_rules
      WHERE branch_id = $1
        AND is_active = TRUE
        AND (console_type IS NULL OR console_type = $2)
        AND (
          (pricing_type = 'PACKAGE' AND duration_minutes = $3)
          OR pricing_type = 'HOURLY'
        )
      ORDER BY
        CASE WHEN pricing_type = 'PACKAGE' THEN 0 ELSE 1 END,
        priority ASC,
        price_amount ASC
      LIMIT 1
    `,
    [branchId, consoleType, durationMinutes],
  );

  if (result.rowCount !== 1) {
    throw new Error("Tarif aktif tidak ditemukan untuk station ini.");
  }

  return result.rows[0];
}

async function ensureWalkInMember(
  client: PoolClient,
  input: {
    branchId: string;
    actorUserId: string;
    memberId: string | null;
    memberName: string | null;
  },
) {
  if (input.memberId) {
    const existing = await client.query<{ id: string }>(
      `
        SELECT id
        FROM members
        WHERE id = $1
      `,
      [input.memberId],
    );

    if (existing.rowCount === 1) {
      return existing.rows[0];
    }
  }

  if (!input.memberName?.trim()) {
    return null;
  }

  const memberId = crypto.randomUUID();
  const timestamp = Date.now();

  await client.query(
    `
      INSERT INTO members (id, branch_id, member_code, qr_token, name)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      memberId,
      input.branchId,
      `MBR-${timestamp}`,
      `qr-${memberId}`,
      input.memberName.trim(),
    ],
  );

  await insertAuditLog(client, {
    branchId: input.branchId,
    actorUserId: input.actorUserId,
    entityType: "member",
    entityId: memberId,
    action: "MEMBER_QUICK_CREATED",
    metadata: {
      memberName: input.memberName.trim(),
    },
  });

  return { id: memberId };
}

async function insertAuditLog(
  client: PoolClient,
  input: {
    branchId: string;
    actorUserId: string;
    entityType: string;
    entityId: string;
    action: string;
    metadata: Record<string, unknown>;
  },
) {
  await client.query(
    `
      INSERT INTO audit_logs (
        id, branch_id, actor_user_id, entity_type, entity_id, action, metadata_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      crypto.randomUUID(),
      input.branchId,
      input.actorUserId,
      input.entityType,
      input.entityId,
      input.action,
      JSON.stringify(input.metadata),
    ],
  );
}

async function getActorUserId(client: PoolClient, username: string) {
  const result = await client.query<{ id: string }>(
    `
      SELECT id
      FROM admin_users
      WHERE username = $1
        AND is_active = TRUE
      LIMIT 1
    `,
    [username],
  );

  if (result.rowCount !== 1) {
    throw new Error("User admin tidak ditemukan di database seed.");
  }

  return result.rows[0].id;
}
