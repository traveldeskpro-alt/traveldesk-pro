'use client';

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Image, pdf
} from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { InvoiceRecord, AgencyBranding } from '@/hooks/useDataStore';

const COLORS = {
  navy: '#0F274A',
  blue: '#1E4ED8',
  orange: '#F59E0B',
  green: '#15803D',
  red: '#DC2626',
  text: '#111827',
  muted: '#4B5563',
  lightText: '#6B7280',
  border: '#D9E1EC',
  soft: '#F8FAFC',
  row: '#FBFCFE',
  white: '#FFFFFF',
};

const DEFAULT_TERMS = [
  'Payment due on or before due date.',
  'Late payments may incur charges.',
  'No refunds on non-refundable services.',
  'Please share payment confirmation via WhatsApp or Email.',
  'Thank you for choosing our agency.',
];

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 26,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 17,
    borderBottomWidth: 1.2,
    borderBottomColor: COLORS.border,
    borderBottomStyle: 'solid',
  },
  headerBrand: { width: '24%', paddingRight: 14 },
  headerInfo: {
    width: '46%',
    paddingHorizontal: 16,
  },
  headerContact: {
    width: '30%',
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    borderLeftStyle: 'solid',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 96,
    height: 58,
    objectFit: 'contain',
    marginRight: 10,
  },
  fallbackLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: COLORS.navy,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fallbackLogoText: {
    color: COLORS.navy,
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: COLORS.navy,
    lineHeight: 1.15,
    marginBottom: 6,
  },
  brandAccent: { color: COLORS.orange },
  tagline: {
    marginTop: 3,
    fontSize: 6.8,
    color: COLORS.muted,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  companyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11.5,
    color: COLORS.navy,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  iconBox: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  iconText: {
    fontSize: 5.5,
    color: COLORS.navy,
    fontFamily: 'Helvetica-Bold',
  },
  contactText: {
    flex: 1,
    fontSize: 8,
    color: COLORS.text,
    lineHeight: 1.3,
  },
  headerMeta: {
    fontSize: 8.3,
    color: COLORS.text,
    lineHeight: 1.35,
    marginBottom: 3,
  },
  cards: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 18,
  },
  infoCard: {
    width: '33.333%',
    minHeight: 104,
    paddingRight: 14,
    paddingLeft: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    borderRightStyle: 'solid',
  },
  infoCardFirst: { paddingLeft: 0 },
  infoCardLast: { borderRightWidth: 0, paddingRight: 0 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    color: COLORS.navy,
    textTransform: 'uppercase',
    marginBottom: 13,
  },
  customerName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  rowLabel: {
    width: 68,
    color: COLORS.text,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  rowColon: {
    width: 8,
    color: COLORS.muted,
    fontSize: 8,
  },
  rowValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 8,
    lineHeight: 1.25,
  },
  invoiceTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 21,
    color: COLORS.navy,
    marginBottom: 15,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.navy,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  th: {
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF3',
    borderBottomStyle: 'solid',
  },
  tableRowAlt: { backgroundColor: COLORS.row },
  td: { fontSize: 8.2, color: COLORS.text, lineHeight: 1.25 },
  colNum: { width: '7%', textAlign: 'center' },
  colDesc: { width: '38%' },
  colQty: { width: '8%', textAlign: 'center' },
  colUnit: { width: '17%', textAlign: 'right' },
  colTax: { width: '14%', textAlign: 'right' },
  colAmount: { width: '16%', textAlign: 'right' },
  totalsWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  totalsBox: { width: 260 },
  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: 'solid',
    paddingVertical: 5.5,
  },
  totalLabel: {
    width: '54%',
    fontSize: 8.3,
    color: COLORS.text,
    fontFamily: 'Helvetica-Bold',
  },
  totalCurrency: {
    width: '16%',
    fontSize: 8.3,
    color: COLORS.text,
    textAlign: 'right',
  },
  totalValue: {
    width: '30%',
    fontSize: 8.3,
    color: COLORS.text,
    textAlign: 'right',
  },
  discountValue: { color: COLORS.red },
  grandTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingVertical: 8.5,
    paddingHorizontal: 10,
    marginTop: 7,
  },
  grandTotalLabel: {
    flex: 1,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    textTransform: 'uppercase',
  },
  grandTotalCurrency: {
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginRight: 12,
  },
  grandTotalValue: {
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
  },
  whatsAppShare: {
    width: 260,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 8,
    marginBottom: 18,
  },
  whatsAppIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  whatsAppIconText: {
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  whatsAppText: { flex: 1 },
  whatsAppTitle: {
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
    fontSize: 8.5,
    marginBottom: 2,
  },
  whatsAppCopy: {
    color: COLORS.text,
    fontSize: 7.2,
    lineHeight: 1.2,
  },
  whatsAppQr: {
    width: 42,
    height: 42,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
    padding: 2,
  },
  bottom: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopStyle: 'solid',
    paddingTop: 17,
    minHeight: 116,
  },
  bottomCol: {
    width: '35%',
    paddingRight: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    borderRightStyle: 'solid',
  },
  qrCol: {
    width: '26%',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    borderRightStyle: 'solid',
  },
  termsCol: { width: '39%', paddingLeft: 14 },
  bankRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bankLabel: {
    width: 78,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    fontSize: 7.7,
  },
  bankValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 7.7,
    lineHeight: 1.25,
  },
  qrImage: {
    width: 82,
    height: 82,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
    padding: 4,
  },
  qrPlaceholder: {
    width: 82,
    height: 82,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontSize: 7,
    color: COLORS.lightText,
    textAlign: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4.5,
  },
  bullet: {
    width: 8,
    color: COLORS.navy,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  bulletText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 7.5,
    lineHeight: 1.25,
  },
  emptyText: {
    color: COLORS.lightText,
    fontSize: 7.7,
    lineHeight: 1.3,
  },
  footer: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 13,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.navy,
    borderTopStyle: 'solid',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerItem: {
    fontSize: 7.3,
    color: COLORS.navy,
    marginHorizontal: 12,
  },
  generated: {
    marginTop: 4,
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 6.8,
  },
});

