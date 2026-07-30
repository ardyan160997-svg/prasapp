import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AdminOrderEntryData } from "@/features/admin/types";

export async function fetchAdminOrderEntryData(): Promise<AdminOrderEntryData> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      members: [],
      services: [],
    };
  }

  const [membersResult, servicesResult] = await Promise.all([
    supabase
      .from("members")
      .select("id, member_code, full_name, whatsapp_number, total_deep_clean_pairs, free_wash_balance")
      .order("full_name", { ascending: true }),
    supabase
      .from("services")
      .select("id, name")
      .order("created_at", { ascending: true }),
  ]);

  const memberRows =
    !membersResult.error && membersResult.data
      ? (membersResult.data as Array<Record<string, unknown>>)
      : [];
  const serviceRows =
    !servicesResult.error && servicesResult.data
      ? (servicesResult.data as Array<Record<string, unknown>>)
      : [];

  return {
    members: memberRows.map((row) => ({
      id: row.id as string,
      memberCode: row.member_code as string,
      fullName: row.full_name as string,
      whatsappNumber: row.whatsapp_number as string,
      totalDeepCleanPairs: Number(row.total_deep_clean_pairs ?? 0),
      freeWashBalance: Number(row.free_wash_balance ?? 0),
    })),
    services: serviceRows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
    })),
  };
}
