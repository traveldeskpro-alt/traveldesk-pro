import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = "OMR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | Date, locale: string = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale: string = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function getProcessStatusColor(status: string): string {
  switch (status) {
    case "approved":
    case "issued":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "processing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "refund":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

export function getBookingTypeLabel(type: string, t: (k: string) => string): string {
  switch (type) {
    case "air_ticket":
      return t("airTicket");
    case "visa":
      return t("visa");
    case "hotel":
      return t("hotel");
    case "group_tour":
      return t("groupTour");
    default:
      return type;
  }
}

// ── Export utilities ──────────────────────────────────────────────────────────

// Triggers a browser download of a CSV file.
// The UTF-8 BOM (\uFEFF) ensures Excel opens multi-byte characters (Arabic,
// currency symbols, etc.) without garbling the first column.
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const escape = (v: string | number | null | undefined): string => {
    const s = String(v ?? "");
    // Wrap in quotes if the value contains a comma, quote, or newline.
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + lines], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

// Triggers a browser download of a formatted JSON file.
export function exportToJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
