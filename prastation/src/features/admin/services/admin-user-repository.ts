import { queryDb } from "@/lib/db";
import {
  ALL_ADMIN_PERMISSIONS,
  getRolePermissions,
  normalizeRole,
} from "@/lib/auth-config";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { AdminSession } from "@/types/auth";
import type {
  BranchRecord,
  PermissionMatrixPayload,
  AdminUserRecord,
  PaginatedResult,
} from "@/types/master-data";

type AdminUserRow = {
  id: string;
  branch_id: string | null;
  username: string;
  display_name: string;
  password_hash: string;
  role: string;
  is_active: boolean;
};

export async function authenticateAdminUser(username: string, password: string) {
  const { rows } = await queryDb<AdminUserRow>(
    `
      SELECT id, branch_id, username, display_name, password_hash, role, is_active
      FROM admin_users
      WHERE username = $1
      LIMIT 1
    `,
    [username],
  );

  if (rows.length !== 1) {
    return null;
  }

  const row = rows[0];
  const role = normalizeRole(row.role);

  if (!row.is_active || !role || !verifyPassword(password, row.password_hash)) {
    return null;
  }

  const permissions = await getEffectivePermissions(row.id, role, row.branch_id);

  const session: AdminSession = {
    userId: row.id,
    branchId: row.branch_id,
    username: row.username,
    displayName: row.display_name,
    role,
    permissions,
    expiresAt: "",
  };

  return session;
}

export async function listAdminUsers(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminUserRecord>> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, options?.pageSize ?? 10));
  const offset = (page - 1) * pageSize;
  const [{ rows }, countResult] = await Promise.all([
    queryDb<AdminUserRow>(
      `
        SELECT id, branch_id, username, display_name, password_hash, role, is_active
        FROM admin_users
        ORDER BY role ASC, username ASC
        LIMIT $1 OFFSET $2
      `,
      [pageSize, offset],
    ),
    queryDb<{ count: string }>(`SELECT COUNT(*)::text AS count FROM admin_users`),
  ]);

  const items = rows.flatMap((row) => {
    const role = normalizeRole(row.role);

    if (!role) {
      return [];
    }

    return [
      {
        id: row.id,
        branchId: row.branch_id,
        username: row.username,
        displayName: row.display_name,
        role,
        isActive: row.is_active,
      },
    ];
  });

  const total = Number(countResult.rows[0]?.count ?? "0");

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listAllAdminUsers(): Promise<AdminUserRecord[]> {
  const { items } = await listAdminUsers({ page: 1, pageSize: 100 });
  return items;
}

export async function createAdminUser(input: {
  branchId: string | null;
  username: string;
  displayName: string;
  role: string;
  password: string;
  isActive: boolean;
}) {
  const role = normalizeRole(input.role);

  if (!role) {
    throw new Error("Role admin tidak valid.");
  }

  await queryDb(
    `
      INSERT INTO admin_users (
        id, branch_id, username, display_name, password_hash, role, is_active
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
    `,
    [
      input.branchId,
      input.username,
      input.displayName,
      hashPassword(input.password),
      role,
      input.isActive,
    ],
  );
}

export async function updateAdminUser(
  id: string,
  input: {
    branchId: string | null;
    username: string;
    displayName: string;
    role: string;
    isActive: boolean;
  },
) {
  const role = normalizeRole(input.role);

  if (!role) {
    throw new Error("Role admin tidak valid.");
  }

  await queryDb(
    `
      UPDATE admin_users
      SET branch_id = $2,
          username = $3,
          display_name = $4,
          role = $5,
          is_active = $6,
          updated_at = NOW()
      WHERE id = $1
    `,
    [id, input.branchId, input.username, input.displayName, role, input.isActive],
  );
}

export async function resetAdminUserPassword(id: string, password: string) {
  await queryDb(
    `
      UPDATE admin_users
      SET password_hash = $2,
          updated_at = NOW()
      WHERE id = $1
    `,
    [id, hashPassword(password)],
  );
}

export async function deleteAdminUser(id: string) {
  await queryDb(`DELETE FROM admin_users WHERE id = $1`, [id]);
}

export async function getAdminUserById(id: string) {
  const { rows } = await queryDb<AdminUserRow>(
    `
      SELECT id, branch_id, username, display_name, password_hash, role, is_active
      FROM admin_users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (rows.length !== 1) {
    return null;
  }

  const row = rows[0];
  const role = normalizeRole(row.role);

  if (!role) {
    return null;
  }

  return {
    id: row.id,
    branchId: row.branch_id,
    username: row.username,
    displayName: row.display_name,
    role,
    isActive: row.is_active,
  } satisfies AdminUserRecord;
}

export async function getPermissionMatrix(
  userId: string,
): Promise<PermissionMatrixPayload> {
  const [branches, overrides] = await Promise.all([
    queryDb<BranchRecord>(
      `
        SELECT id, code, name
        FROM branches
        ORDER BY name ASC
      `,
    ),
    queryDb<{
      id: string;
      user_id: string;
      branch_id: string | null;
      permission: string;
      effect: "ALLOW" | "DENY";
    }>(
      `
        SELECT id, user_id, branch_id, permission, effect
        FROM admin_user_permission_overrides
        WHERE user_id = $1
        ORDER BY branch_id NULLS FIRST, permission ASC
      `,
      [userId],
    ),
  ]);

  return {
    branches: branches.rows,
    permissions: [...ALL_ADMIN_PERMISSIONS],
    overrides: overrides.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      branchId: row.branch_id,
      permission: row.permission,
      effect: row.effect,
    })),
  };
}

export async function updatePermissionMatrix(
  userId: string,
  entries: Array<{
    branchId: string | null;
    permission: string;
    effect: "ALLOW" | "DENY" | "DEFAULT";
  }>,
) {
  await queryDb(`DELETE FROM admin_user_permission_overrides WHERE user_id = $1`, [userId]);

  for (const entry of entries) {
    if (entry.effect === "DEFAULT") {
      continue;
    }

    await queryDb(
      `
        INSERT INTO admin_user_permission_overrides (
          id, user_id, branch_id, permission, effect
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
      `,
      [userId, entry.branchId, entry.permission, entry.effect],
    );
  }
}

async function getEffectivePermissions(
  userId: string,
  role: NonNullable<ReturnType<typeof normalizeRole>>,
  branchId: string | null,
) {
  const effective = new Set(getRolePermissions(role));
  const { rows } = await queryDb<{
    permission: string;
    effect: "ALLOW" | "DENY";
    branch_id: string | null;
  }>(
    `
      SELECT permission, effect, branch_id
      FROM admin_user_permission_overrides
      WHERE user_id = $1
        AND (branch_id IS NULL OR branch_id = $2)
      ORDER BY branch_id NULLS FIRST
    `,
    [userId, branchId],
  );

  for (const row of rows) {
    if (!ALL_ADMIN_PERMISSIONS.includes(row.permission as never)) {
      continue;
    }

    if (row.effect === "ALLOW") {
      effective.add(row.permission as never);
    } else {
      effective.delete(row.permission as never);
    }
  }

  return [...effective];
}
