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

const PUBLIC_API_BASE = (
  process.env.NEXT_PUBLIC_PRASHOES_API_BASE ||
  "https://adminprashoes.prasapp.com/api/public"
).replace(/\/$/, "");

const NON_MEMBER_DELIVERY_FEE = 5000;
const MEMBER_NEW_PROMO_RATE = 0.1;

async function fetchPublicApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PUBLIC_API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: init?.method && init.method !== "GET" ? undefined : "no-store",
  });

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Request API Prashoes gagal.");
  return data;
}

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
  try {
    return await fetchPublicApi<MemberRegistrationResult>("/members", {
      method: "POST",
      body: JSON.stringify(form),
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mendaftarkan member.",
    };
  }
}

export async function fetchServices(): Promise<ServiceItem[]> {
  try {
    const rows = await fetchPublicApi<Array<Record<string, unknown>>>("/services");
    if (!rows.length) return defaultServices;
    return rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string,
      startingPrice: row.starting_price as string,
    }));
  } catch {
    return defaultServices;
  }
}

export async function fetchTrackingStatus(orderCode: string): Promise<string | null> {
  const tracking = await fetchOrderTracking(orderCode);
  return tracking?.status ?? null;
}

export async function fetchOrderTracking(
  orderCode: string
): Promise<OrderTrackingResult | null> {
  try {
    const data = await fetchPublicApi<OrderTrackingResult | null>(
      `/tracking?orderCode=${encodeURIComponent(orderCode.toUpperCase())}`
    );
    return data;
  } catch {
    return null;
  }
}

export async function createPickupRequest(
  form: PickupFormData
): Promise<{ success: boolean; requestCode?: string; error?: string }> {
  const pricing = calculatePickupPricing(form);
  try {
    return await fetchPublicApi<{ success: boolean; requestCode?: string; error?: string }>(
      "/pickup-requests",
      {
        method: "POST",
        body: JSON.stringify({
          ...form,
          deliveryFee: pricing.deliveryFee,
          discountAmount: pricing.discountAmount,
          promoLabel: pricing.promoLabel,
        }),
      }
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat permintaan pickup.",
    };
  }
}

export async function fetchPromos(): Promise<PromoItem[]> {
  try {
    const rows = await fetchPublicApi<Array<Record<string, unknown>>>("/promos");
    if (!rows.length) return defaultPromos;
    return rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      discountLabel: row.discount_label as string,
    }));
  } catch {
    return defaultPromos;
  }
}

export async function fetchMemberBenefits(): Promise<string[]> {
  try {
    const rows = await fetchPublicApi<Array<Record<string, unknown>>>("/member-benefits");
    if (!rows.length) return defaultMemberBenefits;
    return rows.map((row) => row.benefit as string);
  } catch {
    return defaultMemberBenefits;
  }
}

export async function fetchServiceOptions(): Promise<string[]> {
  const services = await fetchServices();
  return services.length ? services.map((service) => service.name) : defaultServiceOptions;
}

export async function fetchGalleryItems(): Promise<GalleryItem[]> {
  try {
    const rows = await fetchPublicApi<Array<Record<string, unknown>>>("/gallery");
    return rows.map((row) => ({
      id: row.id as string,
      beforeUrl: row.before_url as string,
      afterUrl: row.after_url as string,
      label: row.label as string,
    }));
  } catch {
    return [];
  }
}
