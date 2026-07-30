export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  startingPrice: string;
}

export interface PromoItem {
  id: string;
  title: string;
  description: string;
  discountLabel: string;
}

export interface GalleryItem {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  label: string;
}

export interface PickupFormData {
  fullName: string;
  whatsappNumber: string;
  email?: string;
  pickupAddress: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  pickupShareUrl?: string;
  shoeQuantity: number;
  serviceType: string;
  isMember: boolean;
  memberCode?: string;
  deliveryFee?: number;
  discountAmount?: number;
  promoLabel?: string;
  notes?: string;
}

export interface MemberRegistrationData {
  fullName: string;
  whatsappNumber: string;
  email?: string;
  pickupAddress: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  pickupShareUrl?: string;
}

export interface MemberRegistrationResult {
  success: boolean;
  memberCode?: string;
  error?: string;
}

export interface PickupPricingSummary {
  deliveryFee: number;
  discountAmount: number;
  promoLabel: string;
  estimatedTotalLabel: string;
}

export interface OrderItemPhoto {
  photo_type: "before" | "after";
  image_url: string;
  caption: string;
}

export interface OrderTrackingItem {
  item_number: number;
  shoe_description: string;
  service_name: string | null;
  item_status: string;
  notes: string;
  photos: OrderItemPhoto[];
}

export interface OrderTrackingResult {
  order_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderTrackingItem[];
}
