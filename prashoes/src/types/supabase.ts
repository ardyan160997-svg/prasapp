// Database type definitions matching the Prashoes schema
// These mirror the SQL tables for type-safe Supabase queries

export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          starting_price: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          starting_price?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          starting_price?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_code: string;
          status: string;
          customer_name: string;
          member_id: string | null;
          whatsapp_number: string;
          delivery_fee: number;
          discount_amount: number;
          promo_label: string;
          final_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_code: string;
          status?: string;
          customer_name?: string;
          member_id?: string | null;
          whatsapp_number?: string;
          delivery_fee?: number;
          discount_amount?: number;
          promo_label?: string;
          final_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_code?: string;
          status?: string;
          customer_name?: string;
          member_id?: string | null;
          whatsapp_number?: string;
          delivery_fee?: number;
          discount_amount?: number;
          promo_label?: string;
          final_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      pickup_requests: {
        Row: {
          id: string;
          request_code: string | null;
          full_name: string;
          whatsapp_number: string;
          email: string;
          pickup_address: string;
          pickup_latitude: number | null;
          pickup_longitude: number | null;
          pickup_share_url: string;
          shoe_quantity: number;
          service_type: string;
          member_id: string | null;
          member_code: string;
          is_member: boolean;
          delivery_fee: number;
          discount_amount: number;
          promo_label: string;
          notes: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_code?: string | null;
          full_name: string;
          whatsapp_number: string;
          email?: string;
          pickup_address: string;
          pickup_latitude?: number | null;
          pickup_longitude?: number | null;
          pickup_share_url?: string;
          shoe_quantity?: number;
          service_type?: string;
          member_id?: string | null;
          member_code?: string;
          is_member?: boolean;
          delivery_fee?: number;
          discount_amount?: number;
          promo_label?: string;
          notes?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_code?: string | null;
          full_name?: string;
          whatsapp_number?: string;
          email?: string;
          pickup_address?: string;
          pickup_latitude?: number | null;
          pickup_longitude?: number | null;
          pickup_share_url?: string;
          shoe_quantity?: number;
          service_type?: string;
          member_id?: string | null;
          member_code?: string;
          is_member?: boolean;
          delivery_fee?: number;
          discount_amount?: number;
          promo_label?: string;
          notes?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          member_code: string;
          full_name: string;
          whatsapp_number: string;
          email: string;
          pickup_address: string;
          pickup_latitude: number | null;
          pickup_longitude: number | null;
          pickup_share_url: string;
          total_deep_clean_pairs: number;
          free_wash_balance: number;
          is_new_member_promo_used: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_code?: string;
          full_name: string;
          whatsapp_number: string;
          email?: string;
          pickup_address?: string;
          pickup_latitude?: number | null;
          pickup_longitude?: number | null;
          pickup_share_url?: string;
          total_deep_clean_pairs?: number;
          free_wash_balance?: number;
          is_new_member_promo_used?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_code?: string;
          full_name?: string;
          whatsapp_number?: string;
          email?: string;
          pickup_address?: string;
          pickup_latitude?: number | null;
          pickup_longitude?: number | null;
          pickup_share_url?: string;
          total_deep_clean_pairs?: number;
          free_wash_balance?: number;
          is_new_member_promo_used?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      promos: {
        Row: {
          id: string;
          title: string;
          description: string;
          discount_label: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          discount_label?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          discount_label?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      member_benefits: {
        Row: {
          id: string;
          benefit: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          benefit: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          benefit?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      gallery: {
        Row: {
          id: string;
          before_url: string;
          after_url: string;
          label: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          before_url: string;
          after_url: string;
          label?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          before_url?: string;
          after_url?: string;
          label?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string[];
    };
  };
}
