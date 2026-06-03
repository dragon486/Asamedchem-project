// app/page.tsx
// Root redirect is handled by middleware - this page shouldn't be hit by logged-in users
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any)?.role;
  if (role === "admin") redirect("/admin/dashboard");
  redirect("/seller/dashboard");
}
