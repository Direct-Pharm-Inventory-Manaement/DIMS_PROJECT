// Placeholder medicines inventory, typed to match the future backend
// endpoints. Swap for API calls when /medicines lands.

export type MedicineStatus =
  | "in-stock"
  | "low-stock"
  | "critical-expiry"
  | "out-of-stock";

export interface Medicine {
  id: string;
  name: string;
  strength: string;
  form: string;
  packaging: string;
  category: string;
  batchNo: string;
  branch: string;
  quantity: number;
  unitPriceGhs: number;
  expiryDate: string;
  status: MedicineStatus;
}

export const CATEGORIES = [
  "Antibiotics",
  "Analgesics",
  "Antidiabetics",
  "Antihypertensives",
  "Antihistamines",
  "Vitamins & Supplements",
] as const;

export const BRANCHES = ["Adenta Main", "East Legon", "Haatso"] as const;

export const MEDICINES: Medicine[] = [
  {
    id: "med-001",
    name: "Amoxicillin",
    strength: "500mg",
    form: "Capsule",
    packaging: "10×10 Blister",
    category: "Antibiotics",
    batchNo: "B-99201-AMX",
    branch: "Adenta Main",
    quantity: 1240,
    unitPriceGhs: 12.5,
    expiryDate: "14 Oct 2025",
    status: "in-stock",
  },
  {
    id: "med-002",
    name: "Paracetamol Syrup",
    strength: "",
    form: "Liquid",
    packaging: "100ml Bottle",
    category: "Analgesics",
    batchNo: "B-44312-PRC",
    branch: "East Legon",
    quantity: 45,
    unitPriceGhs: 8,
    expiryDate: "02 Jan 2025",
    status: "low-stock",
  },
  {
    id: "med-003",
    name: "Insulin Glargine",
    strength: "",
    form: "Injectable",
    packaging: "3ml Pen",
    category: "Antidiabetics",
    batchNo: "B-22871-INS",
    branch: "Haatso",
    quantity: 210,
    unitPriceGhs: 85,
    expiryDate: "15 Dec 2024",
    status: "critical-expiry",
  },
  {
    id: "med-004",
    name: "Metformin",
    strength: "850mg",
    form: "Tablet",
    packaging: "Bulk Pack",
    category: "Antidiabetics",
    batchNo: "B-11004-MET",
    branch: "Adenta Main",
    quantity: 4500,
    unitPriceGhs: 15.2,
    expiryDate: "30 Jun 2026",
    status: "in-stock",
  },
  {
    id: "med-005",
    name: "Azithromycin",
    strength: "250mg",
    form: "Tablet",
    packaging: "6 Pack",
    category: "Antibiotics",
    batchNo: "B-88321-AZI",
    branch: "Haatso",
    quantity: 0,
    unitPriceGhs: 42,
    expiryDate: "11 Aug 2025",
    status: "out-of-stock",
  },
  {
    id: "med-006",
    name: "Lisinopril",
    strength: "10mg",
    form: "Tablet",
    packaging: "30 Pack",
    category: "Antihypertensives",
    batchNo: "B-55118-LIS",
    branch: "Adenta Main",
    quantity: 890,
    unitPriceGhs: 18.75,
    expiryDate: "15 Nov 2025",
    status: "in-stock",
  },
  {
    id: "med-007",
    name: "Cetirizine",
    strength: "10mg",
    form: "Tablet",
    packaging: "10×10 Blister",
    category: "Antihistamines",
    batchNo: "B-70233-CET",
    branch: "East Legon",
    quantity: 32,
    unitPriceGhs: 6.5,
    expiryDate: "22 Mar 2026",
    status: "low-stock",
  },
  {
    id: "med-008",
    name: "Vitamin C",
    strength: "1000mg",
    form: "Effervescent",
    packaging: "20 Tube",
    category: "Vitamins & Supplements",
    batchNo: "B-31447-VTC",
    branch: "Haatso",
    quantity: 0,
    unitPriceGhs: 24,
    expiryDate: "05 Sep 2025",
    status: "out-of-stock",
  },
  {
    id: "med-009",
    name: "Ibuprofen",
    strength: "400mg",
    form: "Tablet",
    packaging: "10×10 Blister",
    category: "Analgesics",
    batchNo: "B-60912-IBU",
    branch: "Adenta Main",
    quantity: 2150,
    unitPriceGhs: 9.8,
    expiryDate: "18 Feb 2026",
    status: "in-stock",
  },
  {
    id: "med-010",
    name: "Amlodipine",
    strength: "5mg",
    form: "Tablet",
    packaging: "28 Pack",
    category: "Antihypertensives",
    batchNo: "B-42760-AML",
    branch: "East Legon",
    quantity: 640,
    unitPriceGhs: 14.3,
    expiryDate: "09 Jan 2025",
    status: "critical-expiry",
  },
  {
    id: "med-011",
    name: "Multivitamin Syrup",
    strength: "",
    form: "Liquid",
    packaging: "200ml Bottle",
    category: "Vitamins & Supplements",
    batchNo: "B-90185-MVS",
    branch: "Adenta Main",
    quantity: 380,
    unitPriceGhs: 19.5,
    expiryDate: "27 Jul 2026",
    status: "in-stock",
  },
  {
    id: "med-012",
    name: "Loratadine",
    strength: "10mg",
    form: "Tablet",
    packaging: "10 Pack",
    category: "Antihistamines",
    batchNo: "B-27594-LOR",
    branch: "Haatso",
    quantity: 28,
    unitPriceGhs: 11.25,
    expiryDate: "14 Apr 2026",
    status: "low-stock",
  },
];

export const medicinesSummary = {
  totalSkus: 1482,
  skusDeltaThisMonth: 12,
  lowStockAlerts: 28,
  stockOuts: 9,
  stockOutBranches: 3,
};
