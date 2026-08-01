import { getSupabaseClient } from "@/lib/supabase";
import {
  defaultMemberBenefits,
  defaultPromos,
  defaultServiceOptions,
  defaultServices,
} from "@/features/main/data/default-content";
import type {
  GalleryItem,
  PromoItem,
  ServiceItem,
  PickupFormData,
  OrderTrackingResult,
  MemberRegistrationData,
  MemberRegistrationResult,
  PickupPricingSummary,
} from "@/features/main/types";

const NON_MEMBER_DELIVERY_FEE = 5000;
const MEMBER_NEW_PROMO_RATE = 0.1;

function getEstimatedServiceBase(serviceType: string) {
  const normalized = serviceType.toLowerCase();
  if (normalized.includes("premium")) return 150000;
  if (normalized.includes("deep")) return 45000;
  if (normalized.includes("unyellow")) return 55000;
  if (normalized.includes("repaint")) return 65000;
  if (normalized.includes("leather")) return 75000;
  return 25000;
}

export function calculatePickupPricing(form: PickupFormData): PickupPricingSummary {
  const basePrice = getEstimatedServiceBase(form.serviceType) * form.shoeQuantity;
  const deliveryFee = form.isMember
    ? form.shoeQuantity >= 2
      ? 0
      : NON_MEMBER_DELIVERY_FEE
    : NON_MEMBER_DELIVERY_FEE;
  const discountAmount = form.isMember ? Math.round(basePrice * MEMBER_NEW_PROMO_RATE) : 0;
  const promoLabel = form.isMember ? "Promo Member Baru 10%" : "Non-member";
  const estimatedTotal = Math.max(basePrice + deliveryFee - discountAmount, 0);

  return {
    deliveryFee,
    discountAmount,
    promoLabel,
    estimatedTotalLabel: new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(estimatedTotal),
  };
}

export async function createMemberRegistration(
  form: MemberRegistrationData
): Promise<MemberRegistrationResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      error: "Database belum dikonfigurasi.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("members") as any)
    .insert({
      full_name: form.fullName,
      whatsapp_number: form.whatsappNumber,
      email: form.email ?? "",
      pickup_address: form.pickupAddress,
      pickup_latitude: form.pickupLatitude ?? null,
      pickup_longitude: form.pickupLongitude ?? null,
      pickup_share_url: form.pickupShareUrl ?? "",
    })
    .select("member_code")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Gagal mendaftarkan member." };
  }

  return {
    success: true,
    memberCode: (data as { member_code: string }).member_code,
  };
}

export async function fetchServices(): Promise<ServiceItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return defaultServices;

  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, description, starting_price")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return defaultServices;

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    startingPrice: row.starting_price as string,
  }));
}

export async function fetchTrackingStatus(orderCode: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .eq("order_code", orderCode.toUpperCase())
    .single();

  if (error || !data) return null;

  return (data as { status: string }).status;
}

export async function fetchOrderTracking(
  orderCode: string
): Promise<OrderTrackingResult | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_order_tracking", {
    p_order_code: orderCode.toUpperCase(),
  });

  if (error || !data) return null;

  return data as unknown as OrderTrackingResult;
}

export async function createPickupRequest(
  form: PickupFormData
): Promise<{ success: boolean; requestCode?: string; error?: string }> {
  const pricing = calculatePickupPricing(form);
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Database belum dikonfigurasi." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("pickup_requests") as any)
    .insert({
      full_name: form.fullName,
      whatsapp_number: form.whatsappNumber,
      email: form.email ?? "",
      pickup_address: form.pickupAddress,
      pickup_latitude: form.pickupLatitude ?? null,
      pickup_longitude: form.pickupLongitude ?? null,
      pickup_share_url: form.pickupShareUrl ?? "",
      shoe_quantity: form.shoeQuantity,
      service_type: form.serviceType,
      is_member: form.isMember,
      member_code: form.memberCode ?? "",
      delivery_fee: pricing.deliveryFee,
      discount_amount: pricing.discountAmount,
      promo_label: pricing.promoLabel,
      notes: form.notes ?? "",
    })
    .select("request_code")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    requestCode: (data as { request_code: string } | null)?.request_code ?? undefined,
  };
}

export async function fetchPromos(): Promise<PromoItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return defaultPromos;

  const { data, error } = await supabase
    .from("promos")
    .select("id, title, description, discount_label")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return defaultPromos;

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    discountLabel: row.discount_label as string,
  }));
}

export async function fetchMemberBenefits(): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return defaultMemberBenefits;

  const { data, error } = await supabase
    .from("member_benefits")
    .select("benefit")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return defaultMemberBenefits;

  return (data as Array<Record<string, unknown>>).map(
    (row) => row.benefit as string
  );
}

export async function fetchServiceOptions(): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return defaultServiceOptions;

  const { data, error } = await supabase
    .from("services")
    .select("name")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return defaultServiceOptions;

  return (data as Array<Record<string, unknown>>).map(
    (row) => row.name as string
  );
}

export async function fetchGalleryItems(): Promise<GalleryItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("gallery")
    .select("id, before_url, after_url, label")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    beforeUrl: row.before_url as string,
    afterUrl: row.after_url as string,
    label: row.label as string,
  }));
}
