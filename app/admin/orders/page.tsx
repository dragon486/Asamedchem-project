// app/admin/orders/page.tsx
import { db } from "@/lib/db";
import { orders, users, orderItems, products } from "@/lib/schema";
import { formatINR } from "@/lib/conversions";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import AdminOrdersClient from "./AdminOrdersClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const allOrders = await db.query.orders.findMany({
    with: {
      seller: { columns: { name: true, email: true } },
      items: {
        with: {
          product: { columns: { name: true, baseUnit: true, sku: true } },
        },
      },
    },
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{allOrders.length} total orders</p>
        </div>
      </div>
      <AdminOrdersClient orders={allOrders as any} />
    </div>
  );
}