type OptionalInvoice = InvoiceRecord & Record<string, unknown>;

function isPresent(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function decimalsFor(currency: string) {
  return currency === 'OMR' ? 3 : 2;
}

function formatAmount(value: number, currency: string) {
  return value.toFixed(decimalsFor(currency));
}

function statusColor(status: InvoiceRecord['status']) {
  if (status === 'paid') return COLORS.green;
  if (status === 'overdue') return COLORS.red;
  return COLORS.orange;
}

function getOptionalString(invoice: InvoiceRecord, keys: string[]) {
  const source = invoice as OptionalInvoice;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function getBookingReference(invoice: InvoiceRecord) {
  return getOptionalString(invoice, ['booking_reference', 'bookingReference', 'booking_ref']) ||
    invoice.reference_number ||
    invoice.agency_branding?.reference_number ||
    invoice.id.slice(0, 8).toUpperCase();
}

function getReferenceLabel(invoice: InvoiceRecord) {
  const type = invoice.reference_type || invoice.agency_branding?.reference_type || 'Booking Reference';
  if (type === 'Other') return invoice.custom_reference_label || invoice.agency_branding?.custom_reference_label || 'Other';
  return type;
}

function getServiceType(invoice: InvoiceRecord) {
  return getOptionalString(invoice, ['service_type', 'serviceType', 'booking_type', 'bookingType']) ||
    invoice.items?.[0]?.description ||
    '';
}

function getTravelDate(invoice: InvoiceRecord) {
  const value = getOptionalString(invoice, ['travel_date', 'travelDate', 'departure_date', 'departureDate']);
  return formatDate(value);
}

function getAgentName(invoice: InvoiceRecord) {
  return getOptionalString(invoice, ['agent_name', 'agentName', 'created_by_name', 'createdByName']);
}

function getBookingStatus(invoice: InvoiceRecord) {
  return getOptionalString(invoice, ['booking_status', 'bookingStatus']) ||
    invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
}

function splitNotes(notes?: string) {
  if (!notes?.trim()) return DEFAULT_TERMS;
  return notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildQrPayload(invoice: InvoiceRecord, branding: AgencyBranding) {
  return [
    `Invoice Number: ${invoice.invoice_number}`,
    `Customer Name: ${invoice.customer_name}`,
    `Agency Name: ${branding.name || 'TravelDesk Pro'}`,
    `Total Amount: ${invoice.currency} ${formatAmount(invoice.total, invoice.currency)}`,
    `Invoice Date: ${formatDate(invoice.issued_at)}`,
  ].join('\n');
}

function buildWhatsAppShareUrl(invoice: InvoiceRecord, branding: AgencyBranding) {
  const clean = (branding.phone || '').replace(/\D/g, '').replace(/^0/, '');
  const message = [
    `Hello ${invoice.customer_name},`,
    '',
    'Please find your invoice.',
    '',
    `Invoice No: ${invoice.invoice_number}`,
    `Reference: ${getBookingReference(invoice)}`,
    `Amount: ${invoice.currency} ${formatAmount(invoice.total, invoice.currency)}`,
    '',
    'Thank you.',
    '',
    branding.name || 'TravelDesk Pro',
  ].join('\n');
  return clean ? `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}` : '';
}

function chunkInvoiceItems(items: InvoiceRecord['items']) {
  const firstPageSize = 12;
  const nextPageSize = 18;
  const source = items.length ? items : [{ description: 'Invoice item', quantity: 1, unit_price: 0, total: 0 }];
  const chunks: InvoiceRecord['items'][] = [source.slice(0, firstPageSize)];
  let cursor = firstPageSize;
  while (cursor < source.length) {
    chunks.push(source.slice(cursor, cursor + nextPageSize));
    cursor += nextPageSize;
  }
  return chunks;
}

function InfoRow({ label, value, noWrap = false }: { label: string; value?: string | null; noWrap?: boolean }) {
  if (!isPresent(value)) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowColon}>:</Text>
      <Text style={styles.rowValue} wrap={!noWrap}>{value}</Text>
    </View>
  );
}

function ContactLine({ icon, value }: { icon: string; value?: string | null }) {
  if (!isPresent(value)) return null;
  return (
    <View style={styles.contactLine}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.contactText}>{value}</Text>
    </View>
  );
}

