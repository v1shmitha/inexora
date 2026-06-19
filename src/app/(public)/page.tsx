"use client";

import {
  ArrowRight,
  Users,
  Building2,
  Briefcase,
  BookOpen,
  TrendingUp,
  Award,
  Globe,
  Layers,
  FlaskConical,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div
      className="overflow-x-hidden font-sans"
      style={{ background: "#0A0F1E" }}
    >
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
          --accent:       #A3E635;
          --accent-dim:   #84CC16;
          --blue-acc:     #38BDF8;
          --blue-dim:     rgba(56,189,248,0.15);
          --text-primary: #F5F5F0;
          --text-secondary: rgba(136,153,187,0.70);
          --text-muted:   rgba(136,153,187,0.40);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbitSpinRev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes nodePulse {
          0%, 100% { opacity: 1;    transform: translate(-50%,-50%) scale(1); }
          50%       { opacity: 0.75; transform: translate(-50%,-50%) scale(0.94); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(163,230,53,0); }
          50%       { box-shadow: 0 0 28px 6px rgba(163,230,53,0.22); }
        }

        .anim-fade-up   { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade-up-2 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.15s both; }
        .anim-fade-up-3 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.30s both; }
        .anim-fade-up-4 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.45s both; }
        .anim-fade-in   { animation: fadeIn 1.2s ease both; }

        /* Solid lime highlight headline (no shimmer animation) */
        .shimmer-gold {
          color: var(--gold);
        }

        .shimmer-text {
          color: var(--gold);
        }

        /* ── Illustration ── */
        .illus-wrap {
          position: absolute;
          right: 48px;
          top: 50%;
          transform: translateY(-50%);
          width: 320px;
          height: 360px;
          animation: fadeIn 1s ease 0.35s both;
        }
        .orbit-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(163,230,53,0.14);
          animation: orbitSpin 30s linear infinite;
          transform-origin: center;
        }
        .orbit-inner {
          position: absolute;
          inset: 52px;
          border-radius: 50%;
          border: 1px dashed rgba(163,230,53,0.09);
          animation: orbitSpinRev 20s linear infinite;
          transform-origin: center;
        }
        .sat {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(163,230,53,0.35);
          transform: translate(-50%, -50%);
          box-shadow: 0 0 8px 2px rgba(163,230,53,0.25);
        }
        .core-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%,-50%);
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: rgba(163,230,53,0.06);
          border: 1.5px solid rgba(163,230,53,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: nodePulse 3.5s ease-in-out infinite, goldPulse 3.5s ease-in-out infinite;
        }
        .core-inner {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(163,230,53,0.12);
          border: 1.5px solid rgba(163,230,53,0.36);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stage-node {
          position: absolute;
          background: rgba(20,28,54,0.85);
          border: 1px solid rgba(163,230,53,0.22);
          border-radius: 11px;
          padding: 9px 13px;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: floatY var(--dur,6s) ease-in-out var(--delay,0s) infinite;
          white-space: nowrap;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }
        .stage-node .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 6px;
          vertical-align: middle;
          margin-bottom: 1px;
        }
        .stage-node .lbl {
          font-family: 'Sora', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-primary);
          vertical-align: middle;
        }
        .stage-node .sub {
          font-family: 'Inter', sans-serif;
          font-size: 9.5px;
          color: var(--text-muted);
          margin-top: 3px;
        }
        .conn-svg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: visible;
        }

        /* Cards */
        .card-hover { transition: transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s ease, border-color 0.3s ease; }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px -10px rgba(34,197,94,0.12), 0 4px 20px rgba(0,0,0,0.5);
          border-color: rgba(34,197,94,0.28) !important;
        }

        // .card-hover-1 { transition: box-shadow 0.3s ease, border-color 0.3s ease; }
        .card-hover-1 {
          box-shadow: 0 20px 60px -10px rgba(34,197,94,0.12), 0 4px 20px rgba(0, 0, 0, 0.09);
          border-color: rgba(34,197,94,0.28) !important;
        }

        /* Step cards */
        .step-card { background: var(--navy-card); border: 1px solid var(--navy-border); }

        /* Primary CTA button */
        .gold-btn {
          background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
          color: #0A0F1E;
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .gold-btn:hover {
          box-shadow: 0 0 0 6px rgba(34,197,94,0.15), 0 8px 30px rgba(34,197,94,0.35);
          transform: translateY(-2px);
        }

        /* Outline button */
        .ghost-btn {
          background: rgba(228, 228, 228, 0.07);
          border: 1.5px solid rgba(34,197,94,0.30);
          color: var(--text-primary);
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .ghost-btn:hover {
          background: rgba(34,197,94,0.13);
          border-color: rgba(34,197,94,0.55);
        }

        /* Section pill badges */
        .section-badge {
          display: inline-block;
          border-radius: 9999px;
          background: #22c55e11;
          border: 1px solid rgba(163,230,53,0.22);
          color: var(--gold);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.375rem 1rem;
          margin-bottom: 1.25rem;
          font-family: 'Sora', sans-serif;
        }

        .section-badge-1 {
          display: inline-block;
          border-radius: 9999px;
          background: #141c36;
          border: 1px solid rgb(136, 153, 187);
          color: var(--gold);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.375rem 1rem;
          margin-bottom: 1.25rem;
          font-family: 'Sora', sans-serif;
        }

        /* Divider */
        .gold-divider { border-color: rgba(34,197,94,0.12); }

        /* Noise texture overlay */
        .noise-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        /* Hero section blob accents */
        .hero-blob-gold {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="noise-overlay relative flex min-h-[90vh] items-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0A0F1E 0%, #0E1426 50%, #141C36 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, #22C55E 1.5px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Ambient blobs */}
        <div
          className="hero-blob-gold"
          style={{
            top: "-60px",
            left: "-80px",
            width: "480px",
            height: "380px",
            background: "rgba(163,230,53,0.07)",
          }}
        />
        <div
          className="hero-blob-gold"
          style={{
            bottom: "-40px",
            right: "120px",
            width: "360px",
            height: "300px",
            background: "rgba(56,189,248,0.06)",
          }}
        />
        <div
          className="hero-blob-gold"
          style={{
            top: "40%",
            left: "38%",
            width: "280px",
            height: "220px",
            background: "rgba(34,197,94,0.04)",
          }}
        />

        {/* ── GEOMETRIC ILLUSTRATION ── */}
        <div className="illus-wrap mr-20 hidden lg:block">
          <svg
            className="conn-svg"
            viewBox="0 0 320 360"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M160 180 Q110 150 70 95"
              fill="none"
              stroke="rgba(163,230,53,0.15)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <path
              d="M160 180 Q210 148 250 95"
              fill="none"
              stroke="rgba(163,230,53,0.15)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <path
              d="M160 180 Q218 228 255 272"
              fill="none"
              stroke="rgba(163,230,53,0.15)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <path
              d="M160 180 Q102 230 65 268"
              fill="none"
              stroke="rgba(163,230,53,0.15)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
            <path
              d="M88 78 Q160 40 232 78"
              fill="none"
              stroke="rgba(163,230,53,0.08)"
              strokeWidth="1"
              strokeDasharray="3 7"
            />
          </svg>
          <div className="orbit-outer" />
          <div className="orbit-inner" />
          {/* <div className="sat" style={{ top: "0%", left: "50%" }} />
          <div className="sat" style={{ top: "50%", left: "100%" }} />
          <div className="sat" style={{ top: "100%", left: "50%" }} />
          <div className="sat" style={{ top: "50%", left: "0%" }} /> */}
          <div className="core-glow">
            <div className="core-inner">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 17V3L17 17V3"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div
            className="stage-node"
            style={
              {
                top: "58px",
                left: "8px",
                "--dur": "6s",
                "--delay": "0s",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="dot" style={{ background: "#22C55E" }} />
              <span className="lbl">Learn</span>
            </div>
            <div className="sub">Structured programs</div>
          </div>
          <div
            className="stage-node"
            style={
              {
                top: "58px",
                right: "8px",
                "--dur": "7s",
                "--delay": "0.9s",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="dot" style={{ background: "#22C55E" }} />
              <span className="lbl">Grow</span>
            </div>
            <div className="sub">Guided pathways</div>
          </div>
          <div
            className="stage-node"
            style={
              {
                bottom: "58px",
                right: "6px",
                "--dur": "8s",
                "--delay": "1.6s",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="dot" style={{ background: "#22C55E" }} />
              <span className="lbl">Career</span>
            </div>
            <div className="sub">Real opportunities</div>
          </div>
          <div
            className="stage-node"
            style={
              {
                bottom: "60px",
                left: "6px",
                "--dur": "6.5s",
                "--delay": "0.4s",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="dot" style={{ background: "#22C55E" }} />
              <span className="lbl">Explore</span>
            </div>
            <div className="sub">Resources & research</div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {/* Badge */}
            <div
              className="anim-fade-in mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
              style={{
                background: "rgba(163,230,53,0.08)",
                border: "1px solid rgba(163,230,53,0.22)",
              }}
            >
              <span
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ background: "#22C55E" }}
              />
              <span
                className="text-sm font-medium"
                style={{
                  color: "#22C55E",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Next-generation learning platform
              </span>
            </div>

            <h1
              className="font-display anim-fade-up mb-6 text-5xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl"
              style={{ color: "#F5F5F0" }}
            >
              Unlocking
              <br />
              <span className="shimmer-gold">The Next You</span>
            </h1>

            <p
              className="anim-fade-up-2 font-body mb-4 max-w-xl text-lg leading-relaxed sm:text-xl"
              style={{ color: "rgba(136,153,187,0.75)" }}
            >
              A next-generation platform designed to help you learn, grow, and
              evolve with clarity, purpose, and real-world direction.
            </p>
            <p
              className="anim-fade-up-2 font-body mb-10 max-w-lg text-base"
              style={{ color: "rgba(136,153,187,0.45)" }}
            >
              Move beyond information. Step into transformation.
            </p>

            <div className="anim-fade-up-3 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => router.push("/signup")}
                className="gold-btn font-display group inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => router.push("/programs")}
                className="ghost-btn font-display inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold backdrop-blur-sm"
              >
                Explore Platform
              </button>
            </div>

            {/* Trust bar */}
            <div
              className="anim-fade-up-4 mt-14 flex flex-wrap gap-x-8 gap-y-3 pt-8"
              style={{ borderTop: "1px solid rgba(163,230,53,0.12)" }}
            >
              {[
                { value: "10,000+", label: "Students" },
                { value: "50+", label: "Universities" },
                { value: "200+", label: "Programs" },
              ].map((s) => (
                <div key={s.label} className="flex items-baseline gap-2">
                  <span className="font-display shimmer-gold text-2xl font-bold">
                    {s.value}
                  </span>
                  <span
                    className="text-sm"
                    style={{
                      color: "rgba(136,153,187,0.5)",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────────────────── */}
      <section
        className="relative py-17"
        style={{ background: "var(--text-primary)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="section-badge">Our Vision</span>
              <h2
                className="font-display mb-6 text-4xl leading-tight font-bold sm:text-5xl"
                style={{ color: "#141C36" }}
              >
                Built for Growth.
                <br />
                <span style={{ color: "var(--gold)" }}>
                  Designed for Progress.
                </span>
              </h2>
              <div
                className="font-body space-y-4 text-base leading-relaxed"
                style={{ color: "#1E2B55" }}
              >
                <p>
                  In a world filled with endless information, finding the right
                  path can be overwhelming.
                </p>
                <p>
                  iNEXORA brings everything into one place — not just content,
                  but a clear, guided system that helps you move forward with
                  confidence.
                </p>
                <p>
                  From learning new skills to building your career and
                  contributing to knowledge, every step is connected into one
                  continuous journey.
                </p>
                <p className="font-semibold" style={{ color: "#F5F5F0" }}>
                  This is not just a platform. It's a space where progress
                  becomes structured, and potential becomes real.
                </p>
              </div>
              <button
                onClick={() => router.push("/about")}
                className="font-display inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
                style={{ color: "var(--gold)" }}
              >
                Learn more about us <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-5">
              {/* Soft glow behind grid */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 60% at 50% 50%, #22c55e6f 0%, transparent 70%)",
                }}
              />
              <div className="relative grid grid-cols-2 gap-4 p-8">
                {[
                  {
                    icon: BookOpen,
                    label: "Structured Learning",
                    accent: "#22C55E",
                    count: "200+ Programs",
                  },
                  {
                    icon: TrendingUp,
                    label: "Career Pathways",
                    accent: "#22C55E",
                    count: "85% Placement",
                  },
                  {
                    icon: Award,
                    label: "Certifications",
                    accent: "#22C55E",
                    count: "10K+ Earned",
                  },
                  {
                    icon: Globe,
                    label: "Global Access",
                    accent: "#22C55E",
                    count: "50+ Partners",
                  },
                ].map(({ icon: Icon, label, accent, count }) => (
                  <div
                    key={label}
                    className="card-hover-1 rounded-2xl p-5"
                    style={{
                      background: "var(--white)",
                      border: "1px solid #16a34a51",
                    }}
                  >
                    <div
                      className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background: `${accent}22`,
                        border: `1px solid ${accent}44`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                    <p
                      className="font-display text-sm font-semibold"
                      style={{ color: "#141C36" }}
                    >
                      {label}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "#1E2B55" }}
                    >
                      {count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--navy-base)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="section-badge">How It Works</span>
            <h2
              className="font-display mb-4 text-4xl font-bold sm:text-5xl"
              style={{ color: "#F5F5F0" }}
            >
              A System That Moves You Forward
            </h2>
            <p
              className="font-body mx-auto max-w-2xl text-lg"
              style={{ color: "rgba(136,153,187,0.55)" }}
            >
              iNEXORA is designed to guide you through every stage of growth,
              with clarity at every step.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                num: "01",
                icon: BookOpen,
                accent: "#22C55E",
                title: "Learn with Purpose",
                desc: "Gain access to structured learning designed to build real skills and meaningful understanding.",
              },
              {
                num: "02",
                icon: TrendingUp,
                accent: "#22C55E",
                title: "Grow with Direction",
                desc: "Follow guided pathways that help you apply what you learn and stay aligned with your goals.",
              },
              {
                num: "03",
                icon: Briefcase,
                accent: "#22C55E",
                title: "Step Into Opportunity",
                desc: "Receive career support and tools that help you confidently move into the professional world.",
              },
              {
                num: "04",
                icon: Layers,
                accent: "#22C55E",
                title: "Access the Right Resources",
                desc: "Explore books and study materials that support your learning and deepen your knowledge.",
              },
              {
                num: "05",
                icon: FlaskConical,
                accent: "#22C55E",
                title: "Contribute and Advance",
                desc: "Engage in research and publish your work under expert guidance, turning knowledge into impact.",
              },
              { num: null, icon: null, accent: "", title: "", desc: "" },
            ].map((step, i) => {
              if (!step.num)
                return (
                  <div
                    key={i}
                    className="card-hover flex flex-col items-center justify-center gap-4 rounded-2xl p-8 text-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #131B30 0%, #1E2B55 100%)",
                      border: "1px solid rgba(34,197,94,0.22)",
                    }}
                  >
                    <p
                      className="font-display text-xl font-bold"
                      style={{ color: "#F5F5F0" }}
                    >
                      Ready to begin your journey?
                    </p>
                    <button
                      onClick={() => router.push("/signup")}
                      className="gold-btn font-display inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
                    >
                      Start Now <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                );
              const Icon = step.icon!;
              return (
                <div key={i} className="card-hover step-card rounded-2xl p-7">
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        background: `${step.accent}18`,
                        border: `1px solid ${step.accent}33`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: step.accent }}
                      />
                    </div>
                    <span
                      className="font-display text-3xl font-bold"
                      style={{ color: "rgba(255,255,255,0.08)" }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3
                    className="font-display mb-2 text-lg font-bold"
                    style={{ color: "#F5F5F0" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="font-body text-sm leading-relaxed"
                    style={{ color: "rgba(136,153,187,0.55)" }}
                  >
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY iNEXORA ──────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--navy-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="section-badge">Why iNEXORA</span>
            <h2
              className="font-display mb-4 text-4xl font-bold sm:text-5xl"
              style={{ color: "#F5F5F0" }}
            >
              More Than Learning.
              <br />
              <span style={{ color: "var(--gold)" }}>
                A Complete Growth System.
              </span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Layers,
                accent: "#22C55E",
                title: "Everything in One Place",
                desc: "No more scattered platforms. Learning, career support, resources, and research come together in one seamless experience.",
              },
              {
                icon: TrendingUp,
                accent: "#22C55E",
                title: "Clarity at Every Step",
                desc: "We remove confusion and provide direction, so you always know what to do next.",
              },
              {
                icon: Award,
                accent: "#22C55E",
                title: "Focused on Real Outcomes",
                desc: "Beyond theory and passive learning. Everything is designed to help you achieve measurable progress.",
              },
              {
                icon: FlaskConical,
                accent: "#22C55E",
                title: "Built for Continuous Growth",
                desc: "From your first step to advanced levels, iNEXORA grows with you at every stage.",
              },
              {
                icon: Users,
                accent: "#16A34A",
                title: "Centered Around You",
                desc: "Every feature is designed to support your journey, helping you unlock your next level with confidence.",
              },
              {
                icon: Globe,
                accent: "#22C55E",
                title: "Global Standards, Local Relevance",
                desc: "UGC/TVEC approved programs meeting national standards with global perspective.",
              },
            ].map(({ icon: Icon, accent, title, desc }) => (
              <div
                key={title}
                className="card-hover group relative overflow-hidden rounded-2xl p-7"
                style={{
                  background: "var(--navy-card)",
                  border: "1px solid rgba(136,153,187,0.12)",
                }}
              >
                {/* Hover gradient overlay */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(34,197,94,0.05) 0%, transparent 70%)",
                  }}
                />
                <div className="relative">
                  <div
                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      background: `${accent}18`,
                      border: `1px solid ${accent}33`,
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color: accent }} />
                  </div>
                  <h3
                    className="font-display mb-2 text-lg font-bold"
                    style={{ color: "#F5F5F0" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="font-body text-sm leading-relaxed"
                    style={{ color: "rgba(136,153,187,0.55)" }}
                  >
                    {desc}
                  </p>
                  <div
                    className="mt-4 flex items-center gap-1.5 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                    style={{
                      color: "var(--gold)",
                      fontFamily: "'Sora', sans-serif",
                    }}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Included in your
                    plan
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--navy-base)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2
              className="font-display mb-4 text-4xl font-bold"
              style={{ color: "#F5F5F0" }}
            >
              Built for Every Stakeholder
            </h2>
            <p
              className="font-body mx-auto max-w-xl text-lg"
              style={{ color: "rgba(136,153,187,0.50)" }}
            >
              One platform, three powerful perspectives
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Users,
                accent: "#22C55E",
                title: "Students",
                tagline: "Grow your potential",
                points: [
                  "Discover accredited programs",
                  "Build stackable credentials",
                  "Access career opportunities",
                  "Track your progress",
                ],
                cta: "Explore as Student",
                href: "/signup",
              },
              {
                icon: Building2,
                accent: "#22C55E",
                title: "Universities",
                tagline: "Expand your reach",
                points: [
                  "List and manage programs",
                  "Connect with students globally",
                  "Track enrollment outcomes",
                  "Manage lecturer assignments",
                ],
                cta: "Partner with Us",
                href: "/contact",
              },
              {
                icon: Briefcase,
                accent: "#22C55E",
                title: "Employers",
                tagline: "Find top talent",
                points: [
                  "Post job opportunities",
                  "Access skilled graduates",
                  "Offer internship programs",
                  "Build your talent pipeline",
                ],
                cta: "Start Hiring",
                href: "/signup",
              },
            ].map(
              ({ icon: Icon, accent, title, tagline, points, cta, href }) => (
                <div
                  key={title}
                  className="card-hover-1 overflow-hidden rounded-2xl"
                  style={{
                    background: "var(--navy-card)",
                    border: "1px solid rgba(136,153,187,0.12)",
                  }}
                >
                  {/* Card header */}
                  <div
                    className="px-7 py-6"
                    style={{
                      background: `linear-gradient(135deg, ${accent}22 0%, ${accent}0d 100%)`,
                      borderBottom: `1px solid ${accent}22`,
                    }}
                  >
                    <div className="mb-1 flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                          background: `${accent}22`,
                          border: `1px solid ${accent}44`,
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: accent }} />
                      </div>
                      <h3
                        className="font-display text-xl font-bold"
                        style={{ color: "#F5F5F0" }}
                      >
                        {title}
                      </h3>
                    </div>
                    <p
                      className="mt-1 text-sm"
                      style={{
                        color: "rgba(136,153,187,0.50)",
                        fontFamily: "'Inter',sans-serif",
                      }}
                    >
                      {tagline}
                    </p>
                  </div>
                  <div className="px-7 py-6">
                    <ul className="mb-7 space-y-3">
                      {points.map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-2.5 text-sm"
                          style={{
                            color: "rgba(136,153,187,0.65)",
                            fontFamily: "'Inter',sans-serif",
                          }}
                        >
                          <CheckCircle
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            style={{ color: accent }}
                          />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => router.push(href)}
                      className="font-display w-full rounded-xl py-3 text-sm font-semibold transition"
                      style={{
                        background: `${accent}14`,
                        color: accent,
                        border: `1px solid ${accent}30`,
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = `${accent}22`;
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = `${accent}14`;
                      }}
                    >
                      {cta}
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────────────── */}
      <section
        className="noise-overlay relative overflow-hidden py-24"
        style={{
          background:
            "linear-gradient(135deg, #0A0F1E 0%, #141C36 50%, #0E1426 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #22C55E 1.5px, transparent 0)",
            backgroundSize: "30px 30px",
          }}
        />
        {/* Blobs */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full"
          style={{ background: "rgba(163,230,53,0.06)", filter: "blur(80px)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full"
          style={{ background: "rgba(56,189,248,0.05)", filter: "blur(80px)" }}
        />
        {/* Accent ring */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ border: "1px solid rgba(163,230,53,0.06)" }}
        />
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ border: "1px dashed rgba(163,230,53,0.05)" }}
        />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span
            className="font-display mb-8 inline-block rounded-full px-4 py-1.5 text-sm font-medium"
            style={{
              background: "rgba(163,230,53,0.08)",
              border: "1px solid rgba(163,230,53,0.20)",
              color: "#22C55E",
            }}
          >
            Your journey starts here
          </span>
          <h2
            className="font-display mb-6 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl"
            style={{ color: "#F5F5F0" }}
          >
            Your Next Step
            <br />
            <span className="shimmer-gold">Starts Here</span>
          </h2>
          <p
            className="font-body mx-auto mb-4 max-w-2xl text-lg"
            style={{ color: "rgba(136,153,187,0.65)" }}
          >
            The future you are working towards is not far away. It begins with
            the right system, the right direction, and the right support.
          </p>
          <p
            className="font-body mb-12 text-base"
            style={{ color: "rgba(136,153,187,0.38)" }}
          >
            iNEXORA is here to guide that journey.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => router.push("/signup")}
              className="gold-btn font-display group inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold shadow-xl"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => router.push("/programs")}
              className="font-display inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-100"
              style={{ color: "rgba(136,153,187,0.55)" }}
            >
              Browse programs <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
