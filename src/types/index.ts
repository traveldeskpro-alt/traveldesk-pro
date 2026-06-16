export type Role = "super_admin" | "owner" | "admin" | "manager" | "agent" | "accountant" | "viewer";

export type BookingType = "air_ticket" | "visa" | "hotel" | "group_tour";

export type PaymentStatus = "paid" | "pending" | "refund";

export type ProcessStatus = "pending" | "processing" | "approved" | "rejected" | "issued";

export type Language = "en" | "ar";

export interface Agency {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  email: string;
  phone: string;
  crNumber?: string;
  currency: string;
  language: Language;
  subscriptionPlan: "starter" | "professional" | "enterprise";
  subscriptionStatus: "active" | "suspended" | "trial";
  createdAt: string;
  branches?: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface AgencyUser {
  id: string;
  agencyId: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  agencyId: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  totalBookings: number;
  totalSpend: number;
  notes?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  agencyId: string;
  customerId: string;
  customerName: string;
  type: BookingType;
  phone: string;
  email?: string;
  pnr?: string;
  ticketNumber?: string;
  airline?: string;
  route?: string;
  visaCountry?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  tourName?: string;
  costPrice: number;
  salePrice: number;
  agentCommission: number;
  currency: string;
  paymentStatus: PaymentStatus;
  processStatus: ProcessStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  agencyId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  bookingIds: string[];
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentStatus: PaymentStatus;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Agent {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  phone?: string;
  commissionRate: number;
  totalSales: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  isActive: boolean;
  createdAt: string;
}

export interface Commission {
  id: string;
  agencyId: string;
  agentId: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: "pending" | "paid";
  paidAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  agencyId: string;
  invoiceId?: string;
  bookingId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  method: "cash" | "card" | "bank_transfer" | "online";
  reference?: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceOmr: number;
  maxUsers: number;
  maxBookings: number | null;
  features: string[];
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  agencyId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  netProfit: number;
  pendingPayments: number;
  totalBookings: number;
  todayBookings: number;
  totalCustomers: number;
  activeAgents: number;
}

export interface ReportSummary {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  bookings: number;
  currency: string;
}
