import { getSupabaseClient } from "@/lib/supabase";
import type { AdminDashboardData } from "@/features/admin/types";

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