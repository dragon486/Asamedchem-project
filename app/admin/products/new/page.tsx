// app/admin/products/new/page.tsx
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import ProductForm from "../ProductForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Product" };

export default async function NewProductPage() {
  const allCategories = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Product</h1>
          <p className="page-subtitle">Configure product details, unit, and pricing</p>
        </div>
      </div>
      <ProductForm categories={allCategories} />
    </div>
  );
}
