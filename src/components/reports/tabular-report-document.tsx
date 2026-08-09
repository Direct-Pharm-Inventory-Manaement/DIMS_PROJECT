import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReportBranding } from "@/components/expiry-risk/expiry-risk-report-document";

const INK = "#0b0b0b";
const MUTED = "#6b6f76";
const RULE = "#0d3f63";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 6 },
  brandName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: RULE },
  brandSub: { fontSize: 7, color: MUTED, letterSpacing: 1, marginTop: 1 },
  metaBlock: { alignItems: "flex-end" },
  metaTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: RULE },
  metaLine: { fontSize: 8, color: MUTED, marginTop: 2 },
  rule: { borderBottomWidth: 2, borderBottomColor: RULE, marginTop: 12, marginBottom: 16 },
  reportTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: INK },
  descText: { fontSize: 9, color: "#3f3f46", lineHeight: 1.5, marginTop: 6, marginBottom: 18 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  statCard: { flex: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center" },
  statLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 4 },
  table: { borderTopWidth: 1, borderTopColor: "#e4e4e7" },
  tHeadRow: { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 6, paddingHorizontal: 6 },
  tHeadCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#52525b", letterSpacing: 0.3 },
  tRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tCell: { fontSize: 7.5, color: "#27272a" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    borderTopStyle: "dashed",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sigBlock: { width: "45%" },
  sigLabel: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 0.5, marginBottom: 14 },
  sigLine: { borderTopWidth: 1, borderTopColor: "#a1a1aa", marginBottom: 4, width: "80%" },
  sigName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK },
  sigRole: { fontSize: 7, color: MUTED, marginTop: 1 },
  sigMeta: { fontSize: 6.5, color: "#a1a1aa", marginTop: 4 },
  pageNumber: { position: "absolute", bottom: 24, right: 40, fontSize: 7, color: "#a1a1aa" },
});

export interface StatCard {
  label: string;
  value: string;
  bg: string;
  color: string;
}

export interface ReportColumn {
  header: string;
  width: string;
}

export function TabularReportDocument({
  title,
  description,
  reference,
  generatedAt,
  branding,
  statCards,
  columns,
  rows,
}: {
  title: string;
  description: string;
  reference: string;
  generatedAt: Date;
  branding: ReportBranding;
  statCards: StatCard[];
  columns: ReportColumn[];
  rows: string[][];
}) {
  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no alt prop */}
            <Image src={branding.logoUrl} style={styles.logo} />
            <View>
              <Text style={styles.brandName}>Direct Pharmacy</Text>
              <Text style={styles.brandSub}>DIRECT PHARMACY MANAGER</Text>
            </View>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaTitle}>Direct Inventory Manager</Text>
            <Text style={styles.metaLine}>
              Generated: {generatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} |{" "}
              {generatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={styles.metaLine}>Ref: {reference}</Text>
          </View>
        </View>
        <View style={styles.rule} />

        <Text style={styles.reportTitle}>{title}</Text>
        <Text style={styles.descText}>{description}</Text>

        {statCards.length > 0 && (
          <View style={styles.statsRow}>
            {statCards.map((card) => (
              <View key={card.label} style={[styles.statCard, { backgroundColor: card.bg }]}>
                <Text style={[styles.statLabel, { color: card.color }]}>{card.label}</Text>
                <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            {columns.map((col) => (
              <Text key={col.header} style={[styles.tHeadCell, { width: col.width }]}>
                {col.header}
              </Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={styles.tRow} wrap={false}>
              {row.map((cell, j) => (
                <Text key={j} style={[styles.tCell, { width: columns[j].width }]}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>GENERATED BY</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{branding.generatedByName}</Text>
            <Text style={styles.sigRole}>{branding.generatedByRole}</Text>
            <Text style={styles.sigMeta}>Confidential — Prepared for Direct Pharmacy Management</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>AUTHORIZED APPROVAL</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}> </Text>
            <Text style={styles.sigRole}>Authorized Signatory</Text>
            <Text style={styles.sigMeta}>Direct Inventory Manager v{branding.appVersion}</Text>
          </View>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
