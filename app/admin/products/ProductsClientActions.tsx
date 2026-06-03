"use client";
// app/admin/products/ProductsClientActions.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, DIMENSION_UNITS, pricePerDisplayUnit } from "@/lib/conversions";
import type { Product, Category } from "@/lib/schema";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  products: (Product & { category: { name: string } | null })[];
  categories: Category[];
}

export default function ProductsClientActions({ products, categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [filterCat, setFilterCat] = useState("");
  const [filterDim, setFilterDim] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? p.categoryId === filterCat : true;
    const matchDim = filterDim ? p.dimension === filterDim : true;
    return matchSearch && matchCat && matchDim;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeleting(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    router.refresh();
  };

  return (
    <>
      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: "1", minWidth: "200px" }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="product-search"
          />
        </div>
        <select className="form-select" style={{ width: "180px" }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)} id="filter-category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="form-select" style={{ width: "160px" }} value={filterDim} onChange={(e) => setFilterDim(e.target.value)} id="filter-dimension">
          <option value="">All dimensions</option>
          <option value="weight">Weight</option>
          <option value="volume">Volume</option>
          <option value="count">Count</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Dimension</th>
              <th>Price / base unit</th>
              <th>Price / kg or L</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "3rem" }}>
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                // Price per common larger unit for display
                const largerUnit = p.dimension === "weight" ? "kg" : p.dimension === "volume" ? "L" : null;
                const pricePerLarger = largerUnit
                  ? pricePerDisplayUnit(parseFloat(p.pricePerBaseUnit), largerUnit as any)
                  : null;

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.sku && <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{p.sku}</div>}
                    </td>
                    <td style={{ color: "var(--muted-foreground)" }}>{p.category?.name ?? "—"}</td>
                    <td><span className={`badge badge-${p.dimension}`}>{p.dimension}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--primary)" }}>
                        {formatINR(parseFloat(p.pricePerBaseUnit))} / {p.baseUnit}
                      </div>
                    </td>
                    <td style={{ color: "var(--muted-foreground)" }}>
                      {pricePerLarger !== null && largerUnit
                        ? `${formatINR(pricePerLarger)} / ${largerUnit}`
                        : "—"}
                    </td>
                    <td>
                      {parseFloat(p.stockQuantity ?? "0").toLocaleString("en-IN")} {p.baseUnit}
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? "badge-confirmed" : "badge-cancelled"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        <Link href={`/admin/products/${p.id}/edit`} className="btn btn-secondary btn-sm">
                          <i className="bi bi-pencil me-1"></i> Edit
                        </Link>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleActive(p.id, p.isActive ?? true)}
                          title={p.isActive ? "Deactivate" : "Activate"}
                        >
                          {p.isActive ? <i className="bi bi-pause-fill"></i> : <i className="bi bi-play-fill"></i>}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                        >
                          {deleting === p.id ? (
                            <span className="spinner" style={{ width: "0.8rem", height: "0.8rem", borderWidth: "1.5px" }}></span>
                          ) : (
                            <i className="bi bi-trash"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
