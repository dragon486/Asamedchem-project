"use client";
// components/Header.tsx
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationCenter from "./NotificationCenter";

interface HeaderProps {
  session: any;
}

export default function Header({ session }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sync search input with search param in URL (e.g. if cleared or changed elsewhere)
  useEffect(() => {
    setSearchQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  // Focus search bar on Command+F (or Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const prefix = pathname.startsWith("/admin") ? "/admin" : "/seller";
    // Replace URL query parameter to filter in real-time
    router.replace(`${prefix}/products?search=${encodeURIComponent(val)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Typing already filters results instantly
  };

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const initials = userName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="top-bar">
      <style>{`
        .hamburger-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--foreground);
          cursor: pointer;
          padding: 0.25rem;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          transition: background 0.15s ease;
        }
        .hamburger-toggle:hover {
          background: #f1f5f9;
        }
        .mobile-logo {
          display: none;
          align-items: center;
        }
        .search-form {
          display: flex;
          align-items: center;
          height: 2.25rem;
        }
        .search-container {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0 0.75rem;
          width: 280px;
          height: 2.25rem;
          gap: 0.5rem;
          position: relative;
        }
        .search-container input {
          border: none;
          background: transparent;
          font-size: 0.8125rem;
          color: var(--foreground);
          outline: none;
          width: 100%;
        }
        .search-container input::placeholder {
          color: #94a3b8;
        }
        .search-container i {
          color: #94a3b8;
          font-size: 0.875rem;
        }
        .kbd-shortcut {
          font-size: 0.65rem;
          font-weight: 600;
          background: white;
          border: 1px solid #e2e8f0;
          color: #94a3b8;
          border-radius: 4px;
          padding: 0.1rem 0.3rem;
          box-shadow: 0 1px 1px rgba(0,0,0,0.02);
          pointer-events: none;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          height: 2.25rem;
        }
        .header-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-left: 1px solid #e2e8f0;
          padding-left: 1.25rem;
          height: 2.25rem;
          position: relative;
          user-select: none;
        }
        .profile-info {
          display: flex;
          flex-direction: column;
        }
        .profile-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--foreground);
          line-height: 1.2;
        }
        .profile-email {
          font-size: 0.6875rem;
          color: var(--muted-foreground);
          margin-top: 0.1rem;
        }
        .profile-dropdown {
          position: absolute;
          top: 3.25rem;
          right: 0;
          width: 160px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          box-shadow: var(--shadow-lg);
          padding: 0.375rem;
          display: flex;
          flex-direction: column;
          z-index: 10000;
          animation: fadeIn 0.15s ease-out;
        }
        .profile-dropdown-item {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: none;
          background: none;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #64748b;
          transition: all 0.15s ease;
        }
        .profile-dropdown-item:hover {
          background: #f1fcf6;
          color: #0f5132;
        }
        .profile-dropdown-item.signout-item {
          color: #ef4444;
        }
        .profile-dropdown-item.signout-item:hover {
          background: #fef2f2;
          color: #991b1b;
        }

        @media (max-width: 1024px) {
          .hamburger-toggle {
            display: flex;
          }
          .mobile-logo {
            display: flex;
          }
          .kbd-shortcut {
            display: none;
          }
          .search-container {
            width: 160px;
          }
        }
        @media (max-width: 768px) {
          .profile-info {
            display: none;
          }
          .header-profile {
            padding-left: 0.5rem;
            border-left: none;
          }
          .header-actions {
            gap: 0.75rem;
          }
        }
        @media (max-width: 480px) {
          .mobile-logo img {
            height: 18px;
          }
          .search-container {
            width: 110px;
          }
          .search-container input::placeholder {
            color: transparent;
          }
        }
      `}</style>

      {/* Left: Hamburger, Mobile Logo & Search Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button 
          type="button"
          className="hamburger-toggle" 
          onClick={() => {
            if (typeof document !== "undefined") {
              document.body.classList.toggle("sidebar-open");
            }
          }}
          aria-label="Toggle sidebar"
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="mobile-logo">
          <img src="/logo.png" alt="AasaMedChem Logo" style={{ height: "24px", width: "auto", objectFit: "contain" }} />
        </div>

        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-container">
            <i className="bi bi-search"></i>
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <span className="kbd-shortcut">⌘ F</span>
          </div>
        </form>
      </div>

      {/* Right: Actions (Notification, Clickable Profile Dropdown) */}
      <div className="header-actions">
        {/* Notification Bell */}
        <NotificationCenter />

        {/* User Profile */}
        <div 
          className="header-profile" 
          ref={profileRef}
          onClick={() => setProfileOpen(!profileOpen)}
          style={{ cursor: "pointer" }}
          id="profile-dropdown-trigger"
        >
          <div 
            className="avatar" 
            style={{ 
              background: "var(--primary-forest)", 
              color: "white", 
              width: "2.25rem", 
              height: "2.25rem",
              fontSize: "0.8125rem" 
            }}
          >
            {initials}
          </div>
          <div className="profile-info">
            <span className="profile-name">{userName}</span>
            <span className="profile-email">{userEmail}</span>
          </div>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="profile-dropdown" id="profile-dropdown-menu">
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })} 
                className="profile-dropdown-item signout-item"
                id="header-signout-btn"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
