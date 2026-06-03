// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required." }, { status: 400 });

  try {
    const [cat] = await db.insert(categories).values({ name, description: description || null }).returning();
    return NextResponse.json(cat, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Category name already exists." }, { status: 409 });
  }
}
