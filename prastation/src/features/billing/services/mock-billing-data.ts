import type { BillingDashboardData, BillingStation } from "@/types/billing";

const STATIONS: BillingStation[] = [
  {
    id: "station-ps5-01",
    code: "PS5-01",
    label: "VIP Arena 1",
    consoleType: "PS5",
    branchCode: "BRANCH-001",
    status: "IN_USE",
    currentMemberName: "Raka Saputra",
    currentSessionMinutes: 90,
    remainingMinutes: 45,
    pendingAmount: 54000,
    lastActionAt: "2026-07-30T17:10:00.000Z",
  },
  {
    id: "station-ps5-02",
    code: "PS5-02",
    label: "VIP Arena 2",
    consoleType: "PS5",
    branchCode: "BRANCH-001",
    status: "EXPIRED",
    currentMemberName: "Naufal",
    currentSessionMinutes: 120,
    remainingMinutes: -10,
    pendingAmount: 72000,
    lastActionAt: "2026-07-30T15:25:00.000Z",
  },
  {
    id: "station-ps4-01",
    code: "PS4-01",
    label: "Standard Row A",
    consoleType: "PS4",
    branchCode: "BRANCH-001",
    status: "AVAILABLE",
    currentMemberName: null,
    currentSessionMinutes: null,
    remainingMinutes: null,
    pendingAmount: 0,
    lastActionAt: "2026-07-30T16:40:00.000Z",
  },
  {
    id: "station-ps4-02",
    code: "PS4-02",
    label: "Standard Row B",
    consoleType: "PS4",
    branchCode: "BRANCH-001",
    status: "IN_USE",
    currentMemberName: "Bagas",
    currentSessionMinutes: 60,
    remainingMinutes: 22,
    pendingAmount: 32000,
    lastActionAt: "2026-07-30T17:40:00.000Z",
  },
  {
    id: "station-ps3-01",
    code: "PS3-01",
    label: "Retro Corner",
    consoleType: "PS3",
    branchCode: "BRANCH-001",
    status: "MAINTENANCE",
    currentMemberName: null,
    currentSessionMinutes: null,
    remainingMinutes: null,
    pendingAmount: 0,
    lastActionAt: "2026-07-30T08:15:00.000Z",
  },
  {
    id: "station-ps4-03",
    code: "PS4-03",
    label: "Standard Row C",
    consoleType: "PS4",
    branchCode: "BRANCH-001",
    status: "AVAILABLE",
    currentMemberName: null,
    currentSessionMinutes: null,
    remainingMinutes: null,
    pendingAmount: 0,
    lastActionAt: "2026-07-30T17:48:00.000Z",
  },
];

export function getMockBillingDashboardData(): BillingDashboardData {
  const totalStations = STATIONS.length;
  const availableStations = STATIONS.filter(
    (station) => station.status === "AVAILABLE",
  ).length;
  const inUseStations = STATIONS.filter(
    (station) => station.status === "IN_USE",
  ).length;
  const expiredStations = STATIONS.filter(
    (station) => station.status === "EXPIRED",
  ).length;
  const maintenanceStations = STATIONS.filter(
    (station) => station.status === "MAINTENANCE",
  ).length;
  const activeSessionsRevenue = STATIONS.reduce(
    (sum, station) => sum + station.pendingAmount,
    0,
  );

  return {
    branch: {
      code: process.env.DEFAULT_BRANCH_CODE || "BRANCH-001",
      name: process.env.DEFAULT_BRANCH_NAME || "PraStation Utama",
      businessDate: "2026-07-30",
      serverTime: "2026-07-30T17:55:00.000Z",
    },
    summary: {
      totalStations,
      availableStations,
      inUseStations,
      expiredStations,
      maintenanceStations,
      occupiedRatePercent: Math.round(
        ((inUseStations + expiredStations) / totalStations) * 100,
      ),
      activeSessionsRevenue,
    },
    stations: STATIONS,
  };
}
