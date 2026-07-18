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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_code: string;
          status?: string;
          customer_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_code?: string;
          status?: string;
          customer_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pickup_requests: {
        Row: {
          id: string;
          full_name: string;
          whatsapp_number: string;
          pickup_address: string;
          shoe_quantity: number;
          service_type: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          whatsapp_number: string;
          pickup_address: string;
          shoe_quantity?: number;
          service_type?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          whatsapp_number?: string;
          pickup_address?: string;
          shoe_quantity?: number;
          service_type?: string;
          status?: string;
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