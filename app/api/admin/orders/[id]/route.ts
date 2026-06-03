// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, notifications } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const [updatedOrder] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  if (updatedOrder) {
    try {
      await db.insert(notifications).values({
        userId: updatedOrder.sellerId,
        message: `Your order ${updatedOrder.orderNumber} status has been updated to: ${status}`,
        type: "order_status_updated",
        isRead: false,
      });
    } catch (nErr) {
      console.error("Failed to insert status update notification:", nErr);
    }
  }

  return NextResponse.json({ success: true });
}
