"use client";
// app/admin/categories/CategoriesClient.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | null;
  productCount: number;
}

interface Props {
  categories: CategoryRow[];
}

export default function CategoriesClient({ categories }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", description: "" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditItem(cat);
    setForm({ name: cat.name, description: cat.description ?? "" });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    setError("");

    const url = editItem ? `/api/admin/categories/${editItem.id}` : "/api/admin/categories";
    const method = editItem ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, description: form.description }),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed.");
      return;
    }

    setShowForm(false);
    router.refresh();
  };

  const handleDelete = async (id: string, name: string, productCount: number) => {
    if (productCount > 0) {
      alert(`Cannot delete "${name}" — it has ${productCount} product(s). Reassign them first.`);
      return;
    }
    if (!confirm(`Delete category "${name}"?`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <div style={{ marginBottom: "1.25rem" }}>
        <button className="btn btn-primary" onClick={openCreate} id="add-category-btn">
          + Add Category
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <span>{editItem ? "Edit Category" : "New Category"}</span>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label htmlFor="cat-name" className="form-label">Category Name *</label>
                  <input id="cat-name" type="text" className="form-input" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="APIs & Active Ingredients" />
                </div>
                <div>
                  <label htmlFor="cat-desc" className="form-label">Description</label>
                  <textarea id="cat-desc" className="form-input" rows={3} value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description…" style={{ resize: "vertical" }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? <><span className="spinner" /> Saving…</> : editItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Description</th>
              <th>Products</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "3rem" }}>
                  No categories yet. Add one!
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ color: "var(--muted-foreground)" }}>{cat.description ?? "—"}</td>
                  <td>
                    <span className="badge badge-volume">{cat.productCount} products</span>
                  </td>
                  <td style={{ color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                    {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(cat.id, cat.name, cat.productCount)}>
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
