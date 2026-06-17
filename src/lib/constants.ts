export const CURRENCIES = [
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع." },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "د.ب" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
];

export function getCurrencySymbol(code: string) {
  return CURRENCIES.find(c => c.code === code)?.symbol || code;
}

export const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceOmr: 30,
    maxUsers: 3,
    maxBookings: 300,
    features: [
      "3 users",
      "300 bookings/month",
      "Basic invoices",
      "Basic reports",
    ],
    isActive: true,
  },
  {
    id: "professional",
    name: "Professional",
    priceOmr: 40,
    maxUsers: 10,
    maxBookings: null,
    features: [
      "10 users",
      "Unlimited bookings",
      "Advanced reports",
      "WhatsApp invoice sharing",
      "Agent commission tracking",
    ],
    isActive: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceOmr: 150,
    maxUsers: null,
    maxBookings: null,
    features: [
      "Multi-branch",
      "White-label branding",
      "Custom domain",
      "Priority support",
      "API integrations",
    ],
    isActive: true,
  },
];

export const ROLES = [
  { id: "super_admin", label: "Super Admin" },
  { id: "owner", label: "Owner" },
  { id: "admin", label: "Admin" },
  { id: "manager", label: "Manager" },
  { id: "agent", label: "Agent" },
  { id: "accountant", label: "Accountant" },
  { id: "viewer", label: "Viewer" },
];

export const BOOKING_TYPES = [
  { id: "air_ticket", label: "Air Ticket" },
  { id: "visa", label: "Visa" },
  { id: "hotel", label: "Hotel" },
  { id: "group_tour", label: "Group Tour" },
];

export const PAYMENT_STATUSES = [
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "refund", label: "Refund" },
];

export const PROCESS_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "issued", label: "Issued" },
];

export const DEFAULT_CURRENCY = "OMR";
export const DEFAULT_LANGUAGE = "en";

export const INVOICE_STATUS_COLORS = {
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  overdue: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  refund: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
} as const;

export const WHATSAPP_PROVIDERS = [
  { id: "wame", label: "WhatsApp Web (wa.me)", requiresKey: false },
  { id: "ultramsg", label: "UltraMsg", requiresKey: true, requiresInstance: true },
  { id: "greenapi", label: "Green API", requiresKey: true, requiresInstance: true },
  { id: "cloudapi", label: "WhatsApp Cloud API (Meta)", requiresKey: true, requiresInstance: false },
];

export const WHATSAPP_TEMPLATES = {
  booking_confirmation: {
    name: "Booking Confirmation",
    body: "Dear {{customer_name}},\n\nYour booking has been confirmed.\n\nReference: {{booking_reference}}\n\nThank you for choosing {{agency_name}}.",
  },
  payment_reminder: {
    name: "Payment Reminder",
    body: "Dear {{customer_name}},\n\nYour invoice {{invoice_number}} is still pending.\n\nAmount Due: {{amount}}\n\nPlease contact us if you need assistance.",
  },
  invoice_message: {
    name: "Invoice Message",
    body: "Hello {{customer_name}},\n\nYour invoice {{invoice_number}} from {{agency_name}} is ready.\n\nTotal Amount:\n{{total_amount}}\n\nThank you.",
  },
  visa_reminder: {
    name: "Visa Reminder",
    body: "Dear {{customer_name}},\n\nThis is a reminder that your visa application is being processed.\n\nReference: {{booking_reference}}\n\nProcessing time: 5 working days.\n\n{{agency_name}}",
  },
  thank_you: {
    name: "Thank You Message",
    body: "Dear {{customer_name}},\n\nThank you for choosing {{agency_name}}. We appreciate your business and look forward to serving you again.\n\nSafe travels!",
  },
} as const;

export const DEFAULT_INVOICE_PREFIX = "INV";
