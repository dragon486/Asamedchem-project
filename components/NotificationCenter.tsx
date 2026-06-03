"use client";
// components/NotificationCenter.tsx
import { useState, useEffect, useRef } from "react";

interface NotificationItem {
  id: string;
  userId: string | null;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface ToastItem {
  id: string;
  message: string;
  type: string;
}

function getRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [shake, setShake] = useState(false);
  
  const seenIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: NotificationItem[] = await res.json();
      
      // Separate new ones that we haven't seen yet
      let hasNew = false;
      const newItems: NotificationItem[] = [];

      data.forEach((item) => {
        if (!seenIds.current.has(item.id)) {
          seenIds.current.add(item.id);
          newItems.push(item);
          if (!isFirstLoad.current) {
            hasNew = true;
          }
        }
      });

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      } else if (hasNew) {
        // Trigger toast alerts for new items
        newItems.forEach((item) => {
          triggerToast(item.id, item.message, item.type);
        });
        // Trigger bell shake animation
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }

      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const triggerToast = (id: string, message: string, type: string) => {
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Poll every 5 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <>
      <style>{`
        .notification-bell-container {
          position: relative;
          z-index: 10000;
          display: flex;
          align-items: center;
          height: 2.25rem;
        }
        .notification-bell-btn {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 50%;
          background: white;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          color: #64748b;
        }
        .notification-bell-btn:hover {
          transform: scale(1.05);
          background: #f1fcf6;
          border-color: rgba(15, 81, 50, 0.2);
          color: var(--primary-forest);
          box-shadow: var(--shadow-md);
        }
        .notification-bell-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--danger);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          width: 1.1rem;
          height: 1.1rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        @keyframes bellShake {
          0% { transform: rotate(0); }
          15% { transform: rotate(25deg); }
          30% { transform: rotate(-20deg); }
          45% { transform: rotate(15deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0); }
        }
        .notification-bell-shake {
          animation: bellShake 0.6s ease-in-out;
        }
        .notification-dropdown {
          position: absolute;
          top: 3rem;
          right: -10px;
          width: 320px;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: fadeIn 0.2s ease-out;
          display: flex;
          flex-direction: column;
          max-height: 400px;
          z-index: 10000;
        }
        .notification-dropdown-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
          font-weight: 700;
          font-size: 0.875rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--foreground);
          background: white;
        }
        .notification-dropdown-body {
          overflow-y: auto;
          flex: 1;
          background: white;
        }
        .notification-item {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.8125rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          transition: background 0.15s ease;
          background: white;
        }
        .notification-item:last-child {
          border-bottom: none;
        }
        .notification-item:hover {
          background: var(--muted);
        }
        .notification-item-text {
          color: var(--foreground);
          line-height: 1.35;
          text-align: left;
        }
        .notification-item-time {
          font-size: 0.7rem;
          color: var(--muted-foreground);
          align-self: flex-end;
        }
        .notification-item-empty {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--muted-foreground);
          font-size: 0.875rem;
          background: white;
        }
        .notification-toast-container {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 20000;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 360px;
          width: 100%;
        }
        .notification-toast {
          background: white;
          border-left: 4px solid var(--primary);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          border-top: 1px solid var(--border);
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 0.875rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .notification-toast.order_placed {
          border-left-color: var(--secondary);
        }
        .notification-toast.order_status_updated {
          border-left-color: var(--success);
        }
        .notification-toast-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--foreground);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .notification-toast-close {
          background: none;
          border: none;
          font-size: 1rem;
          color: var(--muted-foreground);
          cursor: pointer;
          line-height: 1;
        }
        .notification-toast-close:hover {
          color: var(--foreground);
        }
        .notification-toast-msg {
          font-size: 0.75rem;
          color: var(--muted-foreground);
          line-height: 1.35;
          text-align: left;
        }
      `}</style>

      {/* Floating Bell Icon at Top Right */}
      <div className="notification-bell-container" ref={containerRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`notification-bell-btn ${shake ? "notification-bell-shake" : ""}`}
          id="notification-bell"
        >
          <i className="bi bi-bell-fill"></i>
          {unreadCount > 0 && (
            <span className="notification-bell-badge" id="notification-count">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown list */}
        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  id="mark-all-read-btn"
                >
                  <i className="bi bi-check2-all me-1"></i> Mark all
                </button>
              )}
            </div>
            <div className="notification-dropdown-body">
              {notifications.length === 0 ? (
                <div className="notification-item-empty">
                  No new notifications
                </div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className="notification-item">
                    <span className="notification-item-text">{item.message}</span>
                    <span className="notification-item-time">{getRelativeTime(item.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Toast Alerts in Bottom Right */}
      <div className="notification-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`notification-toast ${toast.type}`}>
            <div className="notification-toast-title">
              <span>
                {toast.type === "order_placed" ? (
                  <><i className="bi bi-cart-fill me-1" style={{ color: "var(--secondary)" }}></i> New Order Placed</>
                ) : (
                  <><i className="bi bi-info-circle-fill me-1" style={{ color: "var(--success)" }}></i> Status Updated</>
                )}
              </span>
              <button 
                onClick={() => handleDismissToast(toast.id)}
                className="notification-toast-close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: "0.8rem" }}></i>
              </button>
            </div>
            <div className="notification-toast-msg">{toast.message}</div>
          </div>
        ))}
      </div>
    </>
  );
}
