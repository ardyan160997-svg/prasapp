import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type PhotoType = "before" | "after";

function isPhotoType(value: unknown): value is PhotoType {
  return value === "before" || value === "after";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
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

  const { itemId } = await context.params;
  const body = await request.json();

  if (!isPhotoType(body.photoType)) {
    return NextResponse.json(
      { error: "Tipe foto harus before atau after." },
      { status: 400 }
    );
  }

  const imageUrl = String(body.imageUrl ?? "").trim();

  if (!imageUrl) {
    return NextResponse.json(
      { error: "URL gambar wajib diisi." },
      { status: 400 }
    );
  }

  const { data: existingPhoto } = await supabase
    .from("order_item_photos")
    .select("id")
    .eq("order_item_id", itemId)
    .eq("photo_type", body.photoType)
    .maybeSingle();

  const payload = {
    order_item_id: itemId,
    photo_type: body.photoType,
    image_url: imageUrl,
    caption: String(body.caption ?? ""),
  };

  const query = existingPhoto
    ? supabase.from("order_item_photos").update(payload).eq("id", existingPhoto.id)
    : supabase.from("order_item_photos").insert(payload);

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
