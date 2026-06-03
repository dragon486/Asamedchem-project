// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name, sku, description, categoryId, dimension, baseUnit,
      stockQuantity, pricePerBaseUnit, minOrderQuantity
    } = body;

    if (!name || !dimension || !baseUnit || !stockQuantity || !pricePerBaseUnit) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const [product] = await db
      .insert(products)
      .values({
        name,
        sku: sku || null,
        description: description || null,
        categoryId: categoryId || null,
        dimension,
        baseUnit,
        stockQuantity: stockQuantity.toString(),
        pricePerBaseUnit: pricePerBaseUnit.toString(),
        minOrderQuantity: (minOrderQuantity ?? "0").toString(),
        isActive: true,
      })
      .returning();

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    if (err?.message?.includes("unique")) {
      return NextResponse.json({ error: "SKU already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
