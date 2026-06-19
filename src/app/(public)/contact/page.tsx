"use client";

import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Users, Building2, Briefcase, Shield, ArrowRight, Clock } from "lucide-react";

export default function Contact() {
  const router = useRouter();

  const contactCategories = [
    {
      icon: Users,
      title: "For Students",
      description: "Questions about programs, applications, or your student journey?",
      email: "students@inexora.lk",
      action: "Student Portal",
      accent: "#22C55E",
    },
    {
      icon: Building2,
      title: "For Universities",
      description: "Interested in partnering with iNEXORA?",
      email: "partners@inexora.lk",
      action: "Partner With Us",
      accent: "#22C55E",
    },
    {
      icon: Briefcase,
      title: "For Employers",
      description: "Looking to recruit talent or post opportunities?",
      email: "employers@inexora.lk",
      action: "Employer Access",
      accent: "#22C55E",
    },
    {
      icon: Shield,
      title: "For Government & NGOs",
      description: "Collaboration and regulatory inquiries.",
      email: "info@inexora.lk",
      action: "Contact Us",
      accent: "#22C55E",
    },
  ];

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
          --accent:       #A3E635;
          --text-primary: #F5F5F0;
          --text-secondary: rgba(136,153,187,0.70);
          --text-muted:   rgba(136,153,187,0.40);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-fade-up   { animation: fadeUp 0.7s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade-up-2 { animation: fadeUp 0.7s cubic-bezier(.16,1,.3,1) 0.12s both; }

        .dot-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1.5px 1.5px, #A3E635 1.5px, transparent 0);
          background-size: 36px 36px;
          opacity: 0.05;
          pointer-events: none;
        }

        .contact-row {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 28px 0;
          border-bottom: 1px solid var(--navy-border);
          transition: padding-left 0.3s ease;
        }
        .contact-row:first-child { padding-top: 4px; }
        .contact-row:last-child { border-bottom: none; }
        .contact-row:hover { padding-left: 8px; }

        .row-icon {
          width: 48px; height: 48px; flex-shrink: 0;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.3s cubic-bezier(.16,1,.3,1);
        }
        .contact-row:hover .row-icon { transform: scale(1.08); }

        .row-arrow {
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .contact-row:hover .row-arrow { opacity: 1; transform: translateX(0); }

        .panel {
          background: var(--navy-card);
          border: 1px solid var(--navy-border);
          border-radius: 18px;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 0;
          border-bottom: 1px solid var(--navy-border);
        }
        .info-item:last-child { border-bottom: none; }

        .hours-row {
          display: flex;
          justify-content: space-between;
          padding: 11px 0;
          border-bottom: 1px solid var(--navy-border);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }
        .hours-row:last-child { border-bottom: none; }

        .gold-btn {
          background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
          color: #0A0F1E;
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .gold-btn:hover {
          box-shadow: 0 0 0 6px rgba(34,197,94,0.15), 0 8px 30px rgba(34,197,94,0.35);
          transform: translateY(-2px);
        }

        .section-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 9999px;
          background: rgba(163,230,53,0.10);
          border: 1px solid rgba(163,230,53,0.22);
          color: var(--gold);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 16px;
          font-family: 'Sora', sans-serif;
        }
      `}</style>

      {/* ── HERO + CONTACT CHANNELS ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A0F1E 0%, #0E1426 50%, #141C36 100%)" }}
      >
        <div className="dot-grid" />
        <div className="pointer-events-none absolute right-0 top-0 h-[360px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(ellipse at top right, rgba(34,197,94,0.06) 0%, transparent 65%)" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-4 py-20 lg:py-18">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-start">

            {/* Left: intro */}
            <div className="anim-fade-up lg:sticky lg:top-18">
              <span className="section-badge mb-8">
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#22C55E" }} />
                Get in Touch
              </span>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl mb-8"
                style={{ color: "#F5F5F0" }}>
                Let's start a<br />
                <span style={{ color: "var(--gold)" }}>conversation.</span>
              </h1>
              <p className="font-body text-base sm:text-lg leading-relaxed max-w-md"
                style={{ color: "var(--text-secondary)" }}>
                Pick the category that matches you best — we'll route your message to the right team.
              </p>

              <div className="mt-10 hidden lg:block">
                <p className="font-body text-sm" style={{ color: "var(--text-muted)" }}>
                  Prefer to reach out directly?
                </p>
                <a href="mailto:info@inexora.lk" className="font-display text-base font-semibold mt-1 inline-flex items-center gap-2"
                  style={{ color: "var(--gold)" }}>
                  info@inexora.lk <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Right: contact channel list */}
            <div className="anim-fade-up-2">
              {contactCategories.map((category, index) => (
                <div
                  key={index}
                  onClick={() => router.push("/signup")}
                  className="contact-row cursor-pointer"
                >
                  <div className="row-icon" style={{ background: `${category.accent}1A`, border: `1px solid ${category.accent}44` }}>
                    <category.icon className="h-5 w-5" style={{ color: category.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-bold" style={{ color: "#F5F5F0" }}>
                        {category.title}
                      </h3>
                      <ArrowRight className="row-arrow h-4 w-4 flex-shrink-0 mt-1" style={{ color: category.accent }} />
                    </div>
                    <p className="font-body text-sm leading-relaxed mt-1.5 mb-3" style={{ color: "var(--text-secondary)" }}>
                      {category.description}
                    </p>
                    <a
                      href={`mailto:${category.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-body inline-flex items-center gap-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {category.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── OFFICE INFO ──────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "var(--navy-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_0.9fr]">

            {/* Head office */}
            <div className="panel p-8">
              <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#F5F5F0" }}>
                Head Office
              </h3>
              <p className="font-body text-xs mb-5" style={{ color: "var(--text-muted)" }}>
                Visit or write to us
              </p>

              <div className="info-item">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#38BDF8" }} />
                <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Digital Educational Hub<br />
                  123 Education Lane<br />
                  Colombo 07, Sri Lanka
                </p>
              </div>
              <div className="info-item">
                <Phone className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#38BDF8" }} />
                <div>
                  <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>+94 11 234 5678</p>
                  <p className="font-body text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>+94 77 123 4567</p>
                </div>
              </div>
              <div className="info-item">
                <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#38BDF8" }} />
                <p className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>info@inexora.lk</p>
              </div>
            </div>

            {/* Office hours */}
            <div className="panel p-8">
              <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#F5F5F0" }}>
                Office Hours
              </h3>
              <p className="font-body text-xs mb-5" style={{ color: "var(--text-muted)" }}>
                When our team is available
              </p>

              {[
                { day: "Monday – Friday", hours: "8:30 AM – 5:00 PM" },
                { day: "Saturday", hours: "9:00 AM – 1:00 PM" },
                { day: "Sunday", hours: "Closed" },
              ].map(({ day, hours }) => (
                <div key={day} className="hours-row">
                  <span className="font-medium" style={{ color: "#F5F5F0" }}>{day}</span>
                  <span style={{ color: "var(--text-muted)" }}>{hours}</span>
                </div>
              ))}

              <div className="mt-5 rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
                <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
                <p className="font-body text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Outside office hours? Email us and we'll respond within 24 hours.
                </p>
              </div>
            </div>

            {/* CTA card */}
            <div className="panel p-8 flex flex-col" style={{ borderColor: "rgba(34,197,94,0.22)" }}>
              <h3 className="font-display text-lg font-bold mb-3" style={{ color: "#F5F5F0" }}>
                Ready to transform education?
              </h3>
              <p className="font-body text-sm leading-relaxed mb-6 flex-1" style={{ color: "var(--text-secondary)" }}>
                Join thousands already benefiting from iNEXORA's unified education platform.
              </p>
              <button
                onClick={() => router.push("/signup")}
                className="gold-btn font-display inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
              >
                Get Started Today
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}