import type { AdminRole } from "@/types/auth";

export type AdminUserRecord = {
  id: string;
  branchId: string | null;
  username: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
};

export type BranchRecord = {
  id: string;
  code: string;
  name: string;
};

export type AdminPermissionOverrideRecord = {
  id: string;
  userId: string;
  branchId: string | null;
  permission: string;
  effect: "ALLOW" | "DENY";
};

export type AuditLogRecord = {
  id: string;
  branchId: string | null;
  actorUserId: string | null;
  actorDisplayName: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  metadataJson: Record<string, unknown>;
  createdAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AuditLogFilterOptions = {
  actors: { id: string; label: string }[];
  actions: string[];
  entityTypes: string[];
};

export type PermissionMatrixPayload = {
  branches: BranchRecord[];
  permissions: string[];
  overrides: AdminPermissionOverrideRecord[];
};

export type StationRecord = {
  id: string;
  branchId: string;
  code: string;
  label: string;
  consoleType: "PS3" | "PS4" | "PS5";
  status:
    | "AVAILABLE"
    | "IN_USE"
    | "RESERVED"
    | "EXPIRED"
    | "MAINTENANCE"
    | "OUT_OF_SERVICE";
  sortOrder: number;
};

export type MemberRecord = {
  id: string;
  branchId: string;
  memberCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
};

export type PricingRuleRecord = {
  id: string;
  branchId: string;
  name: string;
  pricingType: "HOURLY" | "PACKAGE";
  consoleType: "PS3" | "PS4" | "PS5" | null;
  priority: number;
  durationMinutes: number | null;
  priceAmount: number;
  isActive: boolean;
};

export type MasterDataSnapshot = {
  adminUsers: PaginatedResult<AdminUserRecord>;
  stations: PaginatedResult<StationRecord>;
  members: PaginatedResult<MemberRecord>;
  pricingRules: PaginatedResult<PricingRuleRecord>;
  auditLogs: PaginatedResult<AuditLogRecord>;
  auditLogFilterOptions: AuditLogFilterOptions;
  branches: BranchRecord[];
};
