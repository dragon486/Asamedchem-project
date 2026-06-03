// app/admin/dashboard/page.tsx
import { db } from "@/lib/db";
import { products, orders, users, categories } from "@/lib/schema";
import { sql, eq, count } from "drizzle-orm";
import { formatINR } from "@/lib/conversions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    productCount,
    orderCount,
    sellerCount,
    categoryCount,
    recentOrders,
    revenueResult,
    lowStockProducts,
  ] = await Promise.all([
    db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ count: count() }).from(orders),
    db.select({ count: count() }).from(users).where(eq(users.role, "seller")),
    db.select({ count: count() }).from(categories),
    db.query.orders.findMany({
      with: { seller: { columns: { name: true } } },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 5,
    }),
    db.select({ total: sql<string>`COALESCE(SUM(total_amount), 0)` }).from(orders),
    db.query.products.findMany({
      where: eq(products.isActive, true),
      orderBy: (p, { asc }) => [asc(p.stockQuantity)],
      limit: 5,
      with: { category: { columns: { name: true } } },
    }),
  ]);

  const totalRevenue = parseFloat(revenueResult[0]?.total ?? "0");
  const pendingOrders = recentOrders.filter((o) => o.status === "pending").length;

  const stats = [
    { label: "Active Products",  value: productCount[0].count,  icon: "bi bi-capsule", href: "/admin/products",   color: "#4f46e5" },
    { label: "Total Orders",     value: orderCount[0].count,    icon: "bi bi-receipt", href: "/admin/orders",     color: "#06b6d4" },
    { label: "Registered Sellers", value: sellerCount[0].count, icon: "bi bi-people", href: "/admin/users",     color: "#10b981" },
    { label: "Categories",       value: categoryCount[0].count, icon: "bi bi-tags", href: "/admin/categories", color: "#f59e0b" },
  ];

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your inventory and orders</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Add Product
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div className="stat-card" style={{ ["--primary" as any]: s.color }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "0.5rem" }}>{s.label}</p>
                  <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)", lineHeight: 1 }}>{s.value}</p>
                </div>
                <i className={s.icon} style={{ fontSize: "1.75rem", color: s.color }}></i>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue + Pending Orders */}
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "0.5rem" }}>Total Revenue (all time)</p>
          <p className="price-display" style={{ fontSize: "2rem" }}>{formatINR(totalRevenue)}</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>Across {orderCount[0].count} orders</p>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "0.5rem" }}>Pending Orders</p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b" }}>{pendingOrders}</p>
          <Link href="/admin/orders" style={{ fontSize: "0.8125rem", color: "var(--primary)", fontWeight: 600, textDecoration: "none", marginTop: "0.5rem", display: "block" }}>
            View all orders →
          </Link>
        </div>
      </div>

      {/* Recent Orders + Low Stock side by side */}
      <div className="grid-2">
        <div className="card">
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>
            Recent Orders
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <i className="bi bi-receipt" style={{ fontSize: "3rem", opacity: 0.5 }}></i>
              <p>No orders yet</p>
            </div>
          ) : (
            <div>
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders?expand=${order.id}`} style={{ textDecoration: "none" }}>
                  <div className="list-item-hoverable" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{order.orderNumber}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                        {(order as any).seller?.name ?? "Unknown"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`badge badge-${order.status}`}>{order.status}</span>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--primary)", marginTop: "0.25rem" }}>
                        {formatINR(parseFloat(order.totalAmount ?? "0"))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>
            Low Stock Alerts
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <i className="bi bi-check2-circle" style={{ fontSize: "3rem", opacity: 0.5, color: "var(--success)" }}></i>
              <p>All stocked</p>
            </div>
          ) : (
            <div>
              {lowStockProducts.map((p) => (
                <div key={p.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      {(p as any).category?.name ?? "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge badge-${parseFloat(p.stockQuantity ?? "0") < 100 ? "cancelled" : "pending"}`}>
                      {parseFloat(p.stockQuantity ?? "0").toLocaleString()} {p.baseUnit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
