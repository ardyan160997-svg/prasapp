// Supabase service layer
// Provides read/write helpers that fall back to placeholder data
// when Supabase env vars are not configured.

import { getSupabaseClient } from "@/lib/supabase";
import {
  services as staticServices,
  activePromos as staticPromos,
  memberBenefits as staticBenefits,
  dummyTrackingData as staticTracking,
  serviceOptions,
} from "@/lib/placeholder";
import type {
  AdminDashboardData,
  PromoItem,
  ServiceItem,
  PickupFormData,
  OrderTrackingResult,
} from "@/types";

// ============================
// Services (pricelist)
// ============================
export async function fetchServices(): Promise<ServiceItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return staticServices;

  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, description, starting_price")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return staticServices;

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    startingPrice: row.starting_price as string,
  }));
}

// ============================
// Orders (tracking)
// ============================
export async function fetchTrackingStatus(
  orderCode: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return staticTracking[orderCode.toUpperCase()]?.status ?? null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .eq("order_code", orderCode.toUpperCase())
    .single();

  if (error || !data) return null;

  return (data as { status: string }).status;
}

// ============================
// Order Tracking v2 — full order detail with items and photos
// ============================
export async function fetchOrderTracking(
  orderCode: string
): Promise<OrderTrackingResult | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return staticTracking[orderCode.toUpperCase()] ?? null;
  }

  // Call the secure RPC function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_order_tracking", {
    p_order_code: orderCode.toUpperCase(),
  });

  if (error || !data) return null;

  return data as unknown as OrderTrackingResult;
}

// ============================
// Pickup Requests (insert only)
// ============================
export async function createPickupRequest(
  form: PickupFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Fallback: simulate success for demo
    return { success: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("pickup_requests") as any).insert({
    full_name: form.fullName,
    whatsapp_number: form.whatsappNumber,
    pickup_address: form.pickupAddress,
    shoe_quantity: form.shoeQuantity,
    service_type: form.serviceType,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================
// Promos
// ============================
export async function fetchPromos(): Promise<PromoItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return staticPromos;

  const { data, error } = await supabase
    .from("promos")
    .select("id, title, description, discount_label")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return staticPromos;

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    discountLabel: row.discount_label as string,
  }));
}

// ============================
// Member Benefits
// ============================
export async function fetchMemberBenefits(): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return staticBenefits;

  const { data, error } = await supabase
    .from("member_benefits")
    .select("benefit")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return staticBenefits;

  return (data as Array<Record<string, unknown>>).map(
    (row) => row.benefit as string
  );
}

// ============================
// Service Options (dropdown)
// ============================
export async function fetchServiceOptions(): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return serviceOptions;

  const { data, error } = await supabase
    .from("services")
    .select("name")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return serviceOptions;

  return (data as Array<Record<string, unknown>>).map(
    (row) => row.name as string
  );
}

