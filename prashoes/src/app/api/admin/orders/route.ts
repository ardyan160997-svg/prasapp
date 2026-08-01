import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type OrderItemPayload = {
  shoeDescription: string;
  serviceId: string;
  notes: string;
};

function generateOrderCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const date = new Date();
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = `${date.getFullYear()}`.slice(-2);
  return `PRS${year}${month}${day}-${random}`;
}

function isValidItem(value: unknown): value is OrderItemPayload {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;
  return (
    String(item.shoeDescription ?? "").trim().length > 0 &&
    String(item.serviceId ?? "").trim().length > 0
  );
}

export async function POST(request: Request) {
  const unauthorizedResponse = await requireAdminRequest();

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const ownerType = body.ownerType === "non-member" ? "non-member" : "member";
  const customerName = String(body.customerName ?? "").trim();
  const whatsappNumber = String(body.whatsappNumber ?? "").trim();
  const status = String(body.status ?? "Pesanan dibuat").trim() || "Pesanan dibuat";
  const paymentMethod = String(body.paymentMethod ?? "COD").trim();
  const memberId = ownerType === "member" ? String(body.memberId ?? "").trim() : "";
  const items = Array.isArray(body.items) ? body.items.filter(isValidItem) : [];

  if (!customerName || !whatsappNumber) {
    return NextResponse.json(
      { error: "Nama customer dan nomor WhatsApp wajib diisi." },
      { status: 400 }
    );
  }

  if (ownerType === "member" && !memberId) {
    return NextResponse.json(
      { error: "Member wajib dipilih untuk order member." },
      { status: 400 }
    );
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Minimal satu item sepatu wajib diinput." },
      { status: 400 }
    );
  }

  const serviceIds = Array.from(new Set(items.map((item) => item.serviceId)));

  const { data: servicesData, error: servicesError } = await supabase
    .from("services")
    .select("id, name")
    .in("id", serviceIds);

  if (servicesError) {
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  const serviceMap = new Map(
    ((servicesData as Array<Record<string, unknown>> | null) ?? []).map((service) => [
      String(service.id),
      String(service.name ?? ""),
    ])
  );

  const deepCleanCount = items.filter((item) =>
    (serviceMap.get(item.serviceId) ?? "").toLowerCase().includes("deep clean")
  ).length;

  let memberRecord:
    | {
        id: string;
        member_code: string;
        total_deep_clean_pairs: number;
        free_wash_balance: number;
      }
    | null = null;

  if (ownerType === "member") {
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("id, member_code, total_deep_clean_pairs, free_wash_balance")
      .eq("id", memberId)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: "Member tidak ditemukan." },
        { status: 404 }
      );
    }

    memberRecord = memberData as typeof memberRecord;
  }

  const orderCode = generateOrderCode();
  const promoLabel =
    ownerType === "member" ? "Tracking via member dashboard" : "Tracking via order code WA";

  const orderPayload = {
    order_code: orderCode,
    status,
    customer_name: customerName,
    member_id: ownerType === "member" ? memberId : null,
    whatsapp_number: whatsappNumber,
    payment_method: paymentMethod,
    promo_label: promoLabel,
  };

  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select("id")
    .single();

  if (orderError || !createdOrder) {
    return NextResponse.json(
      { error: orderError?.message ?? "Gagal membuat order." },
      { status: 500 }
    );
  }

  const orderId = (createdOrder as { id: string }).id;

  const itemPayloads = items.map((item, index) => ({
    order_id: orderId,
    item_number: index + 1,
    shoe_description: item.shoeDescription.trim(),
    service_id: item.serviceId,
    item_status: status,
    notes: String(item.notes ?? ""),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase.from("order_items") as any).insert(itemPayloads);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", orderId);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  if (memberRecord && deepCleanCount > 0) {
    const previousPairs = Number(memberRecord.total_deep_clean_pairs ?? 0);
    const newPairs = previousPairs + deepCleanCount;
    const earnedRewards = Math.floor(newPairs / 10) - Math.floor(previousPairs / 10);

    const { error: memberUpdateError } = await supabase
      .from("members")
      .update({
        total_deep_clean_pairs: newPairs,
        free_wash_balance: Number(memberRecord.free_wash_balance ?? 0) + Math.max(earnedRewards, 0),
      })
      .eq("id", memberRecord.id);

    if (memberUpdateError) {
      return NextResponse.json({ error: memberUpdateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    orderCode,
  });
}
