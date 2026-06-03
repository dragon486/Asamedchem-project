import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, or, isNull, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any)?.id;
  const role = (session.user as any)?.role;

  try {
    let result;
    if (role === "admin") {
      result = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.isRead, false),
            or(isNull(notifications.userId), eq(notifications.userId, userId))
          )
        )
        .orderBy(desc(notifications.createdAt));
    } else {
      result = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.isRead, false),
            eq(notifications.userId, userId)
          )
        )
        .orderBy(desc(notifications.createdAt));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Fetch notifications error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any)?.id;
  const role = (session.user as any)?.role;

  try {
    if (role === "admin") {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.isRead, false),
            or(isNull(notifications.userId), eq(notifications.userId, userId))
          )
        );
    } else {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.isRead, false),
            eq(notifications.userId, userId)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update notifications error:", err);
    return NextResponse.json({ error: "Failed to update notifications." }, { status: 500 });
  }
}
