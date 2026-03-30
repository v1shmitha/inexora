"use client";

import { ArrowRight, Users, Building2, Briefcase, BookOpen, TrendingUp, Award, Globe, Layers, FlaskConical, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="bg-white font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        :root {
          --blue-600: #2563eb;
          --blue-700: #1d4ed8;
          --blue-800: #1e40af;
        }
        .font-display { font-family: 'Sora', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .anim-fade-up   { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) both; }
        .anim-fade-up-2 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.15s both; }
        .anim-fade-up-3 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.3s both; }
        .anim-fade-up-4 { animation: fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.45s both; }
        .anim-fade-in   { animation: fadeIn 1.2s ease both; }
        .float-anim     { animation: float 6s ease-in-out infinite; }
        .float-anim-2   { animation: float 8s ease-in-out 1s infinite; }
        .float-anim-3   { animation: float 7s ease-in-out 2s infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #93c5fd 0%, #ffffff 40%, #93c5fd 60%, #ffffff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .card-hover {
          transition: transform 0.3s cubic-bezier(.16,1,.3,1), box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px -10px rgba(37,99,235,0.15);
        }
        .step-card:nth-child(odd)  { background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%); }
        .step-card:nth-child(even) { background: linear-gradient(135deg, #f8faff 0%, #eef4ff 100%); }
        .glow-btn {
          box-shadow: 0 0 0 0 rgba(37,99,235,0.4);
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 0 8px rgba(37,99,235,0.12), 0 8px 30px rgba(37,99,235,0.3);
          transform: translateY(-2px);
        }
        .mesh-bg {
          background:
            radial-gradient(ellipse 60% 50% at 20% 30%, rgba(59,130,246,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 70%, rgba(99,102,241,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 60% 10%, rgba(37,99,235,0.1) 0%, transparent 60%);
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white min-h-[90vh] flex items-center">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
          backgroundSize: "36px 36px",
        }} />

        {/* Floating geometric blobs */}
        <div className="absolute top-16 right-16 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl float-anim pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-56 h-56 rounded-full bg-indigo-500/15 blur-2xl float-anim-2 pointer-events-none" />
        <div className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full bg-blue-300/10 blur-xl float-anim-3 pointer-events-none" />

        {/* Decorative floating cards */}
        <div className="absolute right-8 top-24 hidden lg:flex flex-col gap-3 float-anim">
          {[
            { label: "New Enrollment", sub: "BSc Computer Science", color: "from-blue-500 to-indigo-600" },
            { label: "Certificate Earned", sub: "Data Analytics", color: "from-emerald-500 to-teal-600" },
          ].map((card, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/20 shadow-xl">
              <div className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r ${card.color} mb-1`}>
                ✓ {card.label}
              </div>
              <p className="text-white text-sm font-medium">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="anim-fade-in inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 mb-8 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-blue-100">Next-generation learning platform</span>
            </div>

            <h1 className="font-display anim-fade-up text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              Unlocking<br />
              <span className="shimmer-text">The Next You</span>
            </h1>

            <p className="anim-fade-up-2 font-body text-lg sm:text-xl text-blue-100 leading-relaxed mb-4 max-w-xl">
              A next-generation platform designed to help you learn, grow, and evolve with clarity, purpose, and real-world direction.
            </p>
            <p className="anim-fade-up-2 font-body text-base text-blue-200/80 mb-10 max-w-lg">
              Move beyond information. Step into transformation.
            </p>

            <div className="anim-fade-up-3 flex flex-col sm:flex-row gap-4">
              <button onClick={() => router.push("/signup")}
                className="glow-btn font-display group inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => router.push("/programs")}
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white transition hover:bg-white/20"
              >
                Explore Platform
              </button>
            </div>

            {/* Trust bar */}
            <div className="anim-fade-up-4 mt-14 flex flex-wrap gap-x-8 gap-y-3">
              {[
                { value: "10,000+", label: "Students" },
                { value: "50+",     label: "Universities" },
                { value: "200+",    label: "Programs" },
                { value: "85%",     label: "Placement Rate" },
              ].map((s) => (
                <div key={s.label} className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-white">{s.value}</span>
                  <span className="text-sm text-blue-200">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="font-display inline-block rounded-full bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 mb-5">
                Our Vision
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
                Built for Growth.<br />
                <span className="text-blue-600">Designed for Progress.</span>
              </h2>
              <div className="space-y-4 font-body text-slate-600 text-base leading-relaxed">
                <p>In a world filled with endless information, finding the right path can be overwhelming.</p>
                <p>iNEXORA brings everything into one place — not just content, but a clear, guided system that helps you move forward with confidence.</p>
                <p>From learning new skills to building your career and contributing to knowledge, every step is connected into one continuous journey.</p>
                <p className="font-semibold text-slate-800">This is not just a platform. It's a space where progress becomes structured, and potential becomes real.</p>
              </div>
              <button onClick={() => router.push("/about")}
                className="mt-8 inline-flex items-center gap-2 font-display text-blue-600 font-semibold hover:gap-3 transition-all"
              >
                Learn more about us <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Visual side */}
            <div className="relative">
              <div className="absolute inset-0 mesh-bg rounded-3xl" />
              <div className="relative grid grid-cols-2 gap-4 p-8">
                {[
                  { icon: BookOpen,     label: "Structured Learning",  color: "bg-blue-600",    count: "200+ Programs" },
                  { icon: TrendingUp,   label: "Career Pathways",      color: "bg-indigo-600",  count: "85% Placement" },
                  { icon: Award,        label: "Certifications",       color: "bg-emerald-600", count: "10K+ Earned" },
                  { icon: Globe,        label: "Global Access",        color: "bg-violet-600",  count: "50+ Partners" },
                ].map(({ icon: Icon, label, color, count }) => (
                  <div key={label} className="card-hover bg-white rounded-2xl p-5 shadow-md border border-slate-100">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-display font-semibold text-slate-900 text-sm">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="font-display inline-block rounded-full bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 mb-5">
              How It Works
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              A System That Moves You Forward
            </h2>
            <p className="font-body text-lg text-slate-500 max-w-2xl mx-auto">
              iNEXORA is designed to guide you through every stage of growth, with clarity at every step.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                num: "01", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100",
                title: "Learn with Purpose",
                desc: "Gain access to structured learning designed to build real skills and meaningful understanding.",
              },
              {
                num: "02", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-100",
                title: "Grow with Direction",
                desc: "Follow guided pathways that help you apply what you learn and stay aligned with your goals.",
              },
              {
                num: "03", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-100",
                title: "Step Into Opportunity",
                desc: "Receive career support and tools that help you confidently move into the professional world.",
              },
              {
                num: "04", icon: Layers, color: "text-orange-600", bg: "bg-orange-100",
                title: "Access the Right Resources",
                desc: "Explore books and study materials that support your learning and deepen your knowledge.",
              },
              {
                num: "05", icon: FlaskConical, color: "text-pink-600", bg: "bg-pink-100",
                title: "Contribute and Advance",
                desc: "Engage in research and publish your work under expert guidance, turning knowledge into impact.",
              },
              // Placeholder CTA card
              {
                num: null, icon: null, color: "", bg: "",
                title: "", desc: "",
              },
            ].map((step, i) => {
              if (!step.num) {
                return (
                  <div key={i} className="card-hover rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex flex-col items-center justify-center text-center text-white gap-4">
                    <p className="font-display text-xl font-bold">Ready to begin your journey?</p>
                    <button onClick={() => router.push("/signup")}
                      className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-700 font-semibold px-6 py-3 text-sm hover:bg-blue-50 transition"
                    >
                      Start Now <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                );
              }
              const Icon = step.icon!;
              return (
                <div key={i} className="card-hover step-card rounded-2xl p-7 border border-slate-200/60">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${step.bg}`}>
                      <Icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    <span className="font-display text-3xl font-bold text-slate-200">{step.num}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="font-body text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY iNEXORA ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="font-display inline-block rounded-full bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 mb-5">
              Why iNEXORA
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              More Than Learning.<br />
              <span className="text-blue-600">A Complete Growth System.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                color: "bg-blue-600",
                title: "Everything in One Place",
                desc: "No more scattered platforms. Learning, career support, resources, and research come together in one seamless experience.",
              },
              {
                icon: TrendingUp,
                color: "bg-indigo-600",
                title: "Clarity at Every Step",
                desc: "We remove confusion and provide direction — so you always know what to do next.",
              },
              {
                icon: Award,
                color: "bg-emerald-600",
                title: "Focused on Real Outcomes",
                desc: "Beyond theory and passive learning. Everything is designed to help you achieve measurable progress.",
              },
              {
                icon: FlaskConical,
                color: "bg-orange-500",
                title: "Built for Continuous Growth",
                desc: "From your first step to advanced levels, iNEXORA grows with you at every stage.",
              },
              {
                icon: Users,
                color: "bg-violet-600",
                title: "Centered Around You",
                desc: "Every feature is designed to support your journey — helping you unlock your next level with confidence.",
              },
              {
                icon: Globe,
                color: "bg-pink-600",
                title: "Global Standards, Local Relevance",
                desc: "UGC/TVEC approved programs meeting national standards with global perspective.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card-hover group relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm overflow-hidden">
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/60 group-hover:to-indigo-50/40 transition-all duration-500 rounded-2xl" />
                <div className="relative">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${color} mb-5 shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="font-body text-sm text-slate-500 leading-relaxed">{desc}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle className="h-3.5 w-3.5" /> Included in your plan
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">Built for Every Stakeholder</h2>
            <p className="font-body text-lg text-slate-500 max-w-xl mx-auto">One platform, three powerful perspectives</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                accent: "bg-blue-600",
                light: "bg-blue-50",
                textAccent: "text-blue-600",
                title: "Students",
                tagline: "Grow your potential",
                points: ["Discover accredited programs", "Build stackable credentials", "Access career opportunities", "Track your progress"],
                cta: "Explore as Student",
                href: "/signup",
              },
              {
                icon: Building2,
                accent: "bg-indigo-600",
                light: "bg-indigo-50",
                textAccent: "text-indigo-600",
                title: "Universities",
                tagline: "Expand your reach",
                points: ["List and manage programs", "Connect with students globally", "Track enrollment outcomes", "Manage lecturer assignments"],
                cta: "Partner with Us",
                href: "/contact",
              },
              {
                icon: Briefcase,
                accent: "bg-emerald-600",
                light: "bg-emerald-50",
                textAccent: "text-emerald-600",
                title: "Employers",
                tagline: "Find top talent",
                points: ["Post job opportunities", "Access skilled graduates", "Offer internship programs", "Build your talent pipeline"],
                cta: "Start Hiring",
                href: "/signup",
              },
            ].map(({ icon: Icon, accent, light, textAccent, title, tagline, points, cta, href }) => (
              <div key={title} className="card-hover bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`${accent} px-7 py-6 text-white`}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold">{title}</h3>
                  </div>
                  <p className="text-sm text-white/75 mt-1">{tagline}</p>
                </div>
                <div className="px-7 py-6">
                  <ul className="space-y-3 mb-7">
                    {points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${textAccent}`} />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => router.push(href)}
                    className={`w-full rounded-xl ${light} ${textAccent} font-display font-semibold py-3 text-sm transition hover:brightness-95`}
                  >
                    {cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────────────── */}
      <section className="py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)",
          backgroundSize: "30px 30px",
        }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="font-display inline-block rounded-full bg-white/10 border border-white/20 text-blue-100 text-sm font-medium px-4 py-1.5 mb-8">
            Your journey starts here
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Your Next Step<br />
            <span className="shimmer-text">Starts Here</span>
          </h2>
          <p className="font-body text-lg text-blue-100 max-w-2xl mx-auto mb-4">
            The future you are working towards is not far away. It begins with the right system, the right direction, and the right support.
          </p>
          <p className="font-body text-base text-blue-200/80 mb-12">
            iNEXORA is here to guide that journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => router.push("/signup")}
              className="glow-btn font-display group inline-flex items-center justify-center rounded-xl bg-white px-10 py-4 text-base font-semibold text-blue-700 shadow-xl"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => router.push("/programs")}
              className="font-display inline-flex items-center gap-2 text-blue-100 font-medium hover:text-white transition text-sm"
            >
              Browse programs <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}