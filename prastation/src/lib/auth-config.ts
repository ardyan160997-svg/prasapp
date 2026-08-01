import type { AdminPermission, AdminRole } from "@/types/auth";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  OWNER_ADMIN: [
    "billing:view",
    "billing:manage",
    "stations:view",
    "stations:manage",
    "members:view",
    "members:manage",
    "pricing:view",
    "pricing:manage",
    "reports:view",
    "audit_logs:view",
    "admin_users:view",
    "admin_users:manage",
    "admin_users:reset_password",
    "settings:manage",
  ],
  CASHIER: [
    "billing:view",
    "billing:manage",
    "stations:view",
    "members:view",
    "pricing:view",
  ],
};

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "billing:view",
  "billing:manage",
  "stations:view",
  "stations:manage",
  "members:view",
  "members:manage",
  "pricing:view",
  "pricing:manage",
  "reports:view",
  "audit_logs:view",
  "admin_users:view",
  "admin_users:manage",
  "admin_users:reset_password",
  "settings:manage",
];

export function normalizeRole(role: string): AdminRole | null {
  if (role === "OWNER_ADMIN" || role === "CASHIER") {
    return role;
  }

  return null;
}

export function getRolePermissions(role: AdminRole) {
  return ROLE_PERMISSIONS[role];
}
