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

export interface AdminMemberOption {
  id: string;
  memberCode: string;
  fullName: string;
  whatsappNumber: string;
  totalDeepCleanPairs: number;
  freeWashBalance: number;
}

export interface AdminServiceOption {
  id: string;
  name: string;
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

export interface AdminOrderEntryData {
  members: AdminMemberOption[];
  services: AdminServiceOption[];
}
