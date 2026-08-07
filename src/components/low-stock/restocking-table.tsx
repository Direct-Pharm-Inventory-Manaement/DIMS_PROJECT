"use client";

import { Package } from "lucide-react";
import type { RestockingRecommendation } from "@/lib/api/low-stock";

function exportCsv(rows: RestockingRecommendation[]) {
  const header = ["Item", "Target Stock", "Recommended Order", "Primary Supplier", "Est. Cost (GHS)"];
  const lines = rows.map((r) =>
    [r.name, r.targetStock, r.recommendedOrder, r.primarySupplier, r.estCostGhs.toFixed(2)]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "bulk-purchase-order.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RestockingTable({
  recommendations,
  loading,
  selected,
  onToggle,
}: {
  recommendations: RestockingRecommendation[];
  loading: boolean;
  selected: Set<string>;
  onToggle: (medicineId: string) => void;
}) {
  const selectedRows = recommendations.filter((r) => selected.has(r.medicineId));
  const totalCost = selectedRows.reduce((sum, r) => sum + r.estCostGhs, 0);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-brand-800">Restocking Recommendations</h2>
      <p className="mt-0.5 text-sm text-zinc-400">
        Generated based on lead times and economic order quantities.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
              <th scope="col" className="py-3 pr-4">Item</th>
              <th scope="col" className="py-3 pr-4">Target Stock</th>
              <th scope="col" className="py-3 pr-4">Recommended Order</th>
              <th scope="col" className="py-3 pr-4">Primary Supplier</th>
              <th scope="col" className="py-3 pr-4">Est. Cost</th>
              <th scope="col" className="py-3 text-right">Batch Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 3 }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }, (_, col) => (
                    <td key={col} className="py-4 pr-4">
                      <div className="h-4 animate-pulse rounded bg-zinc-200/80" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              recommendations.map((r) => (
                <tr key={r.medicineId}>
                  <td className="py-4 pr-4 font-bold text-zinc-800">{`${r.name} ${r.strength}`.trim()}</td>
                  <td className="py-4 pr-4 tabular-nums text-zinc-600">
                    {r.targetStock.toLocaleString()} units
                  </td>
                  <td className="py-4 pr-4 font-bold tabular-nums text-brand-700">
                    {r.recommendedOrder.toLocaleString()} units
                  </td>
                  <td className="py-4 pr-4 text-zinc-600">{r.primarySupplier}</td>
                  <td className="py-4 pr-4 tabular-nums text-zinc-600">
                    GH₵ {r.estCostGhs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-right">
                    <input
                      type="checkbox"
                      checked={selected.has(r.medicineId)}
                      onChange={() => onToggle(r.medicineId)}
                      aria-label={`Include ${r.name} in bulk order`}
                      className="h-5 w-5 rounded border-zinc-300 text-brand-600 focus:ring-2 focus:ring-brand-500/25"
                    />
                  </td>
                </tr>
              ))
            )}
            {!loading && recommendations.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-zinc-400">
                  No restocking recommendations for the current filters — nothing critical or reorder-soon.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <p className="text-sm font-semibold text-zinc-600">
          {selectedRows.length} {selectedRows.length === 1 ? "item" : "items"} selected for bulk order
          <span className="ml-2 text-zinc-400">
            Total Est: GH₵ {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </p>
        <button
          type="button"
          disabled={selectedRows.length === 0}
          onClick={() => exportCsv(selectedRows)}
          className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Package className="h-4 w-4" aria-hidden />
          Generate Bulk Purchase Order
        </button>
      </div>
    </section>
  );
}
