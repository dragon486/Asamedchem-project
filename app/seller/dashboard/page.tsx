// app/seller/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, products } from "@/lib/schema";
import { eq, count, sql, and, or } from "drizzle-orm";
import SellerDashboardClient from "./SellerDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function SellerDashboard() {
  const session = await auth();
  const sellerId = (session?.user as any)?.id;
  const userName = session?.user?.name ?? "Seller";

  const [
    myOrders,
    totalSpentResult,
    totalCountResult,
    pendingCountResult,
    shippedCountResult,
    newProducts,
  ] = await Promise.all([
    // Recent orders
    db.query.orders.findMany({
      where: eq(orders.sellerId, sellerId),
      with: { items: { with: { product: { columns: { name: true } } } } },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 5,
    }),
    // Total spent (confirmed or shipped orders)
    db
      .select({ total: sql<string>`COALESCE(SUM(total_amount), 0)` })
      .from(orders)
      .where(
        and(
          eq(orders.sellerId, sellerId),
          or(eq(orders.status, "confirmed"), eq(orders.status, "shipped"))
        )
      ),
    // Total orders count
    db.select({ count: count() }).from(orders).where(eq(orders.sellerId, sellerId)),
    // Pending orders count
    db
      .select({ count: count() })
      .from(orders)
      .where(and(eq(orders.sellerId, sellerId), eq(orders.status, "pending"))),
    // Shipped orders count
    db
      .select({ count: count() })
      .from(orders)
      .where(and(eq(orders.sellerId, sellerId), eq(orders.status, "shipped"))),
    // New Arrivals (newest active products)
    db.query.products.findMany({
      where: eq(products.isActive, true),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      limit: 3,
    }),
  ]);

  const totalSpent = parseFloat(totalSpentResult[0]?.total ?? "0");
  const totalOrders = totalCountResult[0].count;
  const pendingCount = pendingCountResult[0].count;
  const shippedCount = shippedCountResult[0].count;

  return (
    <div className="page-content fade-in">
      <SellerDashboardClient
        userName={userName}
        totalOrders={totalOrders}
        pendingCount={pendingCount}
        totalSpent={totalSpent}
        shippedCount={shippedCount}
        recentOrders={myOrders as any}
        newProducts={newProducts as any}
      />
    </div>
  );
}
