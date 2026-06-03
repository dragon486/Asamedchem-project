// app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface Ctx { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { name, description } = await req.json();
  try {
    await db.update(categories).set({ name, description: description || null }).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Name already exists." }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(categories).where(eq(categories.id, id));
  return NextResponse.json({ success: true });
}
