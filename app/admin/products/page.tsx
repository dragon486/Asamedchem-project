// app/admin/products/page.tsx
import { db } from "@/lib/db";
import { products, categories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { formatINR, UNIT_CONFIG } from "@/lib/conversions";
import type { Metadata } from "next";
import Link from "next/link";
import ProductsClientActions from "./ProductsClientActions";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const allProducts = await db.query.products.findMany({
    with: { category: { columns: { name: true } } },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });

  const allCategories = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{allProducts.length} products in inventory</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Add Product
        </Link>
      </div>

      <ProductsClientActions products={allProducts} categories={allCategories} />
    </div>
  );
}
