import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { summaryLines, summaryTotals, type SummarySource } from '@/lib/checkout/summary';

// Bon de réservation (002, T060, FR-024) : une colonne, corps ≥ 11 pt, sections bilingues
// (libellés FR / EN), récapitulatif de `summaryLines` (FR-010), conditions d'annulation figées,
// coordonnées de l'agence (NAP des réglages). Polices standard PDF (Helvetica, encodage
// WinAnsi) : les caractères hors de cet encodage sont remplacés (`pdfSafe`).

export type VoucherData = {
  reference: string;
  locale: 'fr' | 'en';
  traveller: { firstName: string; lastName: string; whatsapp: string; email: string };
  status: string;
  source: SummarySource;
  availability: Record<string, string>;
  policies: { title: string; summary: string }[];
  agency: { name: string; address: string; phone?: string; whatsapp?: string; email?: string };
};

const MANGROVE = '#0f2a24';
const OCRE = '#9e4521';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, color: MANGROVE, fontFamily: 'Helvetica', lineHeight: 1.4 },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 12 },
  section: { marginTop: 14 },
  heading: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: OCRE, marginBottom: 4 },
  line: { marginBottom: 8 },
  strong: { fontFamily: 'Helvetica-Bold' },
  muted: { color: '#4a5a55' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

/** Espaces insécables et symboles hors WinAnsi → équivalents sûrs. */
export const pdfSafe = (value: string): string =>
  value.replace(/[  ]/g, ' ').replace(/≈/g, '~').replace(/[’]/g, "'").replace(/[→]/g, '->');

const AVAILABILITY: Record<string, string> = {
  pending: 'A confirmer / To be confirmed',
  confirmed: 'Confirme / Confirmed',
  unavailable: 'Indisponible / Unavailable',
  replaced: 'Remplace / Replaced',
};

const Label = ({ fr, en }: { fr: string; en: string }) => (
  <Text style={styles.heading}>
    {fr} / {en}
  </Text>
);

export const Voucher = ({ data }: { data: VoucherData }) => {
  const lines = summaryLines(data.source).filter((line) => !line.cancelled);
  const totals = summaryTotals(data.source);
  return (
    <Document title={`${data.reference} - Saloum Evasion`} author={pdfSafe(data.agency.name)}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>{pdfSafe(data.agency.name)}</Text>
        <Text style={styles.title}>Bon de reservation / Booking voucher</Text>

        <View style={styles.section}>
          <Label fr="Reference" en="Reference" />
          <Text style={styles.strong}>{data.reference}</Text>
        </View>

        <View style={styles.section}>
          <Label fr="Voyageur" en="Traveller" />
          <Text>{pdfSafe(`${data.traveller.firstName} ${data.traveller.lastName}`)}</Text>
          <Text>
            {data.traveller.whatsapp} · {data.traveller.email}
          </Text>
        </View>

        <View style={styles.section}>
          <Label fr="Prestations" en="Services" />
          {lines.map((line) => (
            <View key={line.lineId} style={styles.line}>
              <Text style={styles.strong}>{pdfSafe(line.title)}</Text>
              <Text>{pdfSafe(line.when)}</Text>
              <Text>{pdfSafe(line.travellers)}</Text>
              <Text>{pdfSafe(line.price)}</Text>
              <Text style={styles.muted}>
                {AVAILABILITY[data.availability[line.lineId] ?? 'pending']}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Label fr="Paiement" en="Payment" />
          <View style={styles.row}>
            <Text>Total</Text>
            <Text style={styles.strong}>{pdfSafe(totals.total)}</Text>
          </View>
          <Text style={styles.muted}>{pdfSafe(totals.totalEur)} (indicatif / indicative)</Text>
          <View style={styles.row}>
            <Text>Deja paye / Already paid</Text>
            <Text>{pdfSafe(totals.paid)}</Text>
          </View>
          {totals.balance && (
            <View style={styles.row}>
              <Text>Solde avant le / Balance due by {pdfSafe(totals.balance.dueDate)}</Text>
              <Text>{pdfSafe(totals.balance.amount)}</Text>
            </View>
          )}
        </View>

        {data.policies.length > 0 && (
          <View style={styles.section}>
            <Label fr="Conditions d'annulation" en="Cancellation terms" />
            {data.policies.map((policy) => (
              <Text key={policy.title}>{pdfSafe(`${policy.title} : ${policy.summary}`)}</Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Label fr="Contact" en="Contact" />
          <Text>{pdfSafe(data.agency.address)}</Text>
          {data.agency.phone && <Text>Tel. {data.agency.phone}</Text>}
          {data.agency.whatsapp && <Text>WhatsApp {data.agency.whatsapp}</Text>}
          {data.agency.email && <Text>{data.agency.email}</Text>}
          <Text style={[styles.muted, { marginTop: 8 }]}>
            {"Ce document n'est pas une facture. / This document is not an invoice."}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
