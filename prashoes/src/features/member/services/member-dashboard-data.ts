import {
  fetchMemberBenefits,
  fetchPromos,
} from "@/features/main/services/public-site-data";
import type {
  MemberDashboardData,
  MemberOrderSummary,
} from "@/features/member/types";

export async function fetchMemberDashboardData(): Promise<MemberDashboardData> {
  const [benefits, promos] = await Promise.all([fetchMemberBenefits(), fetchPromos()]);
  const recentOrders: MemberOrderSummary[] = [];

  return {
    profile: {
      name: "Belum ada data member",
      tier: "Member Dashboard",
      memberCode: "-",
      points: 0,
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      nextReward: "Data reward akan muncul setelah data member dan order tersedia di database.",
    },
    benefits,
    promos,
    recentOrders,
    reminders: [
      "Hubungkan halaman member ke data member asli agar progres sepatu bisa tampil.",
      "Isi data order dan item sepatu lewat dashboard admin untuk memunculkan riwayat.",
      "Promo dan benefit akan otomatis muncul setelah datanya tersedia di database.",
    ],
  };
}
