export type StationStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "RESERVED"
  | "EXPIRED"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE";

export type BillingStation = {
  id: string;
  code: string;
  label: string;
  consoleType: "PS3" | "PS4" | "PS5";
  branchCode: string;
  status: StationStatus;
  currentMemberName: string | null;
  currentSessionMinutes: number | null;
  remainingMinutes: number | null;
  pendingAmount: number;
  lastActionAt: string;
};

export type BillingSummary = {
  totalStations: number;
  availableStations: number;
  inUseStations: number;
  expiredStations: number;
  maintenanceStations: number;
  occupiedRatePercent: number;
  activeSessionsRevenue: number;
};

export type BillingDashboardData = {
  branch: {
    code: string;
    name: string;
    businessDate: string;
    serverTime: string;
  };
  summary: BillingSummary;
  stations: BillingStation[];
};
