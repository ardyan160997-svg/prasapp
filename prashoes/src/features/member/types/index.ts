import type { PromoItem } from "@/features/main/types";

export interface MemberOrderSummary {
  orderCode: string;
  status: string;
  updatedAt: string;
  itemCount: number;
  primaryService: string;
}

export interface MemberProfile {
  name: string;
  tier: string;
  memberCode: string;
  points: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  nextReward: string;
}

export interface MemberDashboardData {
  profile: MemberProfile;
  benefits: string[];
  promos: PromoItem[];
  recentOrders: MemberOrderSummary[];
  reminders: string[];
}
