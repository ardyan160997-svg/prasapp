// Shared TypeScript interfaces for Prashoes
// Prepared for future Supabase integration

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  startingPrice: string;
}

export interface TrackingStatus {
  orderCode: string;
  status: string;
}

export interface PromoItem {
  id: string;
  title: string;
  description: string;
  discountLabel: string;
}

export interface PickupFormData {
  fullName: string;
  whatsappNumber: string;
  pickupAddress: string;
  shoeQuantity: number;
  serviceType: string;
}