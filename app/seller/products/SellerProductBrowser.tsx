"use client";
// app/seller/products/SellerProductBrowser.tsx
// The core seller experience: browse, filter, see prices in any unit, add to cart
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  formatINR,
  DIMENSION_UNITS,
  UNIT_CONFIG,
  pricePerDisplayUnit,
  calculateLineTotal,
  type Unit,
} from "@/lib/conversions";

interface ProductData {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  dimension: "weight" | "volume" | "count";
  baseUnit: string;
  stockQuantity: string;
  pricePerBaseUnit: string;
  minOrderQuantity: string;
  category: { id: string; name: string } | null;
}

interface Props {
  products: ProductData[];
  categories: { id: string; name: string }[];
}

interface CartItem {
  productId: string;
  productName: string;
  unit: Unit;
  quantity: number;
  pricePerBaseUnit: number;
  baseUnit: string;
  minOrderQuantity: number;
}

const CART_KEY = "asamedchem_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export default function SellerProductBrowser({ products, categories }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterDim, setFilterDim] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Record<string, Unit>>({});
  const [quantity, setQuantity] = useState<Record<string, string>>({});
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

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

  const getUnit = (p: ProductData): Unit => {
    return selectedUnit[p.id] ?? (DIMENSION_UNITS[p.dimension][0] as Unit);
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? p.category?.id === filterCat : true;
    const matchDim = filterDim ? p.dimension === filterDim : true;
    return matchSearch && matchCat && matchDim;
  });

  const handleAddToCart = (p: ProductData) => {
    const unit = getUnit(p);
    const qty = parseFloat(quantity[p.id] || "1");
    if (isNaN(qty) || qty <= 0) return;

    const existing = cart.findIndex((c) => c.productId === p.id && c.unit === unit);
    let newCart: CartItem[];

    if (existing >= 0) {
      newCart = cart.map((c, i) =>
        i === existing ? { ...c, quantity: c.quantity + qty } : c
      );
    } else {
      newCart = [
        ...cart,
        {
          productId: p.id,
          productName: p.name,
          unit,
          quantity: qty,
          pricePerBaseUnit: parseFloat(p.pricePerBaseUnit),
          baseUnit: p.baseUnit,
          minOrderQuantity: parseFloat(p.minOrderQuantity ?? "0"),
        },
      ];
    }

    setCart(newCart);
    saveCart(newCart);
    setAddedFeedback(p.id);
    setTimeout(() => setAddedFeedback(null), 2000);
  };

  return (
    <>
      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: "240px" }}>
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="form-input"
            placeholder="Search products by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="seller-product-search"
          />
        </div>
        <select className="form-select" style={{ width: "200px" }} value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)} id="seller-filter-cat">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="form-select" style={{ width: "160px" }} value={filterDim}
          onChange={(e) => setFilterDim(e.target.value)} id="seller-filter-dim">
          <option value="">All dimensions</option>
          <option value="weight">Weight</option>
          <option value="volume">Volume</option>
          <option value="count">Count</option>
        </select>

        <button
          className="btn btn-primary"
          onClick={() => router.push("/seller/cart")}
          style={{ position: "relative" }}
        >
          <i className="bi bi-cart3 me-1"></i> Cart
          {cart.length > 0 && (
            <span style={{
              position: "absolute", top: "-6px", right: "-6px",
              background: "var(--danger)", color: "white",
              borderRadius: "50%", width: "18px", height: "18px",
              fontSize: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700,
            }}>
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-search" style={{ fontSize: "3rem", opacity: 0.5, marginBottom: "0.5rem" }}></i>
          <p>No products found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {filtered.map((p) => {
            const unit = getUnit(p);
            const availableUnits = DIMENSION_UNITS[p.dimension] as Unit[];
            const priceBase = parseFloat(p.pricePerBaseUnit);
            const displayPrice = pricePerDisplayUnit(priceBase, unit);
            const qty = parseFloat(quantity[p.id] || "1") || 1;
            const lineTotal = calculateLineTotal(qty, unit, priceBase);
            const stockBase = parseFloat(p.stockQuantity ?? "0");
            const inCart = cart.some((c) => c.productId === p.id);

            return (
              <div key={p.id} className={`product-card ${inCart ? "selected" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>{p.name}</div>
                    {p.sku && <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{p.sku}</div>}
                  </div>
                  <span className={`badge badge-${p.dimension}`} style={{ alignSelf: "flex-start" }}>
                    {p.dimension}
                  </span>
                </div>

                {p.category && (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>
                    <i className="bi bi-tag me-1"></i> {p.category.name}
                  </div>
                )}

                {p.description && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                    {p.description}
                  </div>
                )}

                {/* Stock */}
                <div style={{
                  fontSize: "0.8125rem", color: stockBase > 0 ? "var(--success)" : "var(--danger)",
                  marginBottom: "0.875rem", fontWeight: 500
                }}>
                  {stockBase > 0
                    ? <><i className="bi bi-check-circle-fill me-1"></i> In stock: {stockBase.toLocaleString("en-IN", { maximumFractionDigits: 3 })} {p.baseUnit}</>
                    : <><i className="bi bi-x-circle-fill me-1"></i> Out of stock</>
                  }
                </div>

                {/* Unit selector */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label" style={{ fontSize: "0.75rem" }}>Order unit</label>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    {availableUnits.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setSelectedUnit((s) => ({ ...s, [p.id]: u }))}
                        className={`btn btn-sm ${unit === u ? "btn-primary" : "btn-secondary"}`}
                        style={{ flex: 1 }}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price per selected unit */}
                <div style={{ background: "var(--muted)", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "0.875rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>
                    Price per {unit}
                  </div>
                  <div className="price-sm" style={{ fontSize: "1.25rem" }}>
                    {formatINR(displayPrice)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.125rem" }}>
                    = {formatINR(priceBase)} / {p.baseUnit}
                  </div>
                </div>

                {/* Quantity + total */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>
                      Quantity ({unit})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min={parseFloat(p.minOrderQuantity ?? "0") / UNIT_CONFIG[unit].factor || 0.001}
                      className="form-input"
                      value={quantity[p.id] ?? "1"}
                      onChange={(e) => setQuantity((q) => ({ ...q, [p.id]: e.target.value }))}
                      id={`qty-${p.id}`}
                    />
                  </div>
                  <div style={{ fontSize: "0.8125rem", paddingBottom: "0.75rem", whiteSpace: "nowrap" }}>
                    = <span style={{ fontWeight: 700, color: "var(--primary)" }}>{formatINR(lineTotal)}</span>
                  </div>
                </div>

                <button
                  className={`btn ${addedFeedback === p.id ? "btn-success" : "btn-primary"}`}
                  onClick={() => handleAddToCart(p)}
                  disabled={stockBase <= 0}
                  style={{ width: "100%", marginTop: "auto" }}
                  id={`add-to-cart-${p.id}`}
                >
                  {addedFeedback === p.id ? (
                    <><i className="bi bi-check2-circle me-1"></i> Added!</>
                  ) : (
                    <><i className="bi bi-cart-plus me-1"></i> Add to Cart</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
