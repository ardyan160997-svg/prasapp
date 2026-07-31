// Database type definitions matching the Prastation schema
// These mirror the SQL tables for type-safe Supabase queries

export interface Database {
  public: {
    Tables: {
      // Layanan / Jasa yang ditawarkan
      services: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          starting_price: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          starting_price?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          starting_price?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Booking / Reservasi ruang & jasa
      bookings: {
        Row: {
          id: string;
          booking_code: string;
          status: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          total_price: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_code: string;
          status?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          total_price?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_code?: string;
          status?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          total_price?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Detail item booking (ruang, paket, equipment rental)
      booking_items: {
        Row: {
          id: string;
          booking_id: string;
          item_type: "room" | "package" | "equipment" | "service";
          item_id: string;
          item_name: string;
          quantity: number;
          unit_price: string;
          total_price: string;
          start_time: string;
          end_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          item_type: "room" | "package" | "equipment" | "service";
          item_id: string;
          item_name: string;
          quantity?: number;
          unit_price?: string;
          total_price?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          item_type?: "room" | "package" | "equipment" | "service";
          item_id?: string;
          item_name?: string;
          quantity?: number;
          unit_price?: string;
          total_price?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Ruang/Studio yang bisa dibooking
      rooms: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          capacity: number;
          hourly_price: string;
          daily_price: string;
          amenities: string[];
          images: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          capacity?: number;
          hourly_price?: string;
          daily_price?: string;
          amenities?: string[];
          images?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          capacity?: number;
          hourly_price?: string;
          daily_price?: string;
          amenities?: string[];
          images?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Equipment rental
      equipment: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          category: string;
          daily_price: string;
          quantity_available: number;
          images: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          category?: string;
          daily_price?: string;
          quantity_available?: number;
          images?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          category?: string;
          daily_price?: string;
          quantity_available?: number;
          images?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Paket bundle (ruang + equipment + jasa)
      packages: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          price: string;
          duration_hours: number;
          includes: string[];
          images: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          price?: string;
          duration_hours?: number;
          includes?: string[];
          images?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          price?: string;
          duration_hours?: number;
          includes?: string[];
          images?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Promo & diskon
      promos: {
        Row: {
          id: string;
          title: string;
          description: string;
          discount_label: string;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          code: string;
          valid_from: string;
          valid_until: string;
          usage_limit: number;
          used_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          discount_label?: string;
          discount_type?: "percentage" | "fixed";
          discount_value?: number;
          code?: string;
          valid_from?: string;
          valid_until?: string;
          usage_limit?: number;
          used_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          discount_label?: string;
          discount_type?: "percentage" | "fixed";
          discount_value?: number;
          code?: string;
          valid_from?: string;
          valid_until?: string;
          usage_limit?: number;
          used_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Member & keuntungan
      members: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          member_code: string;
          tier: "basic" | "premium" | "vip";
          points: number;
          joined_at: string;
          expires_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone: string;
          member_code: string;
          tier?: "basic" | "premium" | "vip";
          points?: number;
          joined_at?: string;
          expires_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          member_code?: string;
          tier?: "basic" | "premium" | "vip";
          points?: number;
          joined_at?: string;
          expires_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      member_benefits: {
        Row: {
          id: string;
          benefit: string;
          tier: "basic" | "premium" | "vip" | "all";
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          benefit: string;
          tier?: "basic" | "premium" | "vip" | "all";
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          benefit?: string;
          tier?: "basic" | "premium" | "vip" | "all";
          sort_order?: number;
          created_at?: string;
        };
      };
      // Gallery before/after atau dokumentasi event
      gallery: {
        Row: {
          id: string;
          before_url: string;
          after_url: string;
          label: string;
          category: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          before_url: string;
          after_url: string;
          label?: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          before_url?: string;
          after_url?: string;
          label?: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      // Artikel/Blog
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          cover_image: string;
          category: string;
          tags: string[];
          author: string;
          published_at: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string;
          content?: string;
          cover_image?: string;
          category?: string;
          tags?: string[];
          author?: string;
          published_at?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string;
          content?: string;
          cover_image?: string;
          category?: string;
          tags?: string[];
          author?: string;
          published_at?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Event calendar
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          cover_image: string;
          start_date: string;
          end_date: string;
          location: string;
          capacity: number;
          price: string;
          is_free: boolean;
          status: "draft" | "published" | "cancelled" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string;
          cover_image?: string;
          start_date?: string;
          end_date?: string;
          location?: string;
          capacity?: number;
          price?: string;
          is_free?: boolean;
          status?: "draft" | "published" | "cancelled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          cover_image?: string;
          start_date?: string;
          end_date?: string;
          location?: string;
          capacity?: number;
          price?: string;
          is_free?: boolean;
          status?: "draft" | "published" | "cancelled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
      };
      // Testimonial
      testimonials: {
        Row: {
          id: string;
          customer_name: string;
          customer_role: string;
          content: string;
          rating: number;
          avatar_url: string;
          is_featured: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          customer_role?: string;
          content?: string;
          rating?: number;
          avatar_url?: string;
          is_featured?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          customer_role?: string;
          content?: string;
          rating?: number;
          avatar_url?: string;
          is_featured?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Partner/mitra
      partners: {
        Row: {
          id: string;
          name: string;
          logo_url: string;
          website_url: string;
          description: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string;
          website_url?: string;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string;
          website_url?: string;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // FAQ
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer?: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}