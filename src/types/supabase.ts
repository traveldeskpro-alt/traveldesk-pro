export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          cr_number: string | null;
          address: string | null;
          logo_url: string | null;
          currency: string;
          language: string;
          status: 'active' | 'trial' | 'suspended';
          plan: 'starter' | 'professional' | 'enterprise';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          cr_number?: string | null;
          address?: string | null;
          logo_url?: string | null;
          currency?: string;
          language?: string;
          status?: 'active' | 'trial' | 'suspended';
          plan?: 'starter' | 'professional' | 'enterprise';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          cr_number?: string | null;
          address?: string | null;
          logo_url?: string | null;
          currency?: string;
          language?: string;
          status?: 'active' | 'trial' | 'suspended';
          plan?: 'starter' | 'professional' | 'enterprise';
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          agency_id: string | null;
          email: string;
          name: string;
          role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'agent' | 'accountant' | 'viewer';
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id?: string | null;
          email: string;
          name: string;
          role?: 'super_admin' | 'owner' | 'admin' | 'manager' | 'agent' | 'accountant' | 'viewer';
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string | null;
          email?: string;
          name?: string;
          role?: 'super_admin' | 'owner' | 'admin' | 'manager' | 'agent' | 'accountant' | 'viewer';
          active?: boolean;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          phone: string;
          whatsapp: string | null;
          email: string;
          passport_number: string | null;
          passport_expiry: string | null;
          nationality: string;
          total_bookings: number;
          total_spend: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          name: string;
          phone: string;
          whatsapp?: string | null;
          email: string;
          passport_number?: string | null;
          passport_expiry?: string | null;
          nationality?: string;
          total_bookings?: number;
          total_spend?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          name?: string;
          phone?: string;
          whatsapp?: string | null;
          email?: string;
          passport_number?: string | null;
          passport_expiry?: string | null;
          nationality?: string;
          total_bookings?: number;
          total_spend?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          agency_id: string;
          customer_id: string;
          customer_name: string;
          type: 'air_ticket' | 'visa' | 'hotel' | 'group_tour';
          pnr: string | null;
          ticket_number: string | null;
          airline: string | null;
          route: string | null;
          visa_country: string | null;
          hotel_name: string | null;
          check_in: string | null;
          check_out: string | null;
          tour_name: string | null;
          cost_price: number;
          sale_price: number;
          agent_commission: number;
          currency: string;
          payment_status: 'paid' | 'pending' | 'refund';
          process_status: 'pending' | 'processing' | 'approved' | 'rejected' | 'issued';
          agent_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          customer_id: string;
          customer_name: string;
          type: 'air_ticket' | 'visa' | 'hotel' | 'group_tour';
          pnr?: string | null;
          ticket_number?: string | null;
          airline?: string | null;
          route?: string | null;
          visa_country?: string | null;
          hotel_name?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          tour_name?: string | null;
          cost_price?: number;
          sale_price?: number;
          agent_commission?: number;
          currency?: string;
          payment_status?: 'paid' | 'pending' | 'refund';
          process_status?: 'pending' | 'processing' | 'approved' | 'rejected' | 'issued';
          agent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          customer_id?: string;
          customer_name?: string;
          type?: 'air_ticket' | 'visa' | 'hotel' | 'group_tour';
          pnr?: string | null;
          ticket_number?: string | null;
          airline?: string | null;
          route?: string | null;
          visa_country?: string | null;
          hotel_name?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          tour_name?: string | null;
          cost_price?: number;
          sale_price?: number;
          agent_commission?: number;
          currency?: string;
          payment_status?: 'paid' | 'pending' | 'refund';
          process_status?: 'pending' | 'processing' | 'approved' | 'rejected' | 'issued';
          agent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          agency_id: string;
          customer_id: string;
          customer_name: string;
          invoice_number: string;
          items: Json;
          subtotal: number;
          tax: number;
          total: number;
          currency: string;
          status: 'paid' | 'pending' | 'refund' | 'overdue';
          issued_at: string;
          due_date: string;
          paid_at: string | null;
          agency_branding: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          customer_id: string;
          customer_name: string;
          invoice_number: string;
          items: Json;
          subtotal?: number;
          tax?: number;
          total: number;
          currency?: string;
          status?: 'paid' | 'pending' | 'refund' | 'overdue';
          issued_at?: string;
          due_date?: string;
          paid_at?: string | null;
          agency_branding?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          customer_id?: string;
          customer_name?: string;
          invoice_number?: string;
          items?: Json;
          subtotal?: number;
          tax?: number;
          total?: number;
          currency?: string;
          status?: 'paid' | 'pending' | 'refund' | 'overdue';
          issued_at?: string;
          due_date?: string;
          paid_at?: string | null;
          agency_branding?: Json | null;
          created_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          email: string;
          phone: string;
          commission_rate: number;
          total_sales: number;
          commission_earned: number;
          commission_paid: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          name: string;
          email: string;
          phone: string;
          commission_rate?: number;
          total_sales?: number;
          commission_earned?: number;
          commission_paid?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          commission_rate?: number;
          total_sales?: number;
          commission_earned?: number;
          commission_paid?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          agency_id: string;
          invoice_id: string;
          amount: number;
          currency: string;
          method: 'cash' | 'card' | 'bank_transfer' | 'online';
          reference: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          invoice_id: string;
          amount: number;
          currency?: string;
          method?: 'cash' | 'card' | 'bank_transfer' | 'online';
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          invoice_id?: string;
          amount?: number;
          currency?: string;
          method?: 'cash' | 'card' | 'bank_transfer' | 'online';
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          agency_id: string;
          title: string;
          description: string | null;
          start_at: string;
          end_at: string | null;
          type: 'meeting' | 'deadline' | 'reminder' | 'travel' | 'booking';
          customer_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          title: string;
          description?: string | null;
          start_at: string;
          end_at?: string | null;
          type?: 'meeting' | 'deadline' | 'reminder' | 'travel' | 'booking';
          customer_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          title?: string;
          description?: string | null;
          start_at?: string;
          end_at?: string | null;
          type?: 'meeting' | 'deadline' | 'reminder' | 'travel' | 'booking';
          customer_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: 'starter' | 'professional' | 'enterprise';
          name: string;
          monthly_price: number;
          user_limit: number | null;
          booking_limit: number | null;
          features: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: 'starter' | 'professional' | 'enterprise';
          name: string;
          monthly_price: number;
          user_limit?: number | null;
          booking_limit?: number | null;
          features?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: 'starter' | 'professional' | 'enterprise';
          name?: string;
          monthly_price?: number;
          user_limit?: number | null;
          booking_limit?: number | null;
          features?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          created_at: string;
          admin_user_id: string | null;
          admin_email: string;
          action: string;
          target_agency_id: string | null;
          target_agency_name: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          admin_user_id?: string | null;
          admin_email: string;
          action: string;
          target_agency_id?: string | null;
          target_agency_name?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          admin_user_id?: string | null;
          admin_email?: string;
          action?: string;
          target_agency_id?: string | null;
          target_agency_name?: string | null;
          notes?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      saas_admin_activate_agency: {
        Args: { p_agency_id: string; p_notes?: string | null };
        Returns: Database['public']['Tables']['agencies']['Row'];
      };
      saas_admin_change_agency_plan: {
        Args: { p_agency_id: string; p_plan_id: string; p_notes?: string | null };
        Returns: Database['public']['Tables']['agencies']['Row'];
      };
      saas_admin_delete_agency: {
        Args: { p_agency_id: string; p_notes?: string | null };
        Returns: void;
      };
      saas_admin_log_action: {
        Args: {
          p_action: string;
          p_target_agency_id?: string | null;
          p_target_agency_name?: string | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
      saas_admin_set_agency_status: {
        Args: { p_agency_id: string; p_status: string; p_notes?: string | null };
        Returns: Database['public']['Tables']['agencies']['Row'];
      };
      saas_admin_suspend_agency: {
        Args: { p_agency_id: string; p_notes?: string | null };
        Returns: Database['public']['Tables']['agencies']['Row'];
      };
      saas_admin_update_agency: {
        Args: {
          p_agency_id: string;
          p_name: string;
          p_email: string;
          p_phone: string;
          p_status: string;
          p_notes?: string | null;
        };
        Returns: Database['public']['Tables']['agencies']['Row'];
      };
      saas_admin_update_subscription_plan: {
        Args: {
          p_plan_id: string;
          p_name: string;
          p_monthly_price: number;
          p_user_limit: number | null;
          p_booking_limit: number | null;
          p_features: string[];
          p_notes?: string | null;
        };
        Returns: Database['public']['Tables']['subscription_plans']['Row'];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
