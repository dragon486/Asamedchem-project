// app/admin/products/[id]/edit/page.tsx
import { db } from "@/lib/db";
import { products, categories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductForm from "../../ProductForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Product" };

interface Props { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) notFound();

  const allCategories = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Product</h1>
          <p className="page-subtitle">{product.name}</p>
        </div>
      </div>
      <ProductForm categories={allCategories} product={product} />
    </div>
  );
}
