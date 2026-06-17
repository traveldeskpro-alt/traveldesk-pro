import { WHATSAPP_TEMPLATES } from '@/lib/constants';
import { InvoiceRecord, WhatsAppSettings, AgencyBranding, BookingRecord } from '@/hooks/useDataStore';

export function interpolateTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

export function buildMessage(
  type: keyof typeof WHATSAPP_TEMPLATES,
  vars: Record<string, string>
): { body: string; url: string } {
  const template = WHATSAPP_TEMPLATES[type];
  const body = interpolateTemplate(template.body, vars);
  return { body, url: encodeURIComponent(body) };
}

export function openWhatsAppWeb(phone: string, message: string): void {
  const clean = phone.replace(/\D/g, '').replace(/^0/, '');
  const url = `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function formatWhatsAppAmount(amount: number, currency: string): string {
  return amount.toFixed(currency === 'OMR' ? 3 : 2);
}

export function sendViaAPI(
  settings: WhatsAppSettings,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (settings.provider === 'wame' || !settings.enabled) {
      openWhatsAppWeb(phone, message);
      resolve({ success: true });
      return;
    }

    const clean = phone.replace(/\D/g, '').replace(/^0/, '');

    if (settings.provider === 'ultramsg') {
      fetch(`https://api.ultramsg.com/${settings.instanceId}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.apiKey,
          to: clean,
          body: message,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.sent === 'true') resolve({ success: true });
          else resolve({ success: false, error: data.message || 'UltraMsg failed' });
        })
        .catch((err) => resolve({ success: false, error: err.message }));
    } else if (settings.provider === 'greenapi') {
      fetch(`https://api.green-api.com/waInstance${settings.instanceId}/sendMessage/${settings.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${clean}@c.us`,
          message,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.idMessage) resolve({ success: true });
          else resolve({ success: false, error: data.message || 'Green API failed' });
        })
        .catch((err) => resolve({ success: false, error: err.message }));
    } else {
      resolve({ success: false, error: 'Provider not supported yet' });
    }
  });
}

export function getInvoiceWhatsAppVars(
  invoice: InvoiceRecord,
  branding: AgencyBranding
): Record<string, string> {
  return {
    customer_name: invoice.customer_name,
    invoice_number: invoice.invoice_number,
    amount: `${formatWhatsAppAmount(invoice.total, invoice.currency)} ${invoice.currency}`,
    total_amount: `${invoice.currency} ${formatWhatsAppAmount(invoice.total, invoice.currency)}`,
    due_date: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—',
    agency_name: branding.name || 'TravelDesk Pro',
  };
}

export function getBookingWhatsAppVars(
  booking: BookingRecord,
  branding: AgencyBranding
): Record<string, string> {
  return {
    customer_name: booking.customer_name,
    booking_reference: booking.id.slice(0, 8).toUpperCase(),
    agency_name: branding.name || 'TravelDesk Pro',
  };
}
