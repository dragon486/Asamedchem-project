"use client";
// app/admin/orders/AdminOrdersClient.tsx
import { useState, useEffect } from "react";
import { formatINR, UNIT_CONFIG } from "@/lib/conversions";
import { useRouter } from "next/navigation";

interface OrderItemData {
  id: string;
  orderedUnit: string;
  orderedQuantity: string;
  baseQuantity: string;
  conversionFactor: string;
  unitPriceAtOrder: string;
  lineTotal: string;
  product: { name: string; baseUnit: string; sku: string | null };
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  notes: string | null;
  totalAmount: string | null;
  createdAt: Date | null;
  seller: { name: string; email: string } | null;
  items: OrderItemData[];
}

interface Props {
  orders: OrderData[];
}

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "cancelled"];

export default function AdminOrdersClient({ orders }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const expand = params.get("expand");
      if (expand) {
        setExpandedId(expand);
        setTimeout(() => {
          const el = document.getElementById(`order-card-${expand}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
      }
    }
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.seller?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdatingId(null);
    router.refresh();
  };

  return (
    <>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: "200px" }}>
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="form-input"
            placeholder="Search order # or seller name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="order-search"
          />
        </div>
        <select className="form-select" style={{ width: "160px" }} value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} id="filter-status">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <i className="bi bi-receipt" style={{ fontSize: "3rem", opacity: 0.5, marginBottom: "0.5rem" }}></i>
          <p>No orders found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((order) => (
            <div key={order.id} className="card" id={`order-card-${order.id}`}>
              {/* Order header */}
              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "1rem 1.25rem", cursor: "pointer", flexWrap: "wrap", gap: "0.75rem"
                }}
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{order.orderNumber}</span>
                    <span className={`badge badge-${order.status}`}>{order.status}</span>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                    <i className="bi bi-person-fill" style={{ marginRight: "0.25rem" }}></i> {order.seller?.name} ({order.seller?.email}) •{" "}
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                    }) : "—"} •{" "}
                    {order.items.length} item(s)
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span className="price-sm">{formatINR(parseFloat(order.totalAmount ?? "0"))}</span>
                  <select
                    className="form-select"
                    style={{ width: "140px", padding: "0.375rem 2rem 0.375rem 0.625rem" }}
                    value={order.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updatingId === order.id}
                    id={`status-${order.id}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <span style={{ color: "var(--muted-foreground)", display: "flex", alignItems: "center" }}>
                    {expandedId === order.id ? <i className="bi bi-chevron-up"></i> : <i className="bi bi-chevron-down"></i>}
                  </span>
                </div>
              </div>

              {/* Expanded items */}
              {expandedId === order.id && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {order.notes && (
                    <div style={{ padding: "0.75rem 1.25rem", background: "var(--muted)", fontSize: "0.875rem" }}>
                      <strong>Notes:</strong> {order.notes}
                    </div>
                  )}
                  <div className="table-wrapper" style={{ borderRadius: 0, border: "none" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Ordered (as entered)</th>
                          <th>Base Equivalent</th>
                          <th>Conversion Factor</th>
                          <th>Unit Price (at order)</th>
                          <th>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                              {item.product.sku && (
                                <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                  {item.product.sku}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>
                                {parseFloat(item.orderedQuantity).toLocaleString("en-IN", { maximumFractionDigits: 6 })} {item.orderedUnit}
                              </span>
                            </td>
                            <td style={{ color: "var(--muted-foreground)" }}>
                              {parseFloat(item.baseQuantity).toLocaleString("en-IN", { maximumFractionDigits: 6 })} {item.product.baseUnit}
                            </td>
                            <td style={{ color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                              × {parseFloat(item.conversionFactor).toLocaleString()}
                            </td>
                            <td style={{ color: "var(--muted-foreground)" }}>
                              {formatINR(parseFloat(item.unitPriceAtOrder))} / {item.product.baseUnit}
                            </td>
                            <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                              {formatINR(parseFloat(item.lineTotal))}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={5} style={{ textAlign: "right", fontWeight: 700, paddingRight: "1rem" }}>
                            ORDER TOTAL
                          </td>
                          <td style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1rem" }}>
                            {formatINR(parseFloat(order.totalAmount ?? "0"))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
