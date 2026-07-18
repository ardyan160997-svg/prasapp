// Shared TypeScript interfaces for Prashoes

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

// ============================
// Order Items & Photos (for tracking v2)
// ============================
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

export interface AdminPickupRequest {
  id: string;
  fullName: string;
  whatsappNumber: string;
  pickupAddress: string;
  shoeQuantity: number;
  serviceType: string;
  status: string;
  createdAt: string;
}

export interface AdminOrderItemPhoto {
  id: string;
  photoType: "before" | "after";
  imageUrl: string;
  caption: string;
}

export interface AdminOrderItem {
  id: string;
  itemNumber: number;
  shoeDescription: string;
  itemStatus: string;
  notes: string;
  photos: AdminOrderItemPhoto[];
}

export interface AdminOrder {
  id: string;
  orderCode: string;
  status: string;
  customerName: string;
  whatsappNumber: string;
  serviceType: string;
  shoeQuantity: number;
  paymentMethod: string;
  promoLabel: string;
  revenueAmount: number;
  productionCost: number;
  rawMaterialCost: number;
  otherCost: number;
  financeNotes: string;
  profit: number;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminCashflowTransaction {
  id: string;
  transactionDate: string;
  transactionType: "pemasukkan" | "pengeluaran";
  description: string;
  amount: number;
  quantity: number;
}

export interface AdminDashboardData {
  stats: {
    pickupRequests: number;
    orders: number;
    activePromos: number;
    services: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
  };
  recentPickupRequests: AdminPickupRequest[];
  recentOrders: AdminOrder[];
  cashflowTransactions: AdminCashflowTransaction[];
}

