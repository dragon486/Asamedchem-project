"use client";
// app/seller/dashboard/SellerDashboardClient.tsx
import Link from "next/link";
import { formatINR } from "@/lib/conversions";

interface OrderItemData {
  product: { name: string };
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string | null;
  createdAt: string | Date | null;
  items: OrderItemData[];
}

interface ProductData {
  id: string;
  name: string;
  baseUnit: string;
  pricePerBaseUnit: string;
}

interface Props {
  userName: string;
  totalOrders: number;
  pendingCount: number;
  totalSpent: number;
  shippedCount: number;
  recentOrders: OrderData[];
  newProducts: ProductData[];
}

export default function SellerDashboardClient({
  userName,
  totalOrders,
  pendingCount,
  totalSpent,
  shippedCount,
  recentOrders,
  newProducts,
}: Props) {
  // Fulfillment rate for this seller
  const fulfillmentRate = totalOrders > 0 ? ((shippedCount + (totalOrders - pendingCount - shippedCount)) / totalOrders) * 100 : 0;
  
  // Semi-circle gauge settings
  const radius = 40;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // 125.66
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, fulfillmentRate)) / 100) * circumference;

  return (
    <>
      <style>{`
        :root {
          --primary-forest: #0f5132;
          --primary-forest-hover: #0a3622;
          --forest-light: #e8f5e9;
          --card-radius: 1rem;
          --donezo-border: #f1f5f9;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
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

      {/* Welcome header */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Welcome back, {userName.split(" ")[0]} 👋</h1>
          <p className="page-subtitle" style={{ fontSize: "0.875rem", opacity: 0.7 }}>
            Track your quotations, manage orders, and search products with ease.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/seller/products" className="btn btn-primary" style={{ background: "var(--primary-forest)", borderColor: "var(--primary-forest)" }}>
            <i className="bi bi-search me-1"></i> Browse Products
          </Link>
          <Link href="/seller/cart" className="btn btn-secondary">
            <i className="bi bi-cart3 me-1"></i> View Cart
          </Link>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="dashboard-kpis">
        {/* KPI 1: Total Orders (Forest Green Theme) */}
        <Link href="/seller/orders" className="kpi-card-premium forest">
          <div>
            <div className="kpi-title">Total Orders</div>
            <div className="kpi-value">{totalOrders}</div>
          </div>
          <div className="kpi-subtext">Quotations submitted</div>
          <div className="kpi-link-arrow">
            <i className="bi bi-arrow-up-right"></i>
          </div>
        </Link>

        {/* KPI 2: Pending Quotations */}
        <Link href="/seller/orders" className="kpi-card-premium">
          <div>
            <div className="kpi-title">Pending Quotations</div>
            <div className="kpi-value">{pendingCount}</div>
          </div>
          <div className="kpi-subtext">Awaiting admin review</div>
          <div className="kpi-link-arrow">
            <i className="bi bi-arrow-up-right"></i>
          </div>
        </Link>

        {/* KPI 3: Total Spent */}
        <Link href="/seller/orders" className="kpi-card-premium">
          <div>
            <div className="kpi-title">Total Spent</div>
            <div className="kpi-value" style={{ fontSize: "1.75rem", paddingTop: "0.25rem", paddingBottom: "0.25rem" }}>
              {formatINR(totalSpent)}
            </div>
          </div>
          <div className="kpi-subtext">Confirmed & shipped sales</div>
          <div className="kpi-link-arrow">
            <i className="bi bi-arrow-up-right"></i>
          </div>
        </Link>

        {/* KPI 4: Shipped Orders */}
        <Link href="/seller/orders" className="kpi-card-premium">
          <div>
            <div className="kpi-title">Shipped Orders</div>
            <div className="kpi-value">{shippedCount}</div>
          </div>
          <div className="kpi-subtext">Orders in transit/delivered</div>
          <div className="kpi-link-arrow">
            <i className="bi bi-arrow-up-right"></i>
          </div>
        </Link>
      </div>

      {/* Row 2: Recent Orders & Fulfillment / New Arrivals */}
      <div className="dashboard-grid">
        {/* Column 1: Recent Orders */}
        <div className="list-card-premium" style={{ height: "100%" }}>
          <div className="list-card-header">
            <span>Recent Orders</span>
            <Link href="/seller/orders" style={{ fontSize: "0.75rem", color: "var(--primary-forest)", textDecoration: "none", fontWeight: 600 }}>
              View all
            </Link>
          </div>
          <div className="list-card-body" style={{ padding: 0 }}>
            {recentOrders.length === 0 ? (
              <div className="notification-item-empty" style={{ padding: "3rem" }}>
                <i className="bi bi-receipt" style={{ fontSize: "2rem", opacity: 0.3, marginBottom: "0.5rem", display: "block" }}></i>
                No orders placed yet
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link key={order.id} href={`/seller/orders?expand=${order.id}`} className="list-item-premium">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{order.orderNumber}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                      {order.items.length} item(s) · {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
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

        {/* Column 2: Order Fulfillment Gauge & New arrivals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Fulfillment Rate Gauge */}
          <div className="list-card-premium">
            <div className="list-card-header">
              <span>Fulfillment Rate</span>
            </div>
            <div style={{ padding: "1.25rem 1.5rem" }} className="gauge-holder">
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
                Orders confirmed & shipped
              </div>
            </div>
          </div>

          {/* New Arrivals List */}
          <div className="list-card-premium">
            <div className="list-card-header">
              <span>New Arrivals</span>
              <Link href="/seller/products" style={{ fontSize: "0.75rem", color: "var(--primary-forest)", textDecoration: "none", fontWeight: 600 }}>
                Browse
              </Link>
            </div>
            <div className="list-card-body" style={{ padding: 0 }}>
              {newProducts.length === 0 ? (
                <div className="notification-item-empty" style={{ padding: "1.5rem" }}>
                  No new products
                </div>
              ) : (
                newProducts.map((p) => (
                  <Link key={p.id} href={`/seller/products?search=${encodeURIComponent(p.name)}`} className="list-item-premium">
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{p.name}</span>
                      <span style={{ fontSize: "0.725rem", color: "var(--muted-foreground)" }}>Base unit: {p.baseUnit}</span>
                    </div>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary-forest)" }}>
                      {formatINR(parseFloat(p.pricePerBaseUnit))}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
