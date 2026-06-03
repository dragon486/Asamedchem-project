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
  const [emailSpaceError, setEmailSpaceError] = useState(false);
  const [passwordSpaceError, setPasswordSpaceError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.email.includes(" ") || form.password.includes(" ")) {
      setError("Please remove all spaces from your email and password.");
      return;
    }

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

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    if (field === "email") {
      setEmailSpaceError(val.includes(" "));
    } else if (field === "password") {
      setPasswordSpaceError(val.includes(" "));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <img src="/logo.png" alt="SynTrace Logo" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
          <h1 style={{ fontSize: "1.25rem", marginTop: "0.5rem" }}>Create Account</h1>
          <p>Join SynTrace as a Seller</p>
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
            {emailSpaceError && (
              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", fontWeight: 500 }}>
                ⚠️ Entered space. Please remove space.
              </div>
            )}
          </div>

          <div>
            <label htmlFor="reg-password" className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="Min. 8 characters"
              value={form.password} onChange={update("password")} required />
            {passwordSpaceError && (
              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", fontWeight: 500 }}>
                ⚠️ Entered space. Please remove space.
              </div>
            )}
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
