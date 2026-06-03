// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface Ctx { params: Promise<{ id: string }> }

async function guardAdmin() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await guardAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json();

  try {
    const [updated] = await db
      .update(products)
      .set({
        name: body.name,
        sku: body.sku ?? null,
        description: body.description ?? null,
        categoryId: body.categoryId ?? null,
        dimension: body.dimension,
        baseUnit: body.baseUnit,
        stockQuantity: body.stockQuantity?.toString(),
        pricePerBaseUnit: body.pricePerBaseUnit?.toString(),
        minOrderQuantity: body.minOrderQuantity?.toString() ?? "0",
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.message?.includes("unique")) {
      return NextResponse.json({ error: "SKU already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await guardAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json();

  await db
    .update(products)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(products.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await guardAdmin();
  if (guard) return guard;

  const { id } = await params;
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ success: true });
}
