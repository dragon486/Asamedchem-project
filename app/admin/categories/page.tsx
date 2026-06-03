// app/admin/categories/page.tsx
import { db } from "@/lib/db";
import { categories, products } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import CategoriesClient from "./CategoriesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      createdAt: categories.createdAt,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.name);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{allCategories.length} categories</p>
        </div>
      </div>
      <CategoriesClient categories={allCategories} />
    </div>
  );
}
