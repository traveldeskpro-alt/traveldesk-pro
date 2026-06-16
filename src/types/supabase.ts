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
          agency_id: string;
          email: string;
          name: string;
          role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'agent' | 'accountant' | 'viewer';
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          email: string;
          name: string;
          role?: 'super_admin' | 'owner' | 'admin' | 'manager' | 'agent' | 'accountant' | 'viewer';
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
