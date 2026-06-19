"use client";

import { ArrowRight, Compass, Layers, BookOpen, Briefcase, FlaskConical, Target, Eye, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function About() {
  const router = useRouter();

  return (
    <div className="overflow-x-hidden font-sans" style={{ background: "#0A0F1E" }}>
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
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lineDraw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .anim-fade-up   { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade-up-2 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.15s both; }
        .anim-fade-up-3 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.30s both; }
        .anim-fade-in   { animation: fadeIn 1.2s ease both; }

        .shimmer-gold { color: var(--gold); }

        /* Dot grid */
        .dot-grid {
          background-image: radial-gradient(circle at 1.5px 1.5px, #A3E635 1.5px, transparent 0);
          background-size: 36px 36px;
          opacity: 0.06;
        }

        /* Section rule */
        .section-rule {
          width: 48px; height: 2px;
          background: var(--gold);
          border-radius: 2px;
          transform-origin: left;
          animation: lineDraw 0.7s ease 0.3s both;
        }

        /* Pill badges */
        .tag {
          display: inline-block;
          background: rgba(163,230,53,0.10);
          border: 1px solid rgba(163,230,53,0.22);
          color: var(--gold);
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 99px;
        }

        /* Dark card */
        .dark-card {
          background: var(--navy-card);
          border: 1px solid var(--navy-border);
          border-radius: 16px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .dark-card:hover {
          border-color: rgba(34,197,94,0.28);
          box-shadow: 0 20px 60px -10px rgba(34,197,94,0.12), 0 4px 20px rgba(0,0,0,0.5);
        }

        /* Philosophy triptych */
        .phil-card {
          background: var(--navy-card);
          border: 1px solid var(--navy-border);
          border-radius: 16px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .phil-card:hover {
          border-color: rgba(34,197,94,0.28);
          box-shadow: 0 20px 60px -10px rgba(34,197,94,0.12), 0 4px 20px rgba(0,0,0,0.5);
        }
        .phil-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          border-radius: 16px 16px 0 0;
        }

        /* Manifesto lines */
        .manifesto-line {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid var(--navy-border);
        }
        .manifesto-line:last-child { border-bottom: none; }
        .manifesto-num {
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          min-width: 28px;
          padding-top: 3px;
        }

        /* Pillar rows */
        .pillar-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid var(--navy-border);
        }
        .pillar-item:last-child { border-bottom: none; }

        /* CTA section */
        .cta-section {
          background: linear-gradient(135deg, #0A0F1E 0%, #0E1426 50%, #141C36 100%);
          border-top: 1px solid var(--navy-border-strong);
          position: relative;
          overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          top: -160px; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 300px;
          background: radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Buttons */
        .gold-btn {
          background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
          color: #0A0F1E;
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .gold-btn:hover {
          box-shadow: 0 0 0 6px rgba(34,197,94,0.15), 0 8px 30px rgba(34,197,94,0.35);
          transform: translateY(-2px);
        }
        .ghost-btn {
          background: rgba(228,228,228,0.07);
          border: 1.5px solid rgba(34,197,94,0.30);
          color: var(--text-primary);
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .ghost-btn:hover {
          background: rgba(34,197,94,0.13);
          border-color: rgba(34,197,94,0.55);
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[72vh] flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0E1426 50%, #141C36 100%)" }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid" style={{ opacity: 0.06 }} />

        {/* Ambient blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top right, rgba(56,189,248,0.06) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at bottom left, rgba(163,230,53,0.05) 0%, transparent 65%)" }} />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-28 text-center">
          <h1 className="font-display anim-fade-up text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.06] mb-8" style={{ color: "var(--text-primary)" }}>
            Unlocking<br />
            <span className="shimmer-gold">The Next You</span>
          </h1>
          <p className="anim-fade-up-2 font-body text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-5" style={{ color: "var(--text-secondary)" }}>
            iNEXORA was created with a clear purpose, to help individuals move beyond information and step into meaningful growth.
          </p>
          <p className="anim-fade-up-3 font-body text-base max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            In today's world, access to knowledge is no longer the problem. The challenge is finding direction, structure, and a clear path forward. iNEXORA exists to solve that.
          </p>
        </div>
      </section>

      {/* ── OUR STORY ────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--navy-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            <div>
              <div className="section-rule mb-6" />
              <span className="tag mb-5 inline-block">Our Story</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-8" style={{ color: "var(--text-primary)" }}>
                Why iNEXORA<br />
                <span className="shimmer-gold">Exists</span>
              </h2>
              <div className="space-y-5 font-body text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <p>iNEXORA began with a simple observation: people have access to more information than ever before, yet many still struggle to grow with clarity and purpose.</p>
                <p>Learning is often scattered. Opportunities feel disconnected. Progress becomes uncertain.</p>
                <p>We saw the need for something different. A system that connects knowledge, guidance, and real-world outcomes into one unified experience.</p>
                <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>That idea became iNEXORA.</p>
              </div>
            </div>

            <div>
              <div className="section-rule mb-6" />
              <span className="tag mb-5 inline-block">Our Approach</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-8" style={{ color: "var(--text-primary)" }}>
                Growth Should<br />
                <span className="shimmer-gold">Not Be Random</span>
              </h2>
              <p className="font-body text-base leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
                It should be guided, structured, and meaningful. At iNEXORA, we focus on what actually moves people forward.
              </p>
              <div className="space-y-0">
                {[
                  { label: "Clarity over confusion",         sub: "Structured paths replace scattered searching" },
                  { label: "Direction over distraction",     sub: "Purpose-built guidance at every stage" },
                  { label: "Progress over passive learning", sub: "Applied growth, not just absorbed content" },
                ].map(({ label, sub }, i) => (
                  <div key={i} className="manifesto-line">
                    <span className="manifesto-num">0{i + 1}</span>
                    <div>
                      <p className="font-display font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
                      <p className="font-body text-sm" style={{ color: "var(--text-muted)" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── WHAT WE ARE BUILDING ─────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--navy-base)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-rule mb-6" style={{ marginLeft: "auto", marginRight: "auto" }} />
            <span className="tag mb-5 inline-block">What We Are Building</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5" style={{ color: "var(--text-primary)" }}>
              A Structured Ecosystem<br />
              <span className="shimmer-gold">For Continuous Growth</span>
            </h2>
            <p className="font-body text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              iNEXORA is not just a platform. It is a structured ecosystem designed to support continuous growth. Every element is designed to work together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              { icon: BookOpen,     color: "#22C55E", bg: "rgba(34,197,94,0.10)",  label: "Education",           desc: "Structured programs that build real skills and meaningful understanding." },
              { icon: Briefcase,    color: "#22C55E", bg: "rgba(34,197,94,0.10)",   label: "Career Support",      desc: "Systems that bridge learning and employment, creating real opportunities." },
              { icon: Layers,       color: "#22C55E", bg: "rgba(34,197,94,0.10)",  label: "Knowledge Resources", desc: "Books and materials that deepen understanding and expand perspective." },
              { icon: FlaskConical, color: "#22C55E", bg: "rgba(34,197,94,0.10)", label: "Research Pathways",   desc: "Innovation and contribution guided by expert supervision and purpose." },
            ].map(({ icon: Icon, color, bg, label, desc }, i) => (
              <div key={i} className="dark-card p-7">
                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${color}44` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>{label}</h3>
                    <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISION & MISSION ─────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--navy-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Vision */}
            <div className="phil-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(56,189,248,0.25)" }}>
                  <Eye className="h-5 w-5" style={{ color: "#22C55E" }} />
                </div>
                <span className="tag">Our Vision</span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-5" style={{ color: "var(--text-primary)" }}>
                Evolving Intelligence,<br />Human Capability
              </h3>
              <p className="font-body text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                To shape a future where evolving intelligence drives progress, and guided knowledge systems unlock the next level of human capability.
              </p>
            </div>

            {/* Mission */}
            <div className="phil-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <Target className="h-5 w-5" style={{ color: "var(--gold)" }} />
                </div>
                <span className="tag">Our Mission</span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-5" style={{ color: "var(--text-primary)" }}>
                Potential Into<br />Measurable Progress
              </h3>
              <p className="font-body text-base leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
                To build an integrated platform that empowers individuals to learn, grow, and advance, transforming scattered information into clear direction.
              </p>
              <div className="space-y-0">
                {[
                  "Structured education that delivers real-world skills",
                  "Career support systems that bridge learning and employment",
                  "Accessible knowledge through books and learning materials",
                  "Research and innovation pathways guided by expert supervision",
                ].map((pt, i) => (
                  <div key={i} className="pillar-item">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.30)" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} />
                    </div>
                    <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ───────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--navy-base)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="tag mb-5 inline-block">Our Philosophy</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold" style={{ color: "var(--text-primary)" }}>
              We Don't Just<br />
              <span className="shimmer-gold">Deliver. We Design.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { icon: Compass, color: "#22C55E", bg: "rgba(34,197,94,0.10)",  before: "We don't just deliver content.",    after: "We design progression.",       sub: "Every step is intentional, every pathway is purposeful." },
              { icon: Zap,     color: "#22C55E", bg: "rgba(34,197,94,0.10)",   before: "We don't just connect people.",     after: "We align them with purpose.",   sub: "Matching individuals to the right direction at the right time." },
              { icon: Target,  color: "#22C55E", bg: "rgba(34,197,94,0.10)",  before: "We don't just build a platform.",   after: "We build a pathway forward.",   sub: "A system designed to support evolution, step by step." },
            ].map(({ icon: Icon, color, bg, before, after, sub }, i) => (
              <div key={i} className="phil-card text-center">
                <div className="mx-auto mb-6 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${color}44` }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <p className="font-body text-sm mb-2" style={{ color: "var(--text-muted)" }}>{before}</p>
                <p className="font-display font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>{after}</p>
                <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="cta-section py-28">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="tag mb-8 inline-block">Looking Ahead</span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-8" style={{ color: "var(--text-primary)" }}>
            The future belongs<br />
            to those who <span className="shimmer-gold">evolve.</span>
          </h2>
          <p className="font-body text-lg leading-relaxed max-w-2xl mx-auto mb-4" style={{ color: "var(--text-secondary)" }}>
            iNEXORA is built to support that evolution step by step, system by system. Whether you are beginning your journey or ready to take the next level, we are here to guide it.
          </p>
          <p className="font-body text-base mb-12" style={{ color: "var(--text-muted)" }}>
            Your next step starts here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/signup")}
              className="gold-btn font-display group inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-bold shadow-lg"
            >
              Begin Your Journey
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => router.push("/programs")}
              className="ghost-btn font-display inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold backdrop-blur-sm"
            >
              Explore Programs
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}