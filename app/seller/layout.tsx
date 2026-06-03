// app/seller/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NotificationCenter from "@/components/NotificationCenter";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "seller") {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        role="seller"
        userName={session.user?.name ?? "Seller"}
        userEmail={session.user?.email ?? ""}
      />
      <div className="main-content">
        <NotificationCenter />
        {children}
      </div>
    </div>
  );
}
