"use client";
// components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  role: "admin" | "seller";
  userName: string;
  userEmail: string;
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

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "admin" ? ADMIN_NAV : SELLER_NAV;
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <i className="bi bi-prescription2" style={{ fontSize: "1.25rem" }}></i>
        <div>
          <div style={{ fontSize: "0.9375rem" }}>AasaMedChem</div>
          <div style={{ fontSize: "0.6875rem", opacity: 0.5, fontWeight: 400, marginTop: "1px" }}>
            {role === "admin" ? "Admin Panel" : "Seller Portal"}
          </div>
        </div>
      </div>

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

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.8)", marginTop: "0.25rem", textAlign: "left" }}
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
