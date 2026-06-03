"use client";
// app/register/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed.");
      return;
    }

    router.push("/login?registered=1");
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚗️</div>
          <h1>Create Account</h1>
          <p>Join AasaMedChem as a Seller</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div>
            <label htmlFor="name" className="form-label">Full name</label>
            <input id="name" type="text" className="form-input" placeholder="Dr. Priya Sharma"
              value={form.name} onChange={update("name")} required />
          </div>

          <div>
            <label htmlFor="reg-email" className="form-label">Email address</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@company.com"
              value={form.email} onChange={update("email")} required />
          </div>

          <div>
            <label htmlFor="reg-password" className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Min. 8 characters"
              value={form.password} onChange={update("password")} required />
          </div>

          <div>
            <label htmlFor="confirm-password" className="form-label">Confirm password</label>
            <input id="confirm-password" type="password" className="form-input" placeholder="Repeat password"
              value={form.confirmPassword} onChange={update("confirmPassword")} required />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
            style={{ marginTop: "0.5rem", width: "100%" }}>
            {loading ? <><span className="spinner" /> Creating account…</> : "Create account"}
          </button>
        </form>

        <div className="divider">
          <span className="divider-text">or</span>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
