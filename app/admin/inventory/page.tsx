// app/admin/inventory/page.tsx
import { db } from "@/lib/db";
import { products, categories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { formatINR, pricePerDisplayUnit, fromBaseUnit } from "@/lib/conversions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const allProducts = await db.query.products.findMany({
    with: { category: { columns: { name: true } } },
    orderBy: (p, { asc }) => [asc(p.name)],
  });

  const totalValue = allProducts.reduce((sum, p) => {
    return sum + parseFloat(p.stockQuantity ?? "0") * parseFloat(p.pricePerBaseUnit);
  }, 0);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Current stock levels across all products</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>Total Inventory Value</div>
          <div className="price-display">{formatINR(totalValue)}</div>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Dimension</th>
              <th>Stock (base unit)</th>
              <th>Stock (larger unit)</th>
              <th>Price / base</th>
              <th>Price / larger</th>
              <th>Stock Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p) => {
              const stockBase = parseFloat(p.stockQuantity ?? "0");
              const priceBase = parseFloat(p.pricePerBaseUnit);
              const stockValue = stockBase * priceBase;

              const largerUnit = p.dimension === "weight" ? "kg" : p.dimension === "volume" ? "L" : null;
              const stockLarger = largerUnit ? fromBaseUnit(stockBase, largerUnit as any) : null;
              const priceLarger = largerUnit
                ? pricePerDisplayUnit(priceBase, largerUnit as any)
                : null;

              const isLow = stockBase < parseFloat(p.minOrderQuantity ?? "0") * 2;

              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.sku && <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{p.sku}</div>}
                  </td>
                  <td style={{ color: "var(--muted-foreground)" }}>{(p as any).category?.name ?? "—"}</td>
                  <td><span className={`badge badge-${p.dimension}`}>{p.dimension}</span></td>
                  <td>
                    <span style={{ fontWeight: 600 }}>
                      {stockBase.toLocaleString("en-IN", { maximumFractionDigits: 3 })} {p.baseUnit}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted-foreground)" }}>
                    {stockLarger !== null && largerUnit
                      ? `${stockLarger.toLocaleString("en-IN", { maximumFractionDigits: 3 })} ${largerUnit}`
                      : "—"}
                  </td>
                  <td style={{ color: "var(--primary)", fontWeight: 600 }}>
                    {formatINR(priceBase)} / {p.baseUnit}
                  </td>
                  <td style={{ color: "var(--muted-foreground)" }}>
                    {priceLarger !== null && largerUnit
                      ? `${formatINR(priceLarger)} / ${largerUnit}`
                      : "—"}
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatINR(stockValue)}</td>
                  <td>
                    {isLow ? (
                      <span className="badge badge-cancelled">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i> Low
                      </span>
                    ) : (
                      <span className="badge badge-confirmed">
                        <i className="bi bi-check-circle-fill me-1"></i> OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
