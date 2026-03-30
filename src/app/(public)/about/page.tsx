"use client";

import { ArrowRight, Compass, Layers, BookOpen, Briefcase, FlaskConical, Target, Eye, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function About() {
  const router = useRouter();

  return (
    <div className="bg-[#0d1117] font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');

        .font-display { font-family: 'Sora', sans-serif; }
        .font-body    { font-family: 'Inter', sans-serif; }

        /* Palette tokens */
        :root {
          --bg-base:    #0d1117;
          --bg-surface: #131920;
          --bg-raised:  #1a2332;
          --bg-card:    #1e2a3a;
          --border:     rgba(255,255,255,0.07);
          --border-mid: rgba(255,255,255,0.12);
          --gold:       #f0a850;
          --gold-dim:   rgba(240,168,80,0.12);
          --gold-glow:  rgba(240,168,80,0.06);
          --blue-acc:   #3b82f6;
          --blue-dim:   rgba(59,130,246,0.12);
          --text-1:     #f0f4f8;
          --text-2:     #8fa3bb;
          --text-3:     #55697d;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes shimmerGold {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes lineDraw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .anim-fade-up   { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade-up-2 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.15s both; }
        .anim-fade-up-3 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.30s both; }
        .anim-fade-in   { animation: fadeIn 1.2s ease both; }

        .gold-text {
          background: linear-gradient(90deg, #f0a850 0%, #fcd97a 45%, #f0a850 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerGold 5s linear infinite;
        }

        /* Dot grid texture */
        .dot-grid {
          background-image: radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.05) 1.5px, transparent 0);
          background-size: 32px 32px;
        }

        /* Section divider line */
        .section-rule {
          width: 48px; height: 2px;
          background: var(--gold);
          border-radius: 2px;
          transform-origin: left;
          animation: lineDraw 0.7s ease 0.3s both;
        }

        /* Pill tag */
        .tag {
          display: inline-block;
          background: var(--gold-dim);
          border: 1px solid rgba(240,168,80,0.22);
          color: var(--gold);
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 99px;
        }

        /* Card base */
        .dark-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          transition: border-color 0.3s ease, transform 0.3s cubic-bezier(.16,1,.3,1);
        }
        .dark-card:hover {
          border-color: var(--border-mid);
          transform: translateY(-4px);
        }

        /* Philosophy triptych */
        .phil-card {
          background: var(--bg-raised);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
        }
        .phil-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          border-radius: 16px 16px 0 0;
        }

        /* Manifesto blockquote */
        .manifesto-line {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
        }
        .manifesto-line:last-child { border-bottom: none; }
        .manifesto-num {
          font-family: 'Sora', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-3);
          letter-spacing: 0.06em;
          min-width: 28px;
          padding-top: 3px;
        }

        /* Build pillar row */
        .pillar-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid var(--border);
        }
        .pillar-item:last-child { border-bottom: none; }
        .pillar-icon {
          width: 40px; height: 40px; flex-shrink: 0;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border-mid);
        }

        /* Closing CTA */
        .cta-section {
          background: linear-gradient(135deg, #111827 0%, #0f172a 50%, #0d1117 100%);
          border-top: 1px solid var(--border-mid);
          position: relative;
          overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          top: -160px; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 300px;
          background: radial-gradient(ellipse, rgba(240,168,80,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .glow-btn {
          transition: box-shadow 0.3s ease, transform 0.2s ease;
          background: linear-gradient(135deg, #f0a850 0%, #f5c26b 100%);
        }
        .glow-btn:hover {
          box-shadow: 0 0 0 6px rgba(240,168,80,0.15), 0 8px 28px rgba(240,168,80,0.25);
          transform: translateY(-2px);
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[72vh] flex items-center dot-grid" style={{ background: "var(--bg-base)" }}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top right, rgba(59,130,246,0.07) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at bottom left, rgba(240,168,80,0.05) 0%, transparent 65%)" }} />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div className="anim-fade-in mb-8 flex justify-center">
            {/* <span className="tag">About Us</span> */}
          </div>

          <h1 className="font-display anim-fade-up text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.06] mb-8" style={{ color: "var(--text-1)" }}>
            Unlocking<br />
            <span className="gold-text">The Next You</span>
          </h1>

          <p className="anim-fade-up-2 font-body text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-5" style={{ color: "var(--text-2)" }}>
            iNEXORA was created with a clear purpose, to help individuals move beyond information and step into meaningful growth.
          </p>
          <p className="anim-fade-up-3 font-body text-base max-w-xl mx-auto" style={{ color: "var(--text-3)" }}>
            In today's world, access to knowledge is no longer the problem. The challenge is finding direction, structure, and a clear path forward. iNEXORA exists to solve that.
          </p>
        </div>
      </section>

      {/* ── OUR STORY ────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--bg-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            <div>
              <div className="section-rule mb-6" />
              <span className="tag mb-5 inline-block">Our Story</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-8" style={{ color: "var(--text-1)" }}>
                Why iNEXORA<br />
                <span className="gold-text">Exists</span>
              </h2>
              <div className="space-y-5 font-body text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
                <p>iNEXORA began with a simple observation, people have access to more information than ever before, yet many still struggle to grow with clarity and purpose.</p>
                <p>Learning is often scattered. Opportunities feel disconnected. Progress becomes uncertain.</p>
                <p>We saw the need for something different. A system that connects knowledge, guidance, and real-world outcomes into one unified experience.</p>
                <p className="font-semibold text-lg" style={{ color: "var(--text-1)" }}>That idea became iNEXORA.</p>
              </div>
            </div>

            {/* Approach block */}
            <div>
              <div className="section-rule mb-6" />
              <span className="tag mb-5 inline-block">Our Approach</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-8" style={{ color: "var(--text-1)" }}>
                Growth Should<br />
                <span className="gold-text">Not Be Random</span>
              </h2>
              <p className="font-body text-base leading-relaxed mb-8" style={{ color: "var(--text-2)" }}>
                It should be guided, structured, and meaningful. At iNEXORA, we focus on what actually moves people forward.
              </p>

              <div className="space-y-0">
                {[
                  { label: "Clarity over confusion",          sub: "Structured paths replace scattered searching" },
                  { label: "Direction over distraction",      sub: "Purpose-built guidance at every stage" },
                  { label: "Progress over passive learning",  sub: "Applied growth, not just absorbed content" },
                ].map(({ label, sub }, i) => (
                  <div key={i} className="manifesto-line">
                    <span className="manifesto-num">0{i + 1}</span>
                    <div>
                      <p className="font-display font-semibold text-base mb-1" style={{ color: "var(--text-1)" }}>{label}</p>
                      <p className="font-body text-sm" style={{ color: "var(--text-3)" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── WHAT WE ARE BUILDING ─────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--bg-base)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <div className="section-rule mx-auto mb-6" style={{ marginLeft: "auto", marginRight: "auto" }} />
            <span className="tag mb-5 inline-block">What We Are Building</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5" style={{ color: "var(--text-1)" }}>
              A Structured Ecosystem<br />
              <span className="gold-text">For Continuous Growth</span>
            </h2>
            <p className="font-body text-lg max-w-2xl mx-auto" style={{ color: "var(--text-2)" }}>
              iNEXORA is not just a platform. It is a structured ecosystem designed to support continuous growth. Every element is designed to work together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              { icon: BookOpen,    color: "#3b82f6", bg: "var(--blue-dim)",  label: "Education",      desc: "Structured programs that build real skills and meaningful understanding." },
              { icon: Briefcase,   color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "Career Support", desc: "Systems that bridge learning and employment, creating real opportunities." },
              { icon: Layers,      color: "#f0a850", bg: "var(--gold-dim)",  label: "Knowledge Resources", desc: "Books and materials that deepen understanding and expand perspective." },
              { icon: FlaskConical,color: "#c084fc", bg: "rgba(192,132,252,0.12)", label: "Research Pathways", desc: "Innovation and contribution guided by expert supervision and purpose." },
            ].map(({ icon: Icon, color, bg, label, desc }, i) => (
              <div key={i} className="dark-card p-7">
                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border" style={{ background: bg, borderColor: `${color}30` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base mb-2" style={{ color: "var(--text-1)" }}>{label}</h3>
                    <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISION & MISSION ─────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--bg-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Vision */}
            <div className="phil-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--blue-dim)", border: "1px solid rgba(59,130,246,0.25)" }}>
                  <Eye className="h-5 w-5" style={{ color: "var(--blue-acc)" }} />
                </div>
                <span className="tag">Our Vision</span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-5" style={{ color: "var(--text-1)" }}>
                Evolving Intelligence,<br />Human Capability
              </h3>
              <p className="font-body text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
                To shape a future where evolving intelligence drives progress, and guided knowledge systems unlock the next level of human capability.
              </p>
            </div>

            {/* Mission */}
            <div className="phil-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gold-dim)", border: "1px solid rgba(240,168,80,0.25)" }}>
                  <Target className="h-5 w-5" style={{ color: "var(--gold)" }} />
                </div>
                <span className="tag">Our Mission</span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-5" style={{ color: "var(--text-1)" }}>
                Potential Into<br />Measurable Progress
              </h3>
              <p className="font-body text-base leading-relaxed mb-5" style={{ color: "var(--text-2)" }}>
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
                    <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ background: "var(--gold-dim)", border: "1px solid rgba(240,168,80,0.3)" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} />
                    </div>
                    <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ───────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "var(--bg-base)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <span className="tag mb-5 inline-block">Our Philosophy</span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold" style={{ color: "var(--text-1)" }}>
              We Don't Just<br />
              <span className="gold-text">Deliver. We Design.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                icon: Compass,
                color: "#3b82f6",
                bg: "var(--blue-dim)",
                before: "We don't just deliver content.",
                after: "We design progression.",
                sub: "Every step is intentional, every pathway is purposeful.",
              },
              {
                icon: Zap,
                color: "#f0a850",
                bg: "var(--gold-dim)",
                before: "We don't just connect people.",
                after: "We align them with purpose.",
                sub: "Matching individuals to the right direction at the right time.",
              },
              {
                icon: Target,
                color: "#c084fc",
                bg: "rgba(192,132,252,0.12)",
                before: "We don't just build a platform.",
                after: "We build a pathway forward.",
                sub: "A system designed to support evolution, step by step.",
              },
            ].map(({ icon: Icon, color, bg, before, after, sub }, i) => (
              <div key={i} className="phil-card text-center">
                <div className="mx-auto mb-6 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${color}30` }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <p className="font-body text-sm mb-2" style={{ color: "var(--text-3)" }}>{before}</p>
                <p className="font-display font-bold text-lg mb-4" style={{ color: "var(--text-1)" }}>{after}</p>
                <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{sub}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── LOOKING AHEAD / CTA ──────────────────────────────────────────── */}
      <section className="cta-section py-28">
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">

          <span className="tag mb-8 inline-block">Looking Ahead</span>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-8" style={{ color: "var(--text-1)" }}>
            The future belongs<br />
            to those who <span className="gold-text">evolve.</span>
          </h2>

          <p className="font-body text-lg leading-relaxed max-w-2xl mx-auto mb-4" style={{ color: "var(--text-2)" }}>
            iNEXORA is built to support that evolution step by step, system by system. Whether you are beginning your journey or ready to take the next level, we are here to guide it.
          </p>

          <p className="font-body text-base mb-12" style={{ color: "var(--text-3)" }}>
            Your next step starts here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push("/signup")}
              className="glow-btn font-display group inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-bold text-[#0d1117] shadow-lg"
            >
              Begin Your Journey
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => router.push("/programs")}
              className="font-display inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-100"
              style={{ color: "var(--text-2)", opacity: 0.8 }}
            >
              Explore programs <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}