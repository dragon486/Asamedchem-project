// app/admin/dashboard/page.tsx
import { db } from "@/lib/db";
import { products, orders, users, categories } from "@/lib/schema";
import { sql, eq, count, or, and } from "drizzle-orm";
import AdminDashboardClient from "./AdminDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    productCount,
    orderCount,
    sellerCount,
    revenueResult,
    categoryStats,
    lowStockProducts,
    recentOrders,
    sellers,
    confirmedCount,
  ] = await Promise.all([
    // Active products count
    db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
    // Total orders count
    db.select({ count: count() }).from(orders),
    // Registered sellers count
    db.select({ count: count() }).from(users).where(eq(users.role, "seller")),
    // Total revenue sum (only confirmed and shipped orders)
    db
      .select({ total: sql<string>`COALESCE(SUM(total_amount), 0)` })
      .from(orders)
      .where(or(eq(orders.status, "confirmed"), eq(orders.status, "shipped"))),
    // Product distribution by category (only counting active products)
    db
      .select({
        name: categories.name,
        productCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
      .groupBy(categories.id, categories.name)
      .limit(5),
    // Low stock products
    db.query.products.findMany({
      where: eq(products.isActive, true),
      orderBy: (p, { asc }) => [asc(p.stockQuantity)],
      limit: 5,
    }),
    // Recent orders
    db.query.orders.findMany({
      with: { seller: { columns: { name: true } } },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 5,
    }),
    // Registered sellers list
    db.query.users.findMany({
      where: eq(users.role, "seller"),
      orderBy: (u, { desc }) => [desc(u.createdAt)],
      limit: 5,
    }),
    // Shipped / Confirmed orders count for fulfillment rate
    db
      .select({ count: count() })
      .from(orders)
      .where(or(eq(orders.status, "confirmed"), eq(orders.status, "shipped"))),
  ]);

  const totalRevenue = parseFloat(revenueResult[0]?.total ?? "0");
  const tOrders = orderCount[0].count;
  const fulfillmentRate = tOrders > 0 ? (confirmedCount[0].count / tOrders) * 100 : 0;

  return (
    <div className="page-content fade-in">
      <AdminDashboardClient
        activeProducts={productCount[0].count}
        totalOrders={tOrders}
        registeredSellers={sellerCount[0].count}
        totalRevenue={totalRevenue}
        categoryStats={categoryStats as any}
        lowStockProducts={lowStockProducts}
        recentOrders={recentOrders as any}
        sellers={sellers as any}
        fulfillmentRate={fulfillmentRate}
      />
    </div>
  );
}