// ============================
// Admin Dashboard
// ============================
export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const emptyData: AdminDashboardData = {
    stats: {
      pickupRequests: 0,
      orders: 0,
      activePromos: 0,
      services: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
    },
    recentPickupRequests: [],
    recentOrders: [],
    cashflowTransactions: [],
  };

  const supabase = getSupabaseClient();
  if (!supabase) return emptyData;

  const [
    pickupCountResult,
    orderCountResult,
    activePromoCountResult,
    serviceCountResult,
    pickupRequestsResult,
    ordersResult,
    financeResult,
    cashflowResult,
  ] = await Promise.all([
    supabase.from("pickup_requests").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("promos")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase
      .from("pickup_requests")
      .select(
        "id, full_name, whatsapp_number, pickup_address, shoe_quantity, service_type, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("orders")
      .select(
        "id, order_code, status, customer_name, payment_method, promo_label, revenue_amount, production_cost, raw_material_cost, other_cost, finance_notes, created_at, order_items(id, item_number, shoe_description, item_status, notes, services(name), order_item_photos(id, photo_type, image_url, caption))"
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("orders")
      .select("revenue_amount, production_cost, raw_material_cost, other_cost"),
    supabase
      .from("cashflow_transactions")
      .select("id, transaction_date, transaction_type, description, amount, quantity")
      .order("transaction_date", { ascending: false })
      .limit(20),
  ]);

  const pickupRows =
    !pickupRequestsResult.error && pickupRequestsResult.data
      ? (pickupRequestsResult.data as Array<Record<string, unknown>>)
      : [];

  const orderRows =
    !ordersResult.error && ordersResult.data
      ? (ordersResult.data as Array<Record<string, unknown>>)
      : [];

  const financeRows =
    !financeResult.error && financeResult.data
      ? (financeResult.data as Array<Record<string, unknown>>)
      : [];

  const cashflowRows =
    !cashflowResult.error && cashflowResult.data
      ? (cashflowResult.data as Array<Record<string, unknown>>)
      : [];

  const totalRevenue = financeRows.reduce(
    (sum, row) => sum + Number(row.revenue_amount ?? 0),
    0
  );

  const totalCost = financeRows.reduce(
    (sum, row) =>
      sum +
      Number(row.production_cost ?? 0) +
      Number(row.raw_material_cost ?? 0) +
      Number(row.other_cost ?? 0),
    0
  );

  return {
    stats: {
      pickupRequests: pickupCountResult.count ?? 0,
      orders: orderCountResult.count ?? 0,
      activePromos: activePromoCountResult.count ?? 0,
      services: serviceCountResult.count ?? 0,
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
    },
    recentPickupRequests: pickupRows.map((row) => ({
      id: row.id as string,
      fullName: row.full_name as string,
      whatsappNumber: row.whatsapp_number as string,
      pickupAddress: row.pickup_address as string,
      shoeQuantity: row.shoe_quantity as number,
      serviceType: row.service_type as string,
      status: row.status as string,
      createdAt: row.created_at as string,
    })),
    recentOrders: orderRows.map((row) => {
      const revenueAmount = Number(row.revenue_amount ?? 0);
      const productionCost = Number(row.production_cost ?? 0);
      const rawMaterialCost = Number(row.raw_material_cost ?? 0);
      const otherCost = Number(row.other_cost ?? 0);
      const items = Array.isArray(row.order_items)
        ? (row.order_items as Array<Record<string, unknown>>)
        : [];

      const serviceNames = Array.from(
        new Set(
          items
            .map((item) => {
              const service = item.services as Record<string, unknown> | null;
              return service?.name as string | undefined;
            })
            .filter(Boolean)
        )
      );

      return {
        id: row.id as string,
        orderCode: row.order_code as string,
        status: row.status as string,
        customerName: row.customer_name as string,
        whatsappNumber: "",
        serviceType: serviceNames.join(", "),
        shoeQuantity: items.length,
        paymentMethod: row.payment_method as string,
        promoLabel: row.promo_label as string,
        revenueAmount,
        productionCost,
        rawMaterialCost,
        otherCost,
        financeNotes: row.finance_notes as string,
        profit: revenueAmount - productionCost - rawMaterialCost - otherCost,
        createdAt: row.created_at as string,
        items: items.map((item) => {
          const photos = Array.isArray(item.order_item_photos)
            ? (item.order_item_photos as Array<Record<string, unknown>>)
            : [];

          return {
            id: item.id as string,
            itemNumber: item.item_number as number,
            shoeDescription: item.shoe_description as string,
            itemStatus: item.item_status as string,
            notes: item.notes as string,
            photos: photos.map((photo) => ({
              id: photo.id as string,
              photoType: photo.photo_type as "before" | "after",
              imageUrl: photo.image_url as string,
              caption: photo.caption as string,
            })),
          };
        }),
      };
    }),
    cashflowTransactions: cashflowRows.map((row) => ({
      id: row.id as string,
      transactionDate: row.transaction_date as string,
      transactionType: row.transaction_type as "pemasukkan" | "pengeluaran",
      description: row.description as string,
      amount: Number(row.amount ?? 0),
      quantity: Number(row.quantity ?? 0),
    })),
  };
}
