// app/seller/orders/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { formatINR, UNIT_CONFIG } from "@/lib/conversions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders" };
export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  const session = await auth();
  const sellerId = (session?.user as any)?.id;

  const myOrders = await db.query.orders.findMany({
    where: (o) => eq(o.sellerId, sellerId),
    with: {
      items: {
        with: {
          product: { columns: { name: true, baseUnit: true } },
        },
      },
    },
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">{myOrders.length} orders placed</p>
        </div>
      </div>

      {myOrders.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-state-icon">🧾</span>
          <p>No orders yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {myOrders.map((order) => (
            <div key={order.id} className="card">
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.75rem"
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{order.orderNumber}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })
                      : "—"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span className={`badge badge-${order.status}`}>{order.status}</span>
                  <span className="price-sm">{formatINR(parseFloat(order.totalAmount ?? "0"))}</span>
                </div>
              </div>

              {/* Items */}
              <div style={{ padding: "0.875rem 1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {order.items.map((item) => {
                    const baseQty = parseFloat(item.baseQuantity);
                    const orderedQty = parseFloat(item.orderedQuantity);
                    const factor = parseFloat(item.conversionFactor);
                    return (
                      <div key={item.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        fontSize: "0.875rem", padding: "0.625rem", background: "var(--muted)",
                        borderRadius: "0.5rem", flexWrap: "wrap", gap: "0.5rem"
                      }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{(item as any).product.name}</span>
                          <span style={{ color: "var(--muted-foreground)", marginLeft: "0.5rem" }}>
                            {orderedQty.toLocaleString("en-IN", { maximumFractionDigits: 6 })} {item.orderedUnit}
                            {item.orderedUnit !== (item as any).product.baseUnit && (
                              <span style={{ color: "var(--muted-foreground)" }}>
                                {" "}(= {baseQty.toLocaleString("en-IN", { maximumFractionDigits: 6 })} {(item as any).product.baseUnit})
                              </span>
                            )}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                          {formatINR(parseFloat(item.lineTotal))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.notes && (
                <div style={{
                  padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border)",
                  fontSize: "0.875rem", color: "var(--muted-foreground)"
                }}>
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
