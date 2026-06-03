"use client";
// app/admin/products/ProductForm.tsx
// Shared form for creating and editing products
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DIMENSION_UNITS, UNIT_CONFIG } from "@/lib/conversions";
import type { Product, Category } from "@/lib/schema";

interface Props {
  categories: Category[];
  product?: Product; // if provided, we're editing
}

const DIMENSION_LABELS = { weight: "Weight", volume: "Volume", count: "Count" };

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name:             product?.name ?? "",
    sku:              product?.sku ?? "",
    description:      product?.description ?? "",
    categoryId:       product?.categoryId ?? "",
    dimension:        (product?.dimension ?? "weight") as "weight" | "volume" | "count",
    stockQuantity:    product ? parseFloat(product.stockQuantity ?? "0").toString() : "",
    pricePerBaseUnit: product ? parseFloat(product.pricePerBaseUnit).toString() : "",
    minOrderQuantity: product ? parseFloat(product.minOrderQuantity ?? "0").toString() : "0",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const baseUnit = form.dimension === "weight" ? "g" : form.dimension === "volume" ? "mL" : "ea";
  const availableUnits = DIMENSION_UNITS[form.dimension];

  const update = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleDimensionChange = (dim: "weight" | "volume" | "count") => {
    setForm((f) => ({ ...f, dimension: dim }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body = {
      name: form.name,
      sku: form.sku || null,
      description: form.description || null,
      categoryId: form.categoryId || null,
      dimension: form.dimension,
      baseUnit,
      stockQuantity: form.stockQuantity,
      pricePerBaseUnit: form.pricePerBaseUnit,
      minOrderQuantity: form.minOrderQuantity || "0",
    };

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save product.");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  // Live price preview: what price would look like in each unit
  const priceNum = parseFloat(form.pricePerBaseUnit) || 0;
  const pricePreview = availableUnits.map((u) => ({
    unit: u,
    price: priceNum * UNIT_CONFIG[u].factor,
  }));

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "720px" }}>
      {error && <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
          Basic Information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="product-name" className="form-label">Product Name *</label>
            <input id="product-name" type="text" className="form-input" value={form.name} onChange={update("name")} required placeholder="Paracetamol USP" />
          </div>
          <div>
            <label htmlFor="product-sku" className="form-label">SKU</label>
            <input id="product-sku" type="text" className="form-input" value={form.sku} onChange={update("sku")} placeholder="PARA-USP-001" />
          </div>
          <div>
            <label htmlFor="product-category" className="form-label">Category</label>
            <select id="product-category" className="form-select" value={form.categoryId} onChange={update("categoryId")}>
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="product-desc" className="form-label">Description</label>
            <textarea
              id="product-desc"
              className="form-input"
              rows={3}
              value={form.description}
              onChange={update("description")}
              placeholder="High purity pharmaceutical grade…"
              style={{ resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
          Quantity & Unit Configuration
        </h2>

        <div style={{ marginBottom: "1.25rem" }}>
          <label className="form-label">Dimension *</label>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {(["weight", "volume", "count"] as const).map((dim) => (
              <button
                key={dim}
                type="button"
                onClick={() => handleDimensionChange(dim)}
                className={`btn ${form.dimension === dim ? "btn-primary" : "btn-secondary"}`}
                style={{ minWidth: "100px" }}
              >
                {dim === "weight" ? (
                  <i className="bi bi-speedometer me-1"></i>
                ) : dim === "volume" ? (
                  <i className="bi bi-droplet me-1"></i>
                ) : (
                  <i className="bi bi-hash me-1"></i>
                )}{" "}
                {DIMENSION_LABELS[dim]}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
            Base unit: <strong>{baseUnit}</strong> (all quantities stored internally in this unit)
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label htmlFor="stock-quantity" className="form-label">Stock Quantity (in {baseUnit}) *</label>
            <input
              id="stock-quantity"
              type="number"
              step="0.000001"
              min="0"
              className="form-input"
              value={form.stockQuantity}
              onChange={update("stockQuantity")}
              required
              placeholder="50000"
            />
            {form.dimension === "weight" && form.stockQuantity && (
              <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                = {(parseFloat(form.stockQuantity) / 1000).toLocaleString()} kg
              </p>
            )}
            {form.dimension === "volume" && form.stockQuantity && (
              <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                = {(parseFloat(form.stockQuantity) / 1000).toLocaleString()} L
              </p>
            )}
          </div>
          <div>
            <label htmlFor="min-order" className="form-label">Min. Order Quantity (in {baseUnit})</label>
            <input
              id="min-order"
              type="number"
              step="0.000001"
              min="0"
              className="form-input"
              value={form.minOrderQuantity}
              onChange={update("minOrderQuantity")}
              placeholder="100"
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
          Pricing (INR)
        </h2>
        <div>
          <label htmlFor="price-per-base" className="form-label">
            Price per {baseUnit} (INR) *
          </label>
          <input
            id="price-per-base"
            type="number"
            step="0.000001"
            min="0"
            className="form-input"
            value={form.pricePerBaseUnit}
            onChange={update("pricePerBaseUnit")}
            required
            placeholder="2.500000"
            style={{ marginBottom: "0.75rem" }}
          />

          {priceNum > 0 && (
            <div className="alert alert-info" style={{ fontSize: "0.8125rem" }}>
              <strong>Price in other units:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.375rem" }}>
                {pricePreview.map(({ unit, price }) => (
                  <span key={unit}>
                    <strong>₹{price.toLocaleString("en-IN", { maximumFractionDigits: 4 })}</strong> / {unit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><span className="spinner" /> Saving…</> : isEdit ? "Update Product" : "Create Product"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
