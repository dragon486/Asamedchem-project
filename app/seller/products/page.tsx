// app/seller/products/page.tsx
import { db } from "@/lib/db";
import { products, categories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import SellerProductBrowser from "./SellerProductBrowser";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Browse Products" };
export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  const activeProducts = await db.query.products.findMany({
    where: (p) => eq(p.isActive, true),
    with: { category: { columns: { name: true, id: true } } },
    orderBy: (p, { asc }) => [asc(p.name)],
  });

  const allCategories = await db.select({ id: categories.id, name: categories.name })
    .from(categories).orderBy(categories.name);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Products</h1>
          <p className="page-subtitle">{activeProducts.length} products available</p>
        </div>
      </div>
      <SellerProductBrowser products={activeProducts as any} categories={allCategories} />
    </div>
  );
}