function HeaderMeta({ value }: { value?: string | null }) {
  if (!isPresent(value)) return null;
  return <Text style={styles.headerMeta}>{value}</Text>;
}

function BankRow({ label, value }: { label: string; value?: string }) {
  if (!isPresent(value)) return null;
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankLabel}>{label}</Text>
      <Text style={styles.rowColon}>:</Text>
      <Text style={styles.bankValue}>{value}</Text>
    </View>
  );
}

function InvoiceDocument({
  invoice,
  branding,
  qrCodeDataUrl,
  whatsAppQrDataUrl,
}: {
  invoice: InvoiceRecord;
  branding: AgencyBranding;
  qrCodeDataUrl?: string;
  whatsAppQrDataUrl?: string;
}) {
  const currency = invoice.currency || 'OMR';
  const itemTaxRate = invoice.tax_enabled ? invoice.tax_percentage / 100 : 0;
  const discount = 0;
  const taxableAmount = Math.max(invoice.subtotal - discount, 0);
  const amountPaid = invoice.status === 'paid' ? invoice.total : 0;
  const totalLabel = invoice.status === 'paid' ? 'Total Amount' : 'Total Due Amount';
  const bankFields = [
    branding.bankName,
    branding.accountName,
    branding.accountNumber,
    branding.iban,
    branding.swiftCode,
  ].some(isPresent);
  const footerItems = [branding.phone, branding.email, branding.website].filter(isPresent);
  const itemChunks = chunkInvoiceItems(invoice.items ?? []);
  const itemOffsets = itemChunks.reduce<number[]>((offsets, chunk, idx) => {
    offsets.push(idx === 0 ? 0 : offsets[idx - 1] + itemChunks[idx - 1].length);
    return offsets;
  }, []);

  return (
    <Document>
      {itemChunks.map((chunk, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === itemChunks.length - 1;
        const offset = itemOffsets[pageIndex];
        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            {isFirstPage ? (
              <>
                <View style={styles.header}>
                  <View style={styles.headerBrand}>
                    {branding.logoUrl ? (
                      <Image src={branding.logoUrl} style={styles.logo} />
                    ) : (
                      <View style={styles.fallbackLogo}>
                        <Text style={styles.fallbackLogoText}>TDP</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.companyName}>{branding.name || 'TravelDesk Pro'}</Text>
                    <HeaderMeta value={branding.crNumber ? `CR No.: ${branding.crNumber}` : ''} />
                    <HeaderMeta value={branding.vatNumber ? `VAT No.: ${branding.vatNumber}` : ''} />
                    <HeaderMeta value={branding.address || ''} />
                  </View>
                  <View style={styles.headerContact}>
                    <ContactLine icon="☎" value={branding.phone} />
                    <ContactLine icon="✉" value={branding.email} />
                    <ContactLine icon="⌾" value={branding.website} />
                    <ContactLine icon="⌖" value={branding.address} />
                  </View>
                </View>
                <View style={styles.cards}>
                  <View style={[styles.infoCard, styles.infoCardFirst]}>
                    <Text style={styles.sectionTitle}>Bill To</Text>
                    <Text style={styles.customerName}>{invoice.customer_name}</Text>
                    <InfoRow label="Phone" value={invoice.customer_phone} />
                    <InfoRow label="Email" value={invoice.customer_email} noWrap />
                    <InfoRow label="Passport No." value={invoice.customer_passport} />
                    <InfoRow label="Nationality" value={invoice.customer_nationality} />
                  </View>
                  <View style={styles.infoCard}>
                    <Text style={styles.sectionTitle}>Booking Summary</Text>
                    <InfoRow label="Reference Type" value={getReferenceLabel(invoice)} />
                    <InfoRow label="Reference No." value={getBookingReference(invoice)} />
                    <InfoRow label="Travel Date" value={getTravelDate(invoice)} />
                    <InfoRow label="Service Type" value={getServiceType(invoice)} />
                    <InfoRow label="Agent Name" value={getAgentName(invoice)} />
                    <InfoRow label="Status" value={getBookingStatus(invoice)} />
                  </View>
                  <View style={[styles.infoCard, styles.infoCardLast]}>
                    <Text style={styles.invoiceTitle}>INVOICE</Text>
                    <InfoRow label="Invoice No." value={invoice.invoice_number} />
                    <InfoRow label="Issue Date" value={formatDate(invoice.issued_at)} />
                    <InfoRow label="Due Date" value={formatDate(invoice.due_date)} />
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Payment Status</Text>
                      <Text style={styles.rowColon}>:</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor(invoice.status) }]}>
                        <Text style={styles.statusText}>{invoice.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.header}>
                <View style={styles.headerBrand}>
                  <Text style={styles.companyName}>{branding.name || 'TravelDesk Pro'}</Text>
                </View>
                <View style={styles.headerInfo}>
                  <HeaderMeta value={`Invoice No.: ${invoice.invoice_number}`} />
                  <HeaderMeta value={`Customer: ${invoice.customer_name}`} />
                </View>
                <View style={styles.headerContact}>
                  <HeaderMeta value={`Page ${pageIndex + 1} of ${itemChunks.length}`} />
                  <HeaderMeta value="Items continued" />
                </View>
              </View>
            )}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.colNum]}>#</Text>
                <Text style={[styles.th, styles.colDesc]}>Description</Text>
                <Text style={[styles.th, styles.colQty]}>Qty</Text>
                <Text style={[styles.th, styles.colUnit]}>Unit Price ({currency})</Text>
                <Text style={[styles.th, styles.colTax]}>VAT {invoice.tax_enabled ? invoice.tax_percentage : 0}% ({currency})</Text>
                <Text style={[styles.th, styles.colAmount]}>Amount ({currency})</Text>
              </View>
              {chunk.map((item, idx) => {
                const globalIndex = offset + idx;
                const lineTax = item.total * itemTaxRate;
                return (
                  <View key={globalIndex} style={[styles.tableRow, globalIndex % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
                    <Text style={[styles.td, styles.colNum]}>{globalIndex + 1}</Text>
                    <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
                    <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                    <Text style={[styles.td, styles.colUnit]}>{formatAmount(item.unit_price, currency)}</Text>
                    <Text style={[styles.td, styles.colTax]}>{invoice.tax_enabled ? formatAmount(lineTax, currency) : '-'}</Text>
                    <Text style={[styles.td, styles.colAmount]}>{formatAmount(item.total, currency)}</Text>
                  </View>
                );
              })}
            </View>
            {isLastPage && (
              <>
                <View style={styles.totalsWrap}>
                  <View style={styles.totalsBox}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal</Text>
                      <Text style={styles.totalCurrency}>{currency}</Text>
                      <Text style={styles.totalValue}>{formatAmount(invoice.subtotal, currency)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Discount</Text>
                      <Text style={styles.totalCurrency}>{currency}</Text>
                      <Text style={[styles.totalValue, styles.discountValue]}>{formatAmount(discount, currency)}</Text>
                    </View>
                    {invoice.tax_enabled && (
                      <>
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Taxable Amount</Text>
                          <Text style={styles.totalCurrency}>{currency}</Text>
                          <Text style={styles.totalValue}>{formatAmount(taxableAmount, currency)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>VAT ({invoice.tax_percentage}%)</Text>
                          <Text style={styles.totalCurrency}>{currency}</Text>
                          <Text style={styles.totalValue}>{formatAmount(invoice.tax, currency)}</Text>
                        </View>
                      </>
                    )}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Amount Paid</Text>
                      <Text style={styles.totalCurrency}>{currency}</Text>
                      <Text style={styles.totalValue}>{formatAmount(amountPaid, currency)}</Text>
                    </View>
                    <View style={styles.grandTotal}>
                      <Text style={styles.grandTotalLabel}>{totalLabel}</Text>
                      <Text style={styles.grandTotalCurrency}>{currency}</Text>
                      <Text style={styles.grandTotalValue}>{formatAmount(invoice.total, currency)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.whatsAppShare}>
                  <View style={styles.whatsAppIcon}>
                    <Text style={styles.whatsAppIconText}>W</Text>
                  </View>
                  <View style={styles.whatsAppText}>
                    <Text style={styles.whatsAppTitle}>Send Invoice via WhatsApp</Text>
                    <Text style={styles.whatsAppCopy}>Click or scan the QR code to send this invoice to your customer.</Text>
                  </View>
                  {whatsAppQrDataUrl && <Image src={whatsAppQrDataUrl} style={styles.whatsAppQr} />}
                </View>
                <View style={styles.bottom}>
          <View style={styles.bottomCol}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            {bankFields ? (
              <>
                <BankRow label="Bank Name" value={branding.bankName} />
                <BankRow label="Account Name" value={branding.accountName} />
                <BankRow label="Account Number" value={branding.accountNumber} />
                <BankRow label="IBAN" value={branding.iban} />
                <BankRow label="SWIFT / BIC" value={branding.swiftCode} />
              </>
            ) : (
              <Text style={styles.emptyText}>Bank details not configured.</Text>
            )}
          </View>

          <View style={styles.qrCol}>
            <Text style={styles.sectionTitle}>Scan To Pay / View Invoice</Text>
            {qrCodeDataUrl ? (
              <Image src={qrCodeDataUrl} style={styles.qrImage} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR unavailable</Text>
              </View>
            )}
          </View>

          <View style={styles.termsCol}>
            <Text style={styles.sectionTitle}>Terms & Notes</Text>
            {splitNotes(invoice.notes).map((note) => (
              <View key={note} style={styles.bulletRow}>
                <Text style={styles.bullet}>-</Text>
                <Text style={styles.bulletText}>{note}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            {footerItems.map((item) => (
              <Text key={item} style={styles.footerItem}>{item}</Text>
            ))}
          </View>
          <Text style={styles.generated}>Generated by TravelDesk Pro</Text>
        </View>
              </>
            )}
          </Page>
        );
      })}
    </Document>
  );
}

export async function generateInvoicePDF(invoice: InvoiceRecord, branding: AgencyBranding): Promise<Blob> {
  let qrCodeDataUrl = '';
  let whatsAppQrDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(buildQrPayload(invoice, branding), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 170,
      color: {
        dark: COLORS.navy,
        light: COLORS.white,
      },
    });
  } catch {
    qrCodeDataUrl = '';
  }
  try {
    const whatsAppUrl = buildWhatsAppShareUrl(invoice, branding);
    if (whatsAppUrl) {
      whatsAppQrDataUrl = await QRCode.toDataURL(whatsAppUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 120,
        color: {
          dark: COLORS.navy,
          light: COLORS.white,
        },
      });
    }
  } catch {
    whatsAppQrDataUrl = '';
  }

  const doc = <InvoiceDocument invoice={invoice} branding={branding} qrCodeDataUrl={qrCodeDataUrl} whatsAppQrDataUrl={whatsAppQrDataUrl} />;
  const instance = pdf(doc);
  return await instance.toBlob();
}
