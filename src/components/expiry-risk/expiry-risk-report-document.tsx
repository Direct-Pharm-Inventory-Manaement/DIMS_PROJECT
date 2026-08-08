import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ExpiryRiskRow, ExpiryRiskSummary } from "@/lib/api/expiry-risk";
import { TIER_LABEL, daysUntil, recommendedAction, reportReference, sortByUrgency } from "@/lib/expiry-report";

const INK = "#0b0b0b";
const MUTED = "#6b6f76";
const RULE = "#0d3f63";

const TIER_COLOR: Record<string, { bg: string; text: string }> = {
  critical: { bg: "#fde3e3", text: "#b91c1c" },
  warning: { bg: "#fdecc8", text: "#92400e" },
  advisory: { bg: "#e5e7eb", text: "#374151" },
};

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
  descRow: { flexDirection: "row", marginTop: 8, marginBottom: 18 },
  descBar: { width: 3, backgroundColor: "#c98500", marginRight: 8, borderRadius: 2 },
  descText: { fontSize: 9, color: "#3f3f46", lineHeight: 1.5, flex: 1 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  statCard: { flex: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center" },
  statLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4 },
  statSub: { fontSize: 7, marginTop: 2 },
  table: { borderTopWidth: 1, borderTopColor: "#e4e4e7" },
  tHeadRow: { flexDirection: "row", backgroundColor: "#f4f4f5", paddingVertical: 6, paddingHorizontal: 6 },
  tHeadCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#52525b", letterSpacing: 0.3 },
  tRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tCell: { fontSize: 8, color: "#27272a" },
  medName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: RULE },
  medSub: { fontSize: 7, color: MUTED, marginTop: 1 },
  daysLeft: { fontSize: 7, fontFamily: "Helvetica-Bold", marginTop: 1 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  actionText: { fontSize: 7.5, color: "#3f3f46", lineHeight: 1.4 },
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
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 40,
    fontSize: 7,
    color: "#a1a1aa",
  },
});

export interface ReportBranding {
  logoUrl: string;
  appVersion: string;
  generatedByName: string;
  generatedByRole: string;
}

export function ExpiryRiskReportDocument({
  rows,
  summary,
  generatedAt,
  branding,
}: {
  rows: ExpiryRiskRow[];
  summary: ExpiryRiskSummary;
  generatedAt: Date;
  branding: ReportBranding;
}) {
  const sorted = sortByUrgency(rows);
  const totalRisks = summary.critical + summary.warning + summary.advisory;

  return (
    <Document title="Medicine Expiry Risk Report">
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
            <Text style={styles.metaLine}>Ref: {reportReference(generatedAt)}</Text>
          </View>
        </View>
        <View style={styles.rule} />

        <Text style={styles.reportTitle}>Medicine Expiry Risk Report</Text>
        <View style={styles.descRow}>
          <View style={styles.descBar} />
          <Text style={styles.descText}>
            Comprehensive audit of stock approaching expiration dates across all registered
            branches, including recommended mitigation actions.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#fdf2f2" }]}>
            <Text style={[styles.statLabel, { color: "#b91c1c" }]}>CRITICAL</Text>
            <Text style={[styles.statValue, { color: "#b91c1c" }]}>
              {String(summary.critical).padStart(2, "0")}
            </Text>
            <Text style={[styles.statSub, { color: "#b91c1c" }]}>&lt; 30 Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#fdf6e8" }]}>
            <Text style={[styles.statLabel, { color: "#92400e" }]}>WARNING</Text>
            <Text style={[styles.statValue, { color: "#92400e" }]}>
              {String(summary.warning).padStart(2, "0")}
            </Text>
            <Text style={[styles.statSub, { color: "#92400e" }]}>30-90 Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#f4f4f5" }]}>
            <Text style={[styles.statLabel, { color: "#3f3f46" }]}>ADVISORY</Text>
            <Text style={[styles.statValue, { color: "#3f3f46" }]}>
              {String(summary.advisory).padStart(2, "0")}
            </Text>
            <Text style={[styles.statSub, { color: "#3f3f46" }]}>90-180 Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: RULE }]}>
            <Text style={[styles.statLabel, { color: "#dbeafe" }]}>TOTAL RISKS</Text>
            <Text style={[styles.statValue, { color: "#ffffff" }]}>{totalRisks}</Text>
            <Text style={[styles.statSub, { color: "#dbeafe" }]}>Active Batches</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.tHeadCell, { width: "22%" }]}>MEDICINE / CATEGORY</Text>
            <Text style={[styles.tHeadCell, { width: "18%" }]}>BATCH / BRANCH</Text>
            <Text style={[styles.tHeadCell, { width: "8%" }]}>QTY</Text>
            <Text style={[styles.tHeadCell, { width: "16%" }]}>EXPIRY DATE</Text>
            <Text style={[styles.tHeadCell, { width: "12%" }]}>STATUS</Text>
            <Text style={[styles.tHeadCell, { width: "24%" }]}>RECOMMENDED ACTION</Text>
          </View>
          {sorted.map((row) => {
            const tier = TIER_COLOR[row.riskTier];
            const days = daysUntil(row.expiryDate);
            return (
              <View key={row.id} style={styles.tRow} wrap={false}>
                <View style={{ width: "22%" }}>
                  <Text style={styles.medName}>{`${row.name} ${row.strength}`.trim()}</Text>
                  <Text style={styles.medSub}>{row.stockCategory === "cold-chain" ? "Cold Chain" : row.form}</Text>
                </View>
                <View style={{ width: "18%" }}>
                  <Text style={styles.tCell}>{row.batchNo}</Text>
                  <Text style={styles.medSub}>{row.branch}</Text>
                </View>
                <Text style={[styles.tCell, { width: "8%" }]}>{row.quantity.toLocaleString()}</Text>
                <View style={{ width: "16%" }}>
                  <Text style={styles.tCell}>
                    {new Date(row.expiryDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  <Text style={[styles.daysLeft, { color: tier.text }]}>
                    {days} {days === 1 ? "Day" : "Days"} Left
                  </Text>
                </View>
                <View style={{ width: "12%" }}>
                  <Text style={[styles.badge, { backgroundColor: tier.bg, color: tier.text }]}>
                    {TIER_LABEL[row.riskTier].toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.actionText, { width: "24%" }]}>{recommendedAction(row)}</Text>
              </View>
            );
          })}
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
