// app/seller/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq, count, sql } from "drizzle-orm";
import { formatINR } from "@/lib/conversions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seller Dashboard" };
export const dynamic = "force-dynamic";

export default async function SellerDashboard() {
  const session = await auth();
  const sellerId = (session?.user as any)?.id;

  const [myOrders, totalSpent, pendingCount] = await Promise.all([
    db.query.orders.findMany({
      where: (o) => eq(o.sellerId, sellerId),
      with: { items: { with: { product: { columns: { name: true } } } } },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 5,
    }),
    db
      .select({ total: sql<string>`COALESCE(SUM(total_amount),0)` })
      .from(orders)
      .where(eq(orders.sellerId, sellerId)),
    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.sellerId, sellerId)),
  ]);

  const pending = myOrders.filter((o) => o.status === "pending").length;

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {session?.user?.name?.split(" ")[0]} 👋</h1>
          <p className="page-subtitle">Manage your orders and browse our product catalogue</p>
        </div>
        <Link href="/seller/products" className="btn btn-primary">
          Browse Products →
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Total Orders</p>
          <p style={{ fontSize: "2rem", fontWeight: 800 }}>{pendingCount[0].count}</p>
        </div>
        <div className="stat-card" style={{ ["--primary" as any]: "#f59e0b" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Pending</p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b" }}>{pending}</p>
        </div>
        <div className="stat-card" style={{ ["--primary" as any]: "#10b981" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Total Spent</p>
          <p className="price-display">{formatINR(parseFloat(totalSpent[0]?.total ?? "0"))}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Browse Products", href: "/seller/products", icon: "bi bi-capsule" },
          { label: "View Cart", href: "/seller/cart", icon: "bi bi-cart3" },
          { label: "My Orders", href: "/seller/orders", icon: "bi bi-receipt" },
        ].map((a) => (
          <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
            <div className="card card-hoverable" style={{
              padding: "1.25rem", textAlign: "center"
            }}>
              <i className={a.icon} style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "inline-block", color: "var(--primary)" }}></i>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{a.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card">
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>Recent Orders</span>
          <Link href="/seller/orders" style={{ fontSize: "0.8125rem", color: "var(--primary)", textDecoration: "none" }}>View all →</Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-receipt" style={{ fontSize: "3rem", opacity: 0.5, marginBottom: "0.5rem" }}></i>
            <p>No orders yet</p>
            <Link href="/seller/products" className="btn btn-primary btn-sm">Place your first order</Link>
          </div>
        ) : (
          myOrders.map((order) => (
            <div key={order.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)"
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{order.orderNumber}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                  {order.items.length} item(s) · {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`badge badge-${order.status}`}>{order.status}</span>
                <div style={{ fontWeight: 700, color: "var(--primary)", marginTop: "0.25rem" }}>
                  {formatINR(parseFloat(order.totalAmount ?? "0"))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
