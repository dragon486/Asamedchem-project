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

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <i className="bi bi-prescription2" style={{ fontSize: "1.25rem", color: "var(--primary-forest)" }}></i>
        <div>
          <div style={{ fontSize: "0.9375rem" }}>AasaMedChem</div>
          <div style={{ fontSize: "0.6875rem", opacity: 0.6, fontWeight: 500, marginTop: "1px" }}>
            {role === "admin" ? "Admin Panel" : "Seller Portal"}
          </div>
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
            >
              <i className={item.icon} style={{ fontSize: "1.05rem" }}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
