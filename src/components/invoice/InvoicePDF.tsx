'use client';

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, pdf
} from '@react-pdf/renderer';
import { InvoiceRecord, AgencyBranding } from '@/hooks/useDataStore';

Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf',
});

Font.register({
  family: 'InterBold',
  src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
  },
  brandCol: { width: '55%' },
  brandName: {
    fontSize: 20,
    fontFamily: 'InterBold',
    color: '#0f172a',
    marginBottom: 6,
  },
  brandMeta: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
    marginTop: 2,
  },
  invoiceCard: {
    width: '40%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  invoiceCardLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  invoiceCardValue: {
    fontSize: 11,
    color: '#0f172a',
    fontFamily: 'InterBold',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 8,
    fontFamily: 'InterBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusPaid: { backgroundColor: '#dcfce7', color: '#166534' },
  statusPending: { backgroundColor: '#fef3c7', color: '#92400e' },
  statusOverdue: { backgroundColor: '#fee2e2', color: '#991b1b' },
  statusRefund: { backgroundColor: '#f3f4f6', color: '#374151' },
  sectionLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: 'InterBold',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  customerBox: { width: '48%' },
  customerName: {
    fontSize: 13,
    fontFamily: 'InterBold',
    color: '#0f172a',
    marginBottom: 4,
  },
  customerMeta: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  table: {
    marginTop: 8,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderBottomStyle: 'solid',
    paddingVertical: 8,
  },
  tableRowAlt: { backgroundColor: '#fafbfc' },
  th: {
    fontSize: 8,
    color: '#94a3b8',
    fontFamily: 'InterBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: {
    fontSize: 10,
    color: '#334155',
  },
  colDesc: { width: '45%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totalsBox: {
    width: 220,
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 10, color: '#64748b' },
  totalValue: { fontSize: 10, color: '#0f172a' },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'InterBold',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: 'InterBold',
    color: '#2563eb',
  },
  notesSection: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  notesTitle: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'InterBold',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
});

export function InvoiceDocument({ invoice, branding }: { invoice: InvoiceRecord; branding: AgencyBranding }) {
  const statusStyle =
    invoice.status === 'paid' ? styles.statusPaid :
    invoice.status === 'overdue' ? styles.statusOverdue :
    invoice.status === 'refund' ? styles.statusRefund :
    styles.statusPending;

  const symbol = invoice.currency === 'OMR' ? 'ر.ع.' :
    invoice.currency === 'AED' ? 'د.إ' :
    invoice.currency === 'SAR' ? 'ر.س' :
    invoice.currency === 'USD' ? '$' :
    invoice.currency === 'EUR' ? '€' :
    invoice.currency;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandCol}>
            <Text style={styles.brandName}>{branding.name || 'TravelDesk Pro'}</Text>
            {branding.address && <Text style={styles.brandMeta}>{branding.address}</Text>}
            {branding.phone && <Text style={styles.brandMeta}>Phone: {branding.phone}</Text>}
            {branding.email && <Text style={styles.brandMeta}>Email: {branding.email}</Text>}
            {branding.website && <Text style={styles.brandMeta}>Web: {branding.website}</Text>}
            {branding.crNumber && <Text style={styles.brandMeta}>CR: {branding.crNumber}</Text>}
            {branding.vatNumber && <Text style={styles.brandMeta}>VAT: {branding.vatNumber}</Text>}
          </View>
          <View style={styles.invoiceCard}>
            <Text style={styles.invoiceCardLabel}>Invoice Number</Text>
            <Text style={styles.invoiceCardValue}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceCardLabel}>Invoice Date</Text>
            <Text style={styles.invoiceCardValue}>{new Date(invoice.issued_at).toLocaleDateString()}</Text>
            <Text style={styles.invoiceCardLabel}>Due Date</Text>
            <Text style={styles.invoiceCardValue}>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</Text>
            <Text style={styles.invoiceCardLabel}>Status</Text>
            <View style={[styles.statusBadge, statusStyle]}>
              <Text style={statusStyle}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.customerRow}>
          <View style={styles.customerBox}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.customerName}>{invoice.customer_name}</Text>
            {invoice.customer_passport && <Text style={styles.customerMeta}>Passport: {invoice.customer_passport}</Text>}
            {invoice.customer_phone && <Text style={styles.customerMeta}>Phone: {invoice.customer_phone}</Text>}
            {invoice.customer_email && <Text style={styles.customerMeta}>Email: {invoice.customer_email}</Text>}
            {invoice.customer_nationality && <Text style={styles.customerMeta}>Nationality: {invoice.customer_nationality}</Text>}
          </View>
          <View style={styles.customerBox}>
            <Text style={styles.sectionLabel}>Payment Details</Text>
            {branding.bankName && <Text style={styles.customerMeta}>Bank: {branding.bankName}</Text>}
            {branding.accountName && <Text style={styles.customerMeta}>Account Name: {branding.accountName}</Text>}
            {branding.accountNumber && <Text style={styles.customerMeta}>Account #: {branding.accountNumber}</Text>}
            {branding.iban && <Text style={styles.customerMeta}>IBAN: {branding.iban}</Text>}
            {branding.swiftCode && <Text style={styles.customerMeta}>SWIFT: {branding.swiftCode}</Text>}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colDesc]}>Description</Text>
              <Text style={[styles.th, styles.colQty]}>Qty</Text>
              <Text style={[styles.th, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.th, styles.colTotal]}>Total</Text>
            </View>
            {(invoice.items ?? []).map((item, idx) => (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.td, styles.colPrice]}>{symbol} {item.unit_price.toFixed(2)}</Text>
                <Text style={[styles.td, styles.colTotal]}>{symbol} {item.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{symbol} {invoice.subtotal.toFixed(2)}</Text>
          </View>
          {invoice.tax_enabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.tax_percentage}%)</Text>
              <Text style={styles.totalValue}>{symbol} {invoice.tax.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{symbol} {invoice.total.toFixed(2)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Generated by TravelDesk Pro</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(invoice: InvoiceRecord, branding: AgencyBranding): Promise<Blob> {
  const doc = <InvoiceDocument invoice={invoice} branding={branding} />;
  const instance = pdf(doc);
  return await instance.toBlob();
}
