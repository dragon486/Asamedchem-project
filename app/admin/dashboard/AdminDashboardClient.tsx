"use client";
// app/admin/dashboard/AdminDashboardClient.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/conversions";

interface CategoryStat {
  name: string;
  productCount: number;
}

interface SellerData {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date | null;
}

interface OrderItemData {
  product: { name: string };
  lineTotal: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string | null;
  createdAt: string | Date | null;
  seller: { name: string } | null;
  items: OrderItemData[];
}

interface Props {
  activeProducts: number;
  totalOrders: number;
  registeredSellers: number;
  totalRevenue: number;
  categoryStats: CategoryStat[];
  lowStockProducts: any[];
  recentOrders: OrderData[];
  sellers: SellerData[];
  fulfillmentRate: number;
}

export default function AdminDashboardClient({
  activeProducts,
  totalOrders,
  registeredSellers,
  totalRevenue,
  categoryStats,
  lowStockProducts,
  recentOrders,
  sellers,
  fulfillmentRate,
}: Props) {


  // Semi-circle gauge settings
  const radius = 40;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // 125.66 for semi-circle (180deg)
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, fulfillmentRate)) / 100) * circumference;

  // Find max product count for bar chart scaling
  const maxProducts = Math.max(...categoryStats.map((c) => c.productCount), 1);

  // Critical stock alert (lowest active stock item)
  const criticalStockItem = lowStockProducts[0];

  return (
    <>
      <style>{`
        /* Donezo Inspired Theme Variables */
        :root {
          --primary-forest: #0f5132;
          --primary-forest-hover: #0a3622;
          --forest-light: #e8f5e9;
          --card-radius: 1rem;
          --donezo-border: #f1f5f9;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .dashboard-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .kpi-card-premium {
          background: white;
          border: 1px solid var(--donezo-border);
          border-radius: var(--card-radius);
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s ease;
          text-decoration: none;
          color: var(--foreground);
        }

        .kpi-card-premium:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .kpi-card-premium.forest {
          background: var(--primary-forest);
          color: white !important;
          border: none;
        }

        .kpi-card-premium.forest:hover {
          background: var(--primary-forest-hover);
        }

        .kpi-title {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--muted-foreground);
          margin-bottom: 1rem;
        }

        .kpi-card-premium.forest .kpi-title {
          color: rgba(255,255,255,0.7);
        }

        .kpi-value {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .kpi-subtext {
          font-size: 0.75rem;
          color: var(--muted-foreground);
        }

        .kpi-card-premium.forest .kpi-subtext {
          color: rgba(255,255,255,0.6);
        }

        .kpi-link-arrow {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--foreground);
          transition: all 0.2s ease;
        }

        .kpi-card-premium.forest .kpi-link-arrow {
          background: rgba(255,255,255,0.15);
          color: white;
        }

        .kpi-card-premium:hover .kpi-link-arrow {
          background: var(--primary);
          color: white;
        }

        .kpi-card-premium.forest:hover .kpi-link-arrow {
          background: white;
          color: var(--primary-forest);
        }

        /* Chart Card */
        .chart-bar-container {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 180px;
          padding: 1rem 0;
        }

        .chart-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 45px;
          height: 100%;
          justify-content: flex-end;
          position: relative;
        }

        .chart-bar-pillar {
          width: 24px;
          background: var(--muted);
          border-radius: 12px;
          position: relative;
          transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          cursor: pointer;
        }

        .chart-bar-pillar.filled {
          background: var(--primary-forest);
        }

        .chart-bar-pillar:hover {
          opacity: 0.85;
        }

        .chart-bar-tooltip {
          position: absolute;
          bottom: 100%;
          background: var(--foreground);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          margin-bottom: 4px;
          opacity: 0;
          transition: opacity 0.15s ease;
          pointer-events: none;
          white-space: nowrap;
        }

        .chart-bar-col:hover .chart-bar-tooltip {
          opacity: 1;
        }

        .chart-bar-label {
          font-size: 0.65rem;
          color: var(--muted-foreground);
          font-weight: 600;
          margin-top: 0.5rem;
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Gauge wrapper */
        .gauge-holder {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 1rem;
        }



        /* List Cards */
        .list-card-premium {
          background: white;
          border: 1px solid var(--donezo-border);
          border-radius: var(--card-radius);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }

        .list-card-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--donezo-border);
          font-weight: 700;
          font-size: 0.9375rem;
          color: var(--foreground);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .list-card-body {
          padding: 0.5rem 0;
        }

        .list-item-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid var(--donezo-border);
          transition: background 0.15s ease;
          text-decoration: none;
          color: inherit;
        }

        .list-item-premium:last-child {
          border-bottom: none;
        }

        .list-item-premium:hover {
          background: var(--muted);
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-kpis {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .dashboard-kpis {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Donezo inspired header summary */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle" style={{ fontSize: "0.875rem", opacity: 0.7 }}>
            Plan, monitor inventory, and fulfill customer order requests with ease.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/admin/products/new" className="btn btn-primary" style={{ background: "var(--primary-forest)", borderColor: "var(--primary-forest)" }}>
            <i className="bi bi-plus-lg me-1"></i> Add Product
          </Link>
          <Link href="/admin/inventory" className="btn btn-secondary">
            <i className="bi bi-box-seam me-1"></i> View Inventory
          </Link>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="dashboard-kpis">
        {/* KPI 1: Active Products (Forest Green Theme) */}
        <Link href="/admin/products" className="kpi-card-premium forest">
          <div>
            <div className="kpi-title">Active Products</div>
            <div className="kpi-value">{activeProducts}</div>
          </div>
          <div className="kpi-subtext">Catalog items</div>
          <div className="kpi-link-arrow">
            <i className="bi bi-arrow-up-right"></i>
          </div>
        </Link>

        {/* KPI 2: Total Orders */}
        <Link href="/admin/orders" className="kpi-card-premium">
          <div>
            <div className="kpi-title">Total Orders</div>
            <div className="kpi-value">{totalOrders}</div>
          </div>
          <div className="kpi-subtext">Quotations submitted</div>
          <div className="kpi-link-arrow">
            <i className="bi bi-arrow-up-right"></i>
          </div>
        </Link>

        {/* KPI 3: Registered Sellers */}
        <Link href="/admin/users" className="kpi-card-premium">
          <div>
            <div className="kpi-title">Registered Sellers</div>
            <div className="kpi-value">{registeredSellers}</div>
          </div>
          <div className="kpi-subtext">Active seller accounts</div>
          <div className="kpi-link-arrow">
            <i className="bi bi-arrow-up-right"></i>
          </div>
        </Link>

        {/* KPI 4: Total Revenue */}
        <Link href="/admin/orders" className="kpi-card-premium">
          <div>
            <div className="kpi-title">Total Revenue</div>
            <div className="kpi-value" style={{ fontSize: "1.75rem", paddingTop: "0.25rem", paddingBottom: "0.25rem" }}>
              {formatINR(totalRevenue)}
            </div>
          </div>
          <div className="kpi-subtext">All-time sales value</div>
          <div className="kpi-link-arrow">
            <i className="bi bi-arrow-up-right"></i>
          </div>
        </Link>
      </div>

      {/* Row 2: Analytics Bar Chart + Low Stock Alert + Recent Orders */}
      <div className="dashboard-grid">
        {/* Column 1: Category Analytics (Bar Chart) */}
        <div className="list-card-premium" style={{ height: "100%" }}>
          <div className="list-card-header">
            <span>Category Analytics</span>
            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", fontWeight: 500 }}>
              Products per category
            </span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem" }}>
            <div className="chart-bar-container">
              {categoryStats.map((cat, idx) => {
                const heightPercent = maxProducts > 0 ? (cat.productCount / maxProducts) * 150 : 15;
                const roundedHeight = Math.max(15, heightPercent);
                return (
                  <div key={idx} className="chart-bar-col">
                    <div className="chart-bar-tooltip">
                      {cat.productCount} Product(s)
                    </div>
                    <div 
                      className={`chart-bar-pillar ${cat.productCount > 0 ? "filled" : ""}`} 
                      style={{ height: `${roundedHeight}px` }}
                    ></div>
                    <div className="chart-bar-label" title={cat.name}>
                      {cat.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 2: Low Stock Reminder Alert */}
        <div className="list-card-premium" style={{ height: "100%" }}>
          <div className="list-card-header">
            <span>Stock Reminder</span>
          </div>
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            {criticalStockItem ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ color: "var(--danger)", fontSize: "1.25rem" }}></i>
                  <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Low Stock Alert</span>
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--foreground)", fontWeight: 600, marginBottom: "0.25rem" }}>
                  {criticalStockItem.name}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                  Stock level is critical: <strong style={{ color: "var(--danger)" }}>{parseFloat(criticalStockItem.stockQuantity).toLocaleString()} {criticalStockItem.baseUnit}</strong>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <i className="bi bi-check-circle-fill" style={{ color: "var(--success)", fontSize: "2rem", marginBottom: "0.5rem", display: "block" }}></i>
                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>All Stock Levels OK</div>
              </div>
            )}
            <Link 
              href="/admin/inventory" 
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", marginTop: "1rem", background: "var(--forest-light)", color: "var(--primary-forest)", border: "none", fontWeight: 700 }}
            >
              <i className="bi bi-arrow-right-short me-1"></i> Manage Inventory
            </Link>
          </div>
        </div>

        {/* Column 3: Recent Orders */}
        <div className="list-card-premium" style={{ height: "100%" }}>
          <div className="list-card-header">
            <span>Recent Orders</span>
            <Link href="/admin/orders" style={{ fontSize: "0.75rem", color: "var(--primary-forest)", textDecoration: "none", fontWeight: 600 }}>
              View all
            </Link>
          </div>
          <div className="list-card-body" style={{ padding: 0 }}>
            {recentOrders.length === 0 ? (
              <div className="notification-item-empty" style={{ padding: "2rem" }}>
                No orders placed
              </div>
            ) : (
              recentOrders.slice(0, 3).map((order) => (
                <Link key={order.id} href={`/admin/orders?expand=${order.id}`} className="list-item-premium">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{order.orderNumber}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      {order.seller?.name || "Seller"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge badge-${order.status}`} style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                      {order.status}
                    </span>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary-forest)", marginTop: "0.125rem" }}>
                      {formatINR(parseFloat(order.totalAmount ?? "0"))}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Sellers Directory + Order Fulfillment Gauge + Live Clock */}
      <div className="dashboard-grid">
        {/* Column 1: Registered Sellers List */}
        <div className="list-card-premium">
          <div className="list-card-header">
            <span>Registered Sellers</span>
            <Link href="/admin/users" style={{ fontSize: "0.75rem", color: "var(--primary-forest)", textDecoration: "none", fontWeight: 600 }}>
              Directory
            </Link>
          </div>
          <div className="list-card-body" style={{ padding: 0 }}>
            {sellers.length === 0 ? (
              <div className="notification-item-empty" style={{ padding: "2rem" }}>
                No sellers registered
              </div>
            ) : (
              sellers.slice(0, 3).map((s) => {
                const initials = s.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={s.id} className="list-item-premium" style={{ borderBottom: "1px solid var(--donezo-border)", cursor: "default" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div className="avatar" style={{ background: "var(--primary-forest)", width: "2.25rem", height: "2.25rem", fontSize: "0.8125rem" }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{s.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{s.email}</div>
                      </div>
                    </div>
                    <span className="badge badge-confirmed" style={{ fontSize: "0.65rem" }}>Seller</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Order Fulfillment Gauge */}
        <div className="list-card-premium">
          <div className="list-card-header">
            <span>Fulfillment Rate</span>
          </div>
          <div style={{ padding: "1rem 1.5rem" }} className="gauge-holder">
            <svg width="120" height="70" viewBox="0 0 100 60" style={{ display: "block" }}>
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="var(--primary-forest)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
              />
              <text x="50" y="45" textAnchor="middle" style={{ fontSize: "0.875rem", fontWeight: 800, fill: "var(--foreground)" }}>
                {Math.round(fulfillmentRate)}%
              </text>
            </svg>
            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", textAlign: "center", marginTop: "0.25rem" }}>
              Orders completed & shipped
            </div>
          </div>
        </div>

        {/* Column 3: Low Stock Watchlist */}
        <div className="list-card-premium">
          <div className="list-card-header">
            <span>Stock Watchlist</span>
            <Link href="/admin/inventory" style={{ fontSize: "0.75rem", color: "var(--primary-forest)", textDecoration: "none", fontWeight: 600 }}>
              Watchlist
            </Link>
          </div>
          <div className="list-card-body" style={{ padding: 0 }}>
            {lowStockProducts.length <= 1 ? (
              <div className="notification-item-empty" style={{ padding: "2.5rem 1.5rem" }}>
                No other items on watchlist
              </div>
            ) : (
              lowStockProducts.slice(1, 4).map((prod) => {
                const qty = parseFloat(prod.stockQuantity);
                const isCritical = qty < 50;
                return (
                  <div key={prod.id} className="list-item-premium" style={{ borderBottom: "1px solid var(--donezo-border)", cursor: "default" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{prod.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                        Base unit: {prod.baseUnit}
                      </div>
                    </div>
                    <span 
                      className={`badge badge-${isCritical ? "pending" : "shipped"}`} 
                      style={{ 
                        fontSize: "0.65rem", 
                        padding: "0.15rem 0.4rem", 
                        background: isCritical ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        color: isCritical ? "rgb(239, 68, 68)" : "rgb(245, 158, 11)",
                        border: isCritical ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(245, 158, 11, 0.2)",
                      }}
                    >
                      {qty.toLocaleString()} left
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
