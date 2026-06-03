"use client";
// components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  role: "admin" | "seller";
}

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard",  label: "Dashboard",   icon: "bi bi-speedometer2" },
  { href: "/admin/products",   label: "Products",    icon: "bi bi-capsule" },
  { href: "/admin/categories", label: "Categories",  icon: "bi bi-tags" },
  { href: "/admin/inventory",  label: "Inventory",   icon: "bi bi-box-seam" },
  { href: "/admin/orders",     label: "Orders",      icon: "bi bi-receipt" },
  { href: "/admin/users",      label: "Users",       icon: "bi bi-people" },
];

const SELLER_NAV: NavItem[] = [
  { href: "/seller/dashboard", label: "Dashboard",   icon: "bi bi-house" },
  { href: "/seller/products",  label: "Browse Products", icon: "bi bi-search" },
  { href: "/seller/cart",      label: "Cart / Order", icon: "bi bi-cart3" },
  { href: "/seller/orders",    label: "My Orders",   icon: "bi bi-receipt" },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "admin" ? ADMIN_NAV : SELLER_NAV;

  const handleLinkClick = () => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("sidebar-open");
    }
  };

  return (
    <>
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="sidebar-logo" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.25rem", borderBottom: "1px solid #e2e8f0", padding: "1rem 1.25rem" }}>
          <img src="/logo.png" alt="AasaMedChem Logo" style={{ height: "30px", width: "auto", objectFit: "contain", maxWidth: "100%" }} />
          <div style={{ fontSize: "0.6875rem", opacity: 0.6, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {role === "admin" ? "Admin Panel" : "Seller Portal"}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              {role === "admin" ? "Administration" : "Seller"}
            </div>
            {nav.map((item) => (
              <Link
                 key={item.href}
                 href={item.href}
                 className={`sidebar-link ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
                 onClick={handleLinkClick}
              >
                <i className={item.icon} style={{ fontSize: "1.05rem" }}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>
      <div 
        className="sidebar-overlay" 
        onClick={() => {
          if (typeof document !== "undefined") {
            document.body.classList.remove("sidebar-open");
          }
        }} 
      />
    </>
  );
}
