"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Github, Linkedin, Loader2 } from "lucide-react";
import { createClient } from "~/lib/supabase/client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.04 12.27c0-.82-.07-1.42-.22-2.04H12.24v3.7h6.18c-.12 1-.8 2.52-2.3 3.54l-.02.14 3.34 2.58.23.02c2.13-1.96 3.37-4.86 3.37-7.94Z" fill="#4285F4" />
      <path d="M12.24 23.4c3.04 0 5.6-1 7.46-2.72l-3.55-2.74c-.95.66-2.23 1.12-3.91 1.12-2.98 0-5.51-1.96-6.41-4.68l-.13.01-3.47 2.68-.05.13c1.85 3.67 5.65 6.2 10.06 6.2Z" fill="#34A853" />
      <path d="M5.83 14.38a6.6 6.6 0 0 1-.36-2.13c0-.74.13-1.46.35-2.13l-.01-.14-3.51-2.72-.12.06A11.43 11.43 0 0 0 .8 12.25c0 1.84.45 3.58 1.38 5.13l3.65-2.99Z" fill="#FBBC05" />
      <path d="M12.24 4.7c2.12 0 3.55.91 4.37 1.67l3.19-3.1C17.83 1.4 15.28.3 12.24.3 7.83.3 4.03 2.83 2.18 6.5l3.64 2.82c.91-2.72 3.44-4.62 6.42-4.62Z" fill="#EA4335" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session not established");

      window.location.href = "/auth/redirect";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github" | "linkedin_oidc") => {
    setError("");
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/redirect`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth sign-in failed");
      setOauthLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen font-sans" style={{ background: "#0A0F1E" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

        .font-display { font-family: 'Sora', sans-serif; }
        .font-body    { font-family: 'Inter', sans-serif; }

        :root {
          --navy-base:    #0A0F1E;
          --navy-surface: #141C36;
          --navy-card:    #1E2B55;
          --navy-border:  rgba(136,153,187,0.12);
          --navy-border-strong: rgba(136,153,187,0.20);
          --gold:         #22C55E;
          --gold-dim:     #16A34A;
          --gold-glow:    rgba(34,197,94,0.18);
          --gold-subtle:  rgba(34,197,94,0.08);
          --blue-acc:     #38BDF8;
          --blue-dim:     rgba(56,189,248,0.15);
          --text-primary: #F5F5F0;
          --text-secondary: rgba(136,153,187,0.70);
          --text-muted:   rgba(136,153,187,0.40);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineDraw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .anim-fade-up   { animation: fadeUp 0.7s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade-up-2 { animation: fadeUp 0.7s cubic-bezier(.16,1,.3,1) 0.1s both; }
        .anim-fade-up-3 { animation: fadeUp 0.7s cubic-bezier(.16,1,.3,1) 0.2s both; }

        .shimmer-gold { color: var(--gold); }

        .dot-grid {
          background-image: radial-gradient(circle at 1.5px 1.5px, #F5F5F0 1.5px, transparent 0);
          background-size: 36px 36px;
        }

        .section-rule {
          width: 40px; height: 2px;
          background: var(--gold);
          border-radius: 2px;
          transform-origin: left;
          animation: lineDraw 0.6s ease 0.2s both;
        }

        .tag {
          display: inline-block;
          background: rgba(34,197,94,0.10);
          border: 1px solid rgba(34,197,94,0.22);
          color: var(--gold);
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 99px;
        }

        .field-input {
          width: 100%;
          background: var(--navy-surface);
          border: 1.5px solid var(--navy-border);
          border-radius: 12px;
          padding: 13px 16px;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          font-size: 14.5px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }
        .field-input::placeholder { color: var(--text-muted); }
        .field-input:focus {
          border-color: rgba(34,197,94,0.55);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.14);
        }

        .gold-btn {
          background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
          color: #0A0F1E;
          transition: box-shadow 0.3s ease, transform 0.2s ease, opacity 0.2s ease;
        }
        .gold-btn:hover:not(:disabled) {
          box-shadow: 0 0 0 6px rgba(34,197,94,0.15), 0 8px 30px rgba(34,197,94,0.35);
          transform: translateY(-1px);
        }
        .gold-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .oauth-btn {
          background: var(--navy-surface);
          border: 1.5px solid var(--navy-border);
          color: var(--text-primary);
          transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
        }
        .oauth-btn:hover:not(:disabled) {
          border-color: rgba(34,197,94,0.35);
          background: rgba(34,197,94,0.06);
          transform: translateY(-1px);
        }
        .oauth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--navy-border);
        }

        .spin-icon { animation: spin 0.8s linear infinite; }

        .pillar-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--navy-border);
        }
        .pillar-item:last-child { border-bottom: none; }
      `}</style>

      {/* ── LEFT: BRAND PANEL ───────────────────────────────────────────── */}
      <div
        className="relative hidden lg:flex lg:w-[44%] flex-col justify-between overflow-hidden px-12 py-14"
        style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0E1426 50%, #141C36 100%)" }}
      >
        <div className="absolute inset-0 dot-grid" style={{ opacity: 0.05 }} />
        <div
          className="absolute top-0 right-0 w-[420px] h-[320px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top right, rgba(56,189,248,0.07) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[360px] h-[280px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at bottom left, rgba(34,197,94,0.08) 0%, transparent 65%)" }}
        />

        <div className="relative anim-fade-up">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="font-display text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            iNEX<span className="shimmer-gold">ORA</span>
          </button>
        </div>

        <div className="relative anim-fade-up-2">
          <div className="section-rule mb-6" />
          <span className="tag mb-5 inline-block">Welcome Back</span>
          <h1 className="font-display text-4xl font-bold leading-[1.12] mb-5" style={{ color: "var(--text-primary)" }}>
            Pick up right<br />where <span className="shimmer-gold">you left off.</span>
          </h1>
          <p className="font-body text-base leading-relaxed mb-10 max-w-sm" style={{ color: "var(--text-secondary)" }}>
            Your structured path, learning resources, and career tools are exactly where you left them.
          </p>

          <div>
            {[
              { label: "Continue your structured path", sub: "Every module picks up at your last step" },
              { label: "Track real progress", sub: "Clear signals on what to focus on next" },
              { label: "Stay connected to opportunity", sub: "Career tools tied to what you're learning" },
            ].map(({ label, sub }, i) => (
              <div key={i} className="pillar-item">
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.30)" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="font-body text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative font-body text-xs anim-fade-up-3" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} iNEXORA. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT: FORM PANEL ───────────────────────────────────────────── */}
      <div className="relative flex w-full lg:w-[56%] items-center justify-center px-6 py-12" style={{ background: "var(--navy-base)" }}>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 lg:top-10 lg:left-10 flex items-center gap-2 font-body text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="w-full max-w-[400px] anim-fade-up">
          <div className="mb-8 lg:hidden">
            <span className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              iNEX<span className="shimmer-gold">ORA</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Sign in
            </h2>
            <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
              New here?{" "}
              <Link href="/signup" className="font-semibold" style={{ color: "var(--gold)" }}>
                Create an account
              </Link>
            </p>
          </div>

          {message && (
            <div
              className="mb-5 rounded-xl px-4 py-3 font-body text-sm"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "var(--gold)" }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              className="mb-5 rounded-xl px-4 py-3 font-body text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#F87171" }}
            >
              {error}
            </div>
          )}

          {/* OAuth options */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
              className="oauth-btn font-display flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="h-4 w-4 spin-icon" />
              ) : (
                <GoogleIcon className="h-4 w-4" />
              )}
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={oauthLoading !== null}
              className="oauth-btn font-display flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold"
            >
              {oauthLoading === "github" ? (
                <Loader2 className="h-4 w-4 spin-icon" />
              ) : (
                <Github className="h-4 w-4" />
              )}
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("linkedin_oidc")}
              disabled={oauthLoading !== null}
              className="oauth-btn font-display flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold"
            >
              {oauthLoading === "linkedin_oidc" ? (
                <Loader2 className="h-4 w-4 spin-icon" />
              ) : (
                <Linkedin className="h-4 w-4" style={{ color: "#0A66C2" }} />
              )}
              Continue with LinkedIn
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="divider-line" />
            <span className="font-body text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              or
            </span>
            <div className="divider-line" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block font-body text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block font-body text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Password
                </label>
                <Link href="/forgot-password" className="font-body text-xs font-medium" style={{ color: "var(--gold)" }}>
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="field-input pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gold-btn font-display flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 spin-icon" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center font-body text-xs" style={{ color: "var(--text-muted)" }}>
            By continuing, you agree to iNEXORA&apos;s{" "}
            <Link href="/terms" className="underline" style={{ color: "var(--text-secondary)" }}>Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline" style={{ color: "var(--text-secondary)" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "#0A0F1E" }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#22C55E" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}