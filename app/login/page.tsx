"use client";
// app/login/page.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "./actions";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "1") {
        setRegistered(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginAction({ email, password });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Success
      router.push("/");
      router.refresh();
    } catch (err: any) {
      if (isRedirectError(err)) {
        throw err;
      }
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚗️</div>
          <h1>AasaMedChem</h1>
          <p>Inventory & Order Management</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {registered && (
            <div className="alert alert-success">
              Registration successful! Please sign in.
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}

          <div>
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            {loading ? <><span className="spinner" /> Signing in…</> : "Sign in"}
          </button>
        </form>

        <div className="divider">
          <span className="divider-text">or</span>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          New seller?{" "}
          <Link href="/register" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            Create an account
          </Link>
        </p>

        <div
          className="alert alert-info"
          style={{ marginTop: "1.5rem", fontSize: "0.8125rem" }}
        >
          <strong>Demo credentials:</strong><br />
          Admin: admin@asamedchem.com / Admin@123<br />
          Seller: seller@asamedchem.com / Seller@123
        </div>
      </div>
    </div>
  );
}
