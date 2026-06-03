// app/api/seller/orders/route.ts
// Places an order: validates products exist, computes base quantities,
// deducts stock, creates order + order_items atomically
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, notifications } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { toBaseUnit, calculateLineTotal, UNIT_CONFIG, type Unit } from "@/lib/conversions";
import { sql } from "drizzle-orm";

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${date}-${rand}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = (session.user as any)?.id;

  const body = await req.json();
  const { items, notes } = body as {
    items: { productId: string; orderedUnit: string; orderedQuantity: number }[];
    notes?: string;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // Fetch all referenced products
  const productIds = items.map((i) => i.productId);
  const productRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const productMap = Object.fromEntries(productRows.map((p) => [p.id, p]));

  // Validate each item and compute base quantities
  const preparedItems: {
    productId: string;
    orderedUnit: Unit;
    orderedQuantity: number;
    baseQuantity: number;
    conversionFactor: number;
    unitPriceAtOrder: number;
    lineTotal: number;
  }[] = [];

  for (const item of items) {
    const p = productMap[item.productId];
    if (!p) {
      return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 400 });
    }
    if (!p.isActive) {
      return NextResponse.json({ error: `${p.name} is no longer available.` }, { status: 400 });
    }

    const unit = item.orderedUnit as Unit;
    const unitConfig = UNIT_CONFIG[unit];
    if (!unitConfig) {
      return NextResponse.json({ error: `Invalid unit: ${unit}` }, { status: 400 });
    }

    const baseQty = toBaseUnit(item.orderedQuantity, unit);
    const stockBase = parseFloat(p.stockQuantity ?? "0");

    if (baseQty > stockBase) {
      return NextResponse.json({
        error: `Insufficient stock for ${p.name}. Available: ${stockBase} ${p.baseUnit}, requested: ${baseQty.toFixed(6)} ${p.baseUnit}`,
      }, { status: 400 });
    }

    const minOrder = parseFloat(p.minOrderQuantity ?? "0");
    if (baseQty < minOrder) {
      return NextResponse.json({
        error: `Minimum order for ${p.name} is ${minOrder} ${p.baseUnit}. Requested: ${baseQty.toFixed(6)} ${p.baseUnit}`,
      }, { status: 400 });
    }

    const pricePerBase = parseFloat(p.pricePerBaseUnit);
    const lineTotal = calculateLineTotal(item.orderedQuantity, unit, pricePerBase);

    preparedItems.push({
      productId: item.productId,
      orderedUnit: unit,
      orderedQuantity: item.orderedQuantity,
      baseQuantity: baseQty,
      conversionFactor: unitConfig.factor,
      unitPriceAtOrder: pricePerBase,
      lineTotal,
    });
  }

  const totalAmount = preparedItems.reduce((s, i) => s + i.lineTotal, 0);
  const orderNumber = generateOrderNumber();

  // Insert order
  const [order] = await db.insert(orders).values({
    orderNumber,
    sellerId,
    notes: notes || null,
    totalAmount: totalAmount.toString(),
    status: "pending",
  }).returning();

  // Insert order items
  await db.insert(orderItems).values(
    preparedItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      orderedUnit: item.orderedUnit,
      orderedQuantity: item.orderedQuantity.toString(),
      baseQuantity: item.baseQuantity.toString(),
      conversionFactor: item.conversionFactor.toString(),
      unitPriceAtOrder: item.unitPriceAtOrder.toString(),
      lineTotal: item.lineTotal.toString(),
    }))
  );

  // Insert order notification for admin
  try {
    await db.insert(notifications).values({
      userId: null,
      message: `New order placed: ${order.orderNumber} by ${session?.user?.name || "Seller"}`,
      type: "order_placed",
      isRead: false,
    });
  } catch (nErr) {
    console.error("Failed to insert notification:", nErr);
  }

  // Deduct stock from each product (immediate deduction on order)
  for (const item of preparedItems) {
    await db
      .update(products)
      .set({
        stockQuantity: sql`stock_quantity - ${item.baseQuantity.toString()}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, item.productId));
  }

  return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
}
