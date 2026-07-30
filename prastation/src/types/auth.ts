export type AdminRole = "OWNER_ADMIN" | "CASHIER";

export type AdminPermission =
  | "billing:view"
  | "billing:manage"
  | "stations:view"
  | "stations:manage"
  | "members:view"
  | "members:manage"
  | "pricing:view"
  | "pricing:manage"
  | "reports:view"
  | "audit_logs:view"
  | "admin_users:view"
  | "admin_users:manage"
  | "admin_users:reset_password"
  | "settings:manage";

export type AdminSession = {
  userId: string;
  branchId: string | null;
  username: string;
  role: AdminRole;
  displayName: string;
  permissions: AdminPermission[];
  expiresAt: string;
};
