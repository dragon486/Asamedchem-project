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
  const [showPassword, setShowPassword] = useState(false);
  const [emailSpaceError, setEmailSpaceError] = useState(false);
  const [passwordSpaceError, setPasswordSpaceError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "1") setRegistered(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (email.includes(" ") || password.includes(" ")) {
      setError("Please remove all spaces from your email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await loginAction({ email, password });
      if (result?.error) { setError(result.error); setLoading(false); return; }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      if (isRedirectError(err)) throw err;
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --green-deep:   #1a3d2b;
          --green-dark:   #1f5c3a;
          --green-mid:    #2d7a50;
          --green-bright: #3db870;
          --green-light:  #a8e6c1;
          --green-pale:   #e8f5ee;
          --cream:        #f9fdf9;
          --text-dark:    #0f2419;
          --text-muted:   #6b8c79;
          --border:       #d4e8db;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          background: #e9ede9;
          font-family: 'DM Sans', -apple-system, sans-serif;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          flex: 0 0 42%;
          position: relative;
          background: var(--green-deep);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 44px 48px 52px;
        }
        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 140% 80% at 110% 20%, rgba(61,184,112,.45) 0%, transparent 60%),
            radial-gradient(ellipse 80% 120% at -20% 80%, rgba(31,92,58,.9) 0%, transparent 65%),
            radial-gradient(ellipse 100% 60% at 50% 110%, rgba(45,122,80,.7) 0%, transparent 55%);
          animation: blobShift 8s ease-in-out infinite alternate;
        }
        @keyframes blobShift {
          from { transform: scale(1) rotate(0deg); }
          to   { transform: scale(1.08) rotate(3deg); }
        }
        .login-left::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }
        .ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(61,184,112,.2);
          z-index: 1;
        }
        .ring-1 { width: 280px; height: 280px; top: 28%; left: 15%; }
        .ring-2 { width: 420px; height: 420px; top: 12%; left: -14%; opacity: .45; }
        .ring-3 { width: 130px; height: 130px; top: 56%; left: 56%; opacity: .35; }

        .left-top {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .left-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .18em;
          color: var(--green-light);
          text-transform: uppercase;
        }
        .left-line {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, var(--green-bright), transparent);
        }
        .left-bottom {
          position: relative;
          z-index: 2;
        }
        .left-headline {
          font-size: 52px;
          font-weight: 700;
          line-height: 1.06;
          color: #fff;
          margin-bottom: 18px;
          letter-spacing: -.02em;
        }
        .left-sub {
          font-size: 14px;
          line-height: 1.7;
          color: rgba(168,230,193,.8);
          max-width: 290px;
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 48px 60px;
          background: #fff;
          overflow-y: auto;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: auto;
        }
        .login-logo-icon {
          font-size: 28px;
          line-height: 1;
        }
        .login-logo-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-dark);
          letter-spacing: -.02em;
        }

        .login-form-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 32px 0 16px;
          max-width: 380px;
          width: 100%;
          margin: 0 auto;
        }

        .login-title {
          font-size: 34px;
          font-weight: 700;
          color: var(--text-dark);
          letter-spacing: -.02em;
          margin-bottom: 8px;
        }
        .login-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 32px;
        }

        .login-alert-success {
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #166534;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13.5px;
          margin-bottom: 16px;
        }
        .login-alert-error {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13.5px;
          margin-bottom: 16px;
        }
        .login-alert-info {
          background: var(--green-pale);
          border: 1px solid var(--border);
          color: var(--text-muted);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 12.5px;
          margin-top: 20px;
          line-height: 1.7;
        }
        .login-alert-info strong { color: var(--text-dark); }

        .login-field { margin-bottom: 18px; }
        .login-label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-dark);
          letter-spacing: .02em;
          margin-bottom: 7px;
        }
        .login-input-wrap { position: relative; }
        .login-input {
          width: 100%;
          height: 46px;
          padding: 0 44px 0 16px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          background: var(--green-pale);
          font-size: 14px;
          color: var(--text-dark);
          outline: none;
          transition: border-color .18s, box-shadow .18s, background .18s;
          font-family: inherit;
        }
        .login-input:focus {
          border-color: var(--green-mid);
          box-shadow: 0 0 0 3px rgba(45,122,80,.12);
          background: #fff;
        }
        .login-input::placeholder { color: var(--text-muted); }
        .login-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 0;
        }

        .login-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .login-remember {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          color: var(--text-muted);
          cursor: pointer;
        }
        .login-remember input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: var(--green-mid);
          cursor: pointer;
        }
        .login-forgot {
          font-size: 13px;
          color: var(--green-mid);
          font-weight: 500;
          text-decoration: none;
        }
        .login-forgot:hover { text-decoration: underline; }

        .login-btn-primary {
          width: 100%;
          height: 48px;
          background: var(--green-deep);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background .18s, transform .12s;
          font-family: inherit;
          margin-bottom: 0;
        }
        .login-btn-primary:hover:not(:disabled) {
          background: var(--green-dark);
          transform: translateY(-1px);
        }
        .login-btn-primary:disabled { opacity: .7; cursor: not-allowed; }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .login-divider span {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .login-footer {
          text-align: center;
          font-size: 13.5px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .login-footer a {
          color: var(--green-deep);
          font-weight: 700;
          text-decoration: none;
        }
        .login-footer a:hover { text-decoration: underline; }

        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .6s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { padding: 36px 28px; }
        }
      `}</style>

      <div className="login-page">
        {/* LEFT */}
        <div className="login-left">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />

          <div className="left-top">
            <span className="left-tag">A Wise Quote</span>
            <span className="left-line" />
          </div>

          <div className="left-bottom">
            <h2 className="left-headline">Plan.<br />Execute.<br />Achieve.</h2>
            <p className="left-sub">
              You can get everything you want if you work hard,
              trust the process, and stick to the plan.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="login-right">
          <div className="login-logo" style={{ marginBottom: "2rem" }}>
            <img src="/logo.png" alt="SynTrace Logo" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
          </div>

          <div className="login-form-area">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">
              Enter your email and password to access your account
            </p>

            {registered && (
              <div className="login-alert-success">
                Registration successful! Please sign in.
              </div>
            )}
            {error && <div className="login-alert-error">{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
              <div className="login-field">
                <label htmlFor="email" className="login-label">Email address</label>
                <div className="login-input-wrap">
                  <input
                    id="email"
                    type="email"
                    className="login-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      setEmailSpaceError(val.includes(" "));
                    }}
                    required
                    autoComplete="email"
                  />
                  {emailSpaceError && (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", fontWeight: 500 }}>
                      ⚠️ Entered space. Please remove space.
                    </div>
                  )}
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="password" className="login-label">Password</label>
                <div className="login-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="login-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPassword(val);
                      setPasswordSpaceError(val.includes(" "));
                    }}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Toggle password"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8">
                      {showPassword
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                      }
                    </svg>
                  </button>
                  {passwordSpaceError && (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "5px", fontWeight: 500 }}>
                      ⚠️ Entered space. Please remove space.
                    </div>
                  )}
                </div>
              </div>

              <div className="login-row">
                <label className="login-remember">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#" className="login-forgot">Forgot Password</a>
              </div>

              <button
                type="submit"
                className="login-btn-primary"
                disabled={loading}
              >
                {loading
                  ? <><span className="login-spinner" /> Signing in…</>
                  : "Sign In"}
              </button>
            </form>

            <div className="login-divider"><span>or</span></div>

            <p className="login-footer">
              New seller?{" "}
              <Link href="/register">Create an account</Link>
            </p>

            <div className="login-alert-info">
              <strong>Demo credentials:</strong><br />
              Admin: admin@asamedchem.com / Admin@123<br />
              Seller: seller@asamedchem.com / Seller@123
            </div>
          </div>
        </div>
      </div>
    </>
  );
}