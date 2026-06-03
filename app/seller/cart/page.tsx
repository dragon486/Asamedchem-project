"use client";
// app/seller/cart/page.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  formatINR,
  calculateLineTotal,
  UNIT_CONFIG,
  pricePerDisplayUnit,
  type Unit,
} from "@/lib/conversions";
import Link from "next/link";

const CART_KEY = "asamedchem_cart";

interface CartItem {
  productId: string;
  productName: string;
  unit: Unit;
  quantity: number | string;
  pricePerBaseUnit: number;
  baseUnit: string;
  minOrderQuantity: number;
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"); } catch { return []; }
}

function saveCart(items: CartItem[]) {
  const cleaned = items.map((item) => ({
    ...item,
    quantity: parseFloat(item.quantity as string) || 0,
  }));
  localStorage.setItem(CART_KEY, JSON.stringify(cleaned));
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCart(loadCart());

    const handleSync = () => {
      setCart(loadCart());
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);
    window.addEventListener("cart-updated", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("cart-updated", handleSync);
    };
  }, []);

  const updateQty = (idx: number, qty: string) => {
    const updated = cart.map((c, i) => i === idx ? { ...c, quantity: qty } : c);
    setCart(updated);
    saveCart(updated);
  };

  const removeItem = (idx: number) => {
    const updated = cart.filter((_, i) => i !== idx);
    setCart(updated);
    saveCart(updated);
  };

  const grandTotal = cart.reduce((sum, item) => {
    const qty = parseFloat(item.quantity as string) || 0;
    return sum + calculateLineTotal(qty, item.unit, item.pricePerBaseUnit);
  }, 0);

  const hasBelowMin = cart.some((item) => {
    const qty = parseFloat(item.quantity as string) || 0;
    const baseQty = qty * UNIT_CONFIG[item.unit].factor;
    return qty <= 0 || baseQty < (item.minOrderQuantity ?? 0);
  });

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/seller/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item.productId,
          orderedUnit: item.unit,
          orderedQuantity: parseFloat(item.quantity as string) || 0,
        })),
        notes,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to place order.");
      return;
    }

    const data = await res.json();
    localStorage.removeItem(CART_KEY);
    setCart([]);
    setSuccess(data.orderNumber);
  };

  if (success) {
    return (
      <div className="page-content fade-in" style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
        <div className="card" style={{ maxWidth: "480px", width: "100%", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ marginBottom: "1rem" }}>
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "4rem" }}></i>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>Order Placed!</h1>
          <p style={{ color: "var(--muted-foreground)", marginBottom: "1rem" }}>
            Your quotation has been submitted successfully.
          </p>
          <div style={{ background: "var(--muted)", borderRadius: "0.5rem", padding: "0.875rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Order Number</div>
            <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--primary)" }}>{success}</div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/seller/orders" className="btn btn-primary" style={{ flex: 1 }}>View Orders</Link>
            <Link href="/seller/products" className="btn btn-secondary" style={{ flex: 1 }}>Browse More</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cart & Order</h1>
          <p className="page-subtitle">{cart.length} item(s) · {formatINR(grandTotal)}</p>
        </div>
        <Link href="/seller/products" className="btn btn-secondary">← Continue Shopping</Link>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state card">
          <i className="bi bi-cart3" style={{ fontSize: "3rem", opacity: 0.5, marginBottom: "0.5rem" }}></i>
          <p>Your cart is empty</p>
          <Link href="/seller/products" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem", alignItems: "start" }}>
          {/* Cart items */}
          <div>
            {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {cart.map((item, idx) => {
                const qtyVal = parseFloat(item.quantity as string) || 0;
                const lineTotal = calculateLineTotal(qtyVal, item.unit, item.pricePerBaseUnit);
                const displayPrice = pricePerDisplayUnit(item.pricePerBaseUnit, item.unit);
                const baseQty = qtyVal * UNIT_CONFIG[item.unit].factor;
                const minOrderQty = item.minOrderQuantity ?? 0;
                const isBelowMin = qtyVal <= 0 || baseQty < minOrderQty;
                const minOrderQtyInSelected = minOrderQty / UNIT_CONFIG[item.unit].factor;

                return (
                  <div
                    key={`${item.productId}-${item.unit}`}
                    className="card"
                    style={{
                      padding: "1.25rem",
                      borderColor: isBelowMin ? "var(--danger)" : "var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{item.productName}</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                          {formatINR(displayPrice)} / {item.unit}
                        </div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>
                        <i className="bi bi-trash me-1"></i> Remove
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", fontSize: "0.875rem" }}>
                      <div>
                        <div style={{ color: "var(--muted-foreground)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Quantity</div>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          className="form-input"
                          value={item.quantity}
                          onChange={(e) => updateQty(idx, e.target.value)}
                          id={`cart-qty-${idx}`}
                          style={{ padding: "0.375rem 0.625rem" }}
                        />
                        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                          in {item.unit}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--muted-foreground)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Base equivalent</div>
                        <div style={{ fontWeight: 600, paddingTop: "0.375rem" }}>
                          {baseQty.toLocaleString("en-IN", { maximumFractionDigits: 6 })} {item.baseUnit}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                          × {UNIT_CONFIG[item.unit].factor.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--muted-foreground)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Line Total</div>
                        <div className="price-sm" style={{ paddingTop: "0.375rem", fontSize: "1.125rem" }}>
                          {formatINR(lineTotal)}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                          {baseQty.toFixed(4)} {item.baseUnit} × {formatINR(item.pricePerBaseUnit)}/{item.baseUnit}
                        </div>
                      </div>
                    </div>

                    {isBelowMin && (
                      <div
                        className="alert alert-error"
                        style={{
                          fontSize: "0.8125rem",
                          padding: "0.5rem 0.75rem",
                          marginTop: "0.75rem",
                          borderRadius: "0.375rem",
                        }}
                      >
                        <i className="bi bi-exclamation-triangle-fill me-1"></i> Minimum order is {minOrderQtyInSelected.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.unit} ({minOrderQty} {item.baseUnit}). Requested: {item.quantity || "0"} {item.unit}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order summary */}
          <div style={{ position: "sticky", top: "5rem" }}>
            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontWeight: 700, marginBottom: "1.25rem", fontSize: "1rem" }}>Order Summary</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {cart.map((item, idx) => {
                  const qtyVal = parseFloat(item.quantity as string) || 0;
                 const lineTotal = calculateLineTotal(qtyVal, item.unit, item.pricePerBaseUnit);
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--muted-foreground)", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.productName} ({item.quantity || "0"} {item.unit})
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatINR(lineTotal)}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: "2px solid var(--border)", paddingTop: "0.875rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700 }}>Grand Total</span>
                  <span className="price-display">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="order-notes" className="form-label">Notes (optional)</label>
                <textarea
                  id="order-notes"
                  className="form-input"
                  rows={3}
                  placeholder="Special instructions, delivery requirements…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button
                className="btn btn-success btn-lg"
                style={{ width: "100%" }}
                onClick={handlePlaceOrder}
                disabled={loading || cart.length === 0 || hasBelowMin}
                id="place-order-btn"
              >
                {loading ? (
                  <><span className="spinner" style={{ marginRight: "0.5rem" }} /> Placing Order…</>
                ) : hasBelowMin ? (
                  <><i className="bi bi-exclamation-triangle-fill me-1"></i> Fix MOQ Requirements</>
                ) : (
                  <><i className="bi bi-check-lg me-1"></i> Place Order / Quotation</>
                )}
              </button>

              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", textAlign: "center", marginTop: "0.75rem" }}>
                Order will be reviewed by admin
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
