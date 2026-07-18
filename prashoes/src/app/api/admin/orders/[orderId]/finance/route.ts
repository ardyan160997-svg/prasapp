import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const { orderId } = await context.params;
  const body = await request.json();

  const { error } = await supabase
    .from("orders")
    .update({
      revenue_amount: toNumber(body.revenueAmount),
      production_cost: toNumber(body.productionCost),
      raw_material_cost: toNumber(body.rawMaterialCost),
      other_cost: toNumber(body.otherCost),
      finance_notes: String(body.financeNotes ?? ""),
    })
    .eq("id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}