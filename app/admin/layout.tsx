// app/admin/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NotificationCenter from "@/components/NotificationCenter";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        role="admin"
        userName={session.user?.name ?? "Admin"}
        userEmail={session.user?.email ?? ""}
      />
      <div className="main-content">
        <NotificationCenter />
        {children}
      </div>
    </div>
  );
}
