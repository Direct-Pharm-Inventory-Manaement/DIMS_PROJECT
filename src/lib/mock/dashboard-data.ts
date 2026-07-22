// Placeholder dashboard data, typed to match the backend endpoints that will
// replace it. Swap each export for an API call as those routes land.

export interface TrendPoint {
  month: string;
  value: number;
}

export interface DistributionSegment {
  label: string;
  percent: number;
  color: string;
}

export type RiskLevel = "critical" | "high" | "moderate";

export interface WatchlistRow {
  medicine: string;
  batchId: string;
  remainingStock: number;
  expiryDate: string;
  risk: RiskLevel;
}

export interface SystemAlert {
  title: string;
  detail: string;
  severity: "warning" | "critical";
}

export interface ActivityItem {
  title: string;
  detail: string;
  timeAgo: string;
  tone: "blue" | "amber";
}

/** Chart colors validated with the dataviz palette checker (light surface). */
export const VIZ = {
  barDeEmphasis: "#4d94ba",
  barAccent: "#114f75",
  categorical: ["#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7"],
} as const;

export const inventoryTrend: TrendPoint[] = [
  { month: "Jan", value: 98_400 },
  { month: "Feb", value: 124_300 },
  { month: "Mar", value: 112_800 },
  { month: "Apr", value: 149_600 },
  { month: "May", value: 171_200 },
  { month: "Jun", value: 143_900 },
];

export const highlightedMonth = "May";

export const stockDistribution: DistributionSegment[] = [
  { label: "Antibiotics", percent: 42, color: VIZ.categorical[0] },
  { label: "Pain Relief", percent: 28, color: VIZ.categorical[1] },
  { label: "Vaccines", percent: 15, color: VIZ.categorical[2] },
  { label: "Other", percent: 15, color: VIZ.categorical[3] },
];

export const essentialSharePercent = 82;

export const expiryWatchlist: WatchlistRow[] = [
  {
    medicine: "Amoxicillin 500mg",
    batchId: "#AMX-2023-004",
    remainingStock: 420,
    expiryDate: "12 Oct 2023",
    risk: "critical",
  },
  {
    medicine: "Paracetamol Syrup",
    batchId: "#PAR-2023-012",
    remainingStock: 150,
    expiryDate: "28 Oct 2023",
    risk: "high",
  },
  {
    medicine: "Lisinopril 10mg",
    batchId: "#LIS-2022-881",
    remainingStock: 890,
    expiryDate: "15 Nov 2023",
    risk: "high",
  },
  {
    medicine: "Insulin Glargine",
    batchId: "#INS-BT-922",
    remainingStock: 45,
    expiryDate: "03 Dec 2023",
    risk: "moderate",
  },
];

export const systemAlerts: SystemAlert[] = [
  {
    title: "Transfer Expiring",
    detail: "Request #TR-992 from Kumasi Branch expires in 2 hours.",
    severity: "warning",
  },
  {
    title: "Cold Chain Alert",
    detail: "Fridge #4 temperature at 8.2°C (Target: 2–8°C).",
    severity: "critical",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    title: "Inventory Updated",
    detail: "Batch #882 received by Sarah Mensah",
    timeAgo: "10 minutes ago",
    tone: "blue",
  },
  {
    title: "Transfer Approved",
    detail: "TR #442 for Osu branch approved",
    timeAgo: "1 hour ago",
    tone: "blue",
  },
  {
    title: "New Low Stock Alert",
    detail: "Vitamin C tablets below safety threshold",
    timeAgo: "4 hours ago",
    tone: "amber",
  },
];
