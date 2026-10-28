"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, Ref } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

/* ─────────────────────────── Config ─────────────────────────── */

// The site header stays hidden on this page until the visitor scrolls.
// Change this if your header is not a <header> element.
const HEADER_SELECTOR = "header";

const themes = {
  light: {
    bg: "bg-white",
    word: "text-[#141C36]",
    initial: "text-[#16A34A]",
    body: "text-[#141C36]/70",
    link: "text-[#16A34A] hover:text-[#15803D]",
  },
  dark: {
    bg: "bg-[#0A0F1E]",
    word: "text-white",
    initial: "text-[#22C55E]",
    body: "text-white/65",
    link: "text-[#22C55E] hover:text-[#4ADE80]",
  },
  green: {
    bg: "bg-[#22C55E]",
    word: "text-[#0A0F1E]",
    initial: "text-[#0A0F1E]",
    body: "text-[#0A0F1E]/75",
    link: "text-[#0A0F1E]",
  },
} as const;
type Theme = keyof typeof themes;

const SECTION_FONT_SIZE = "clamp(3rem, 11vw, 8.5rem)"; // min, preferred, max

/* ─────────────────────────── Helpers ─────────────────────────── */

// Reads the real left stem of a letter (position + width, in em) from the font.
function stemOf(ch: string) {
  const fallback = { left: 0.05, width: 0.17 };
  try {
    const size = 200;
    const pad = 40;
    const c = document.createElement("canvas");
    c.width = size * 1.6;
    c.height = size * 1.4;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    ctx.font = `800 ${size}px Sora, sans-serif`;
    ctx.textBaseline = "alphabetic";
    const base = size * 1.1;
    ctx.fillText(ch, pad, base);
    const cap = ctx.measureText(ch).actualBoundingBoxAscent;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let best = { left: 0, width: Infinity };
    for (let y = Math.floor(base - cap + 4); y < base - 2; y += 3) {
      let x = 0;
      while (x < c.width && (data[(y * c.width + x) * 4 + 3] ?? 0) < 128) x++;
      const x0 = x;
      while (x < c.width && (data[(y * c.width + x) * 4 + 3] ?? 0) >= 128) x++;
      const w = x - x0;
      if (w > 0 && w < best.width) best = { left: x0, width: w };
    }
    if (!isFinite(best.width)) return fallback;
    return { left: (best.left - pad) / size, width: best.width / size };
  } catch {
    return fallback;
  }
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      // reveal once the section's top edge is 20% up from the bottom of the screen
      { rootMargin: "0px 0px -30% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

type WordRefs = {
  h?: Ref<HTMLHeadingElement>;
  line?: Ref<HTMLSpanElement>;
  base?: Ref<HTMLElement>;
};

// A word whose letters slide up one by one. First letter can be highlighted.
function Word({
  text,
  level = 2,
  className = "",
  initialClass = "",
  lastStyle,
  refs,
}: {
  text: string;
  level?: 1 | 2;
  className?: string;
  initialClass?: string;
  lastStyle?: CSSProperties;
  refs?: WordRefs;
}) {
  const Tag = level === 1 ? "h1" : "h2";
  return (
    <Tag
      ref={refs?.h}
      aria-label={text}
      style={level === 2 ? { fontSize: SECTION_FONT_SIZE } : undefined}
      className={`font-display block overflow-hidden pb-[0.20em] leading-[1.05] font-extrabold tracking-[-0.02em] ${
        level === 2 ? "lg:ml-1.7 ml-6" : ""
      } ${className}`}
    >
      <span
        ref={refs?.line}
        aria-hidden="true"
        className="inline-block whitespace-nowrap"
      >
        {text.split("").map((ch, i) => (
          <span
            key={i}
            className={`ch inline-block ${i === 0 ? initialClass : ""}`}
            style={{
              transitionDelay: `${i * 75}ms`,
              ...(i === text.length - 1 ? lastStyle : {}),
            }}
          >
            {ch}
          </span>
        ))}
        <i ref={refs?.base} className="inline-block h-0 w-0 align-baseline" />
      </span>
    </Tag>
  );
}

function Stage({
  theme,
  gate,
  children,
}: {
  theme: Theme;
  gate?: boolean;
  children: ReactNode;
}) {
  const [ref, inView] = useInView<HTMLElement>();
  const on = gate ?? inView;
  return (
    <section
      ref={ref}
      className={`${on ? "is-in" : ""} ${themes[theme].bg} px-6 py-12 lg:px-10 lg:py-16`}
    >
      <div className="grid items-end gap-5 lg:grid-cols-12 lg:gap-10">
        {children}
      </div>
    </section>
  );
}

function Aside({
  theme,
  href,
  cta,
  children,
}: {
  theme: Theme;
  href?: string;
  cta?: string;
  children: ReactNode;
}) {
  const t = themes[theme];
  return (
    <div className="pl-10 lg:col-span-8 lg:pb-3">
      <p className={`rv text-base leading-7 lg:text-lg ${t.body}`}>
        {children}
      </p>
      {href && cta && (
        <Link
          href={href}
          className={`rv rv-d1 mt-4 inline-flex items-center gap-2 text-sm font-semibold focus-visible:underline focus-visible:outline-none ${t.link}`}
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function Home() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const heroH = useRef<HTMLHeadingElement>(null);
  const heroLine = useRef<HTMLSpanElement>(null);
  const heroBase = useRef<HTMLElement>(null);
  const heroBox = useRef<HTMLDivElement>(null);
  const eWord = useRef<HTMLHeadingElement>(null);
  const ribbonSvg = useRef<SVGSVGElement>(null);
  const ribbonPoly = useRef<SVGPolygonElement>(null);
  const ribbonGrad = useRef<SVGLinearGradientElement>(null);

  const [heroIn, setHeroIn] = useState(false);
  const [connected, setConnected] = useState(false);

  /* Header stays hidden until the visitor scrolls */
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
    if (!header) return;
    const keys = [
      "position",
      "top",
      "left",
      "right",
      "zIndex",
      "transition",
      "transform",
      "opacity",
      "pointerEvents",
    ] as const;
    const saved = keys.map((k) => header.style[k]);
    Object.assign(header.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      zIndex: "50",
      transition: "transform .35s ease, opacity .35s ease",
    });
    let hidden: boolean | null = null;
    const apply = () => {
      const hide = window.scrollY < 80;
      if (hide === hidden) return;
      hidden = hide;
      header.style.transform = hide ? "translateY(-100%)" : "";
      header.style.opacity = hide ? "0" : "";
      header.style.pointerEvents = hide ? "none" : "";
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    return () => {
      window.removeEventListener("scroll", apply);
      keys.forEach((k, i) => {
        header.style[k] = saved[i] ?? "";
      });
    };
  }, []);

  /* Fit MERITTZ to the screen, and stretch the M's left stem into the E */
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const setup = () => {
      const wrap = wrapRef.current;
      const box = heroBox.current;
      const h = heroH.current;
      const line = heroLine.current;
      const base = heroBase.current;
      const eEl = eWord.current;
      const svg = ribbonSvg.current;
      const poly = ribbonPoly.current;
      const grad = ribbonGrad.current;
      if (
        !wrap ||
        !box ||
        !h ||
        !line ||
        !base ||
        !eEl ||
        !svg ||
        !poly ||
        !grad
      ) {
        return () => {};
      }

      const stemM = stemOf("M");
      const stemE = stemOf("E");
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      let g = { xM: 0, wM: 0, bl: 0, br: 0, y0: 0, h: 1, pageTop: 0 };
      let raf = 0;

      const update = () => {
        raf = 0;
        // Ribbon is 0 at scroll 0 and fully connected when the E reaches 75% of the screen
        const endScroll = Math.max(
          g.pageTop + g.y0 + g.h - window.innerHeight * 0.75,
          1,
        );
        const p = reduce
          ? 1
          : Math.min(Math.max(window.scrollY / endScroll, 0), 1);
        const y = p * g.h;
        const l = g.xM + (g.bl - g.xM) * p;
        const r = g.xM + g.wM + (g.br - g.xM - g.wM) * p;
        poly.setAttribute(
          "points",
          `${g.xM},0 ${g.xM + g.wM},0 ${r},${y} ${l},${y}`,
        );
        setConnected(p >= 0.999);
      };

      const measure = () => {
        // fit the hero word to the available width
        h.style.fontSize = "100px";
        const natural = line.getBoundingClientRect().width;
        const S1 = (box.clientWidth / natural) * 100;
        h.style.fontSize = `${S1}px`;

        const W = wrap.getBoundingClientRect();
        const lr = line.getBoundingClientRect();
        const hb = base.getBoundingClientRect();
        const er = eEl.getBoundingClientRect();
        const S2 = parseFloat(getComputedStyle(eEl).fontSize);

        const xM = lr.left - W.left + stemM.left * S1;
        const wM = stemM.width * S1;
        const eStemL = er.left - W.left + stemE.left * S2;
        const eStemW = stemE.width * S2;
        const bw = eStemW * 0.8;
        const bl = eStemL + (eStemW - bw) / 2;

        const y0 = hb.bottom - W.top - 2;
        const yEnd = er.top - W.top + er.height * 0.55;
        g = {
          xM,
          wM,
          bl,
          br: bl + bw,
          y0,
          h: Math.max(yEnd - y0, 1),
          pageTop: W.top + window.scrollY,
        };

        svg.style.top = `${y0}px`;
        svg.style.width = `${W.width}px`;
        svg.style.height = `${g.h}px`;
        grad.setAttribute("y2", String(g.h));
        update();
      };

      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };

      measure();
      setHeroIn(true);
      window.addEventListener("scroll", onScroll, { passive: true });
      const ro = new ResizeObserver(measure);
      ro.observe(wrap);
      return () => {
        window.removeEventListener("scroll", onScroll);
        ro.disconnect();
        if (raf) cancelAnimationFrame(raf);
      };
    };

    (async () => {
      try {
        await document.fonts.load('800 200px "Sora"');
        await document.fonts.ready;
      } catch {
        /* fall through with fallback font */
      }
      if (!cancelled) cleanup = setup();
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={wrapRef} className="font-body relative overflow-x-clip bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;800&family=DM+Sans:wght@400;500;600&display=swap');
        .font-display { font-family: 'Sora', ui-sans-serif, system-ui, sans-serif; }
        .font-body    { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }

        .ch { transform: translateY(120%); transition: transform .7s cubic-bezier(.16,1,.3,1); }
        .is-in .ch { transform: none; }

        .rv { opacity: 0; transform: translateY(12px); transition: opacity .6s ease .35s, transform .6s ease .35s; }
        .rv-d1 { transition-delay: .5s; }
        .rv-d2 { transition-delay: .65s; }
        .is-in .rv { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
          .ch { transform: none; transition: none; }
          .rv { opacity: 1; transform: none; transition: none; }
        }
      `}</style>

      {/* Ribbon: the M's left stem stretching down into the E */}
      <svg
        ref={ribbonSvg}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 z-10 overflow-visible"
        style={{ width: 0, height: 0 }}
      >
        <defs>
          <linearGradient
            ref={ribbonGrad}
            id="ribbon-fill"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor="#141C36" />
            <stop offset="1" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <polygon
          ref={ribbonPoly}
          points="0,0 0,0 0,0 0,0"
          fill="url(#ribbon-fill)"
        />
      </svg>

      {/* ── HERO: the name, nothing else ─────────────────────── */}
      <section
        className={`${heroIn ? "is-in" : ""} relative flex min-h-[100svh] flex-col justify-center bg-white px-6 pt-50 pb-[12svh] lg:px-10`}
      >
        <div ref={heroBox} className="w-full">
          <Word
            level={1}
            text="MERITTZ"
            className="text-[19vw] text-[#141C36]"
            lastStyle={{
              backgroundImage:
                "linear-gradient(135deg, #FA8B00 0%, #F95500 14%, #FA1205 28%, #DF034D 42%, #DC04C0 56%, #8E02B6 70%, #3212A6 84%, #007AE6 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            refs={{ h: heroH, line: heroLine, base: heroBase }}
          />
        </div>
        <ChevronDown
          aria-hidden="true"
          className="absolute bottom-8 left-1/2 h-6 w-6 -translate-x-1/2 text-[#141C36]/35"
        />
      </section>

      {/* ── E · Education (appears once the ribbon lands) ───── */}
      <Stage theme="light" gate={connected}>
        <div className="lg:col-span-18">
          <Word
            text="Education"
            className={`${SECTION_FONT_SIZE} ${themes.light.word}`}
            initialClass={themes.light.initial}
            refs={{ h: eWord }}
          />
        </div>
        <Aside theme="light" href="/programs" cta="Browse programs">
          Accredited programs built around the skills employers look for.
          UGC/TVEC approved, with 200+ to choose from.
        </Aside>
      </Stage>

      {/* ── R · Roadmap ──────────────────────────────────────── */}
      <Stage theme="dark">
        <div className="lg:col-span-15">
          <Word
            text="Roadmap"
            className={`${SECTION_FONT_SIZE} ${themes.dark.word}`}
            initialClass={themes.dark.initial}
          />
        </div>
        <Aside theme="dark">
          A guided path from your first lesson to your first role, so you always
          know what comes next.
        </Aside>
      </Stage>

      {/* ── I · Internships ──────────────────────────────────── */}
      <Stage theme="light">
        <div className="lg:col-span-15">
          <Word
            text="Internships"
            className={`${SECTION_FONT_SIZE} ${themes.light.word}`}
            initialClass={themes.light.initial}
          />
        </div>
        <Aside theme="light" href="/careers" cta="See careers">
          Career tools, internships, and real openings that move you from
          learning into work.
        </Aside>
      </Stage>

      {/* ── T · Talent ───────────────────────────────────────── */}
      <Stage theme="dark">
        <div className="lg:col-span-15">
          <Word
            text="Talent"
            className={`${SECTION_FONT_SIZE} ${themes.dark.word}`}
            initialClass={themes.dark.initial}
          />
        </div>
        <Aside theme="dark" href="/contact" cta="Partner with us">
          Universities share their programs. Employers meet the people who
          finish them.
        </Aside>
      </Stage>

      {/* ── T · Thesis ───────────────────────────────────────── */}
      <Stage theme="light">
        <div className="lg:col-span-15">
          <Word
            text="Thesis"
            className={`${SECTION_FONT_SIZE} ${themes.light.word}`}
            initialClass={themes.light.initial}
          />
        </div>
        <Aside theme="light">
          Books and study materials to go deeper, and research you can publish
          under expert guidance.
        </Aside>
      </Stage>

      {/* ── Z · Zenith ───────────────────────────────────────── */}
      <Stage theme="green">
        <div className="lg:col-span-15">
          <Word
            text="Zenith"
            className={`${SECTION_FONT_SIZE} ${themes.green.word}`}
            initialClass={themes.green.initial}
          />
        </div>
        <div className="pl-8 lg:col-span-6 lg:pb-3">
          <p
            className={`rv text-base leading-7 lg:text-lg ${themes.green.body}`}
          >
            Your next level starts here. Create an account and see your first
            pathway today.
          </p>
          <div className="rv rv-d1 mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A0F1E] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#141C36] focus-visible:ring-2 focus-visible:ring-[#0A0F1E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#22C55E] focus-visible:outline-none"
            >
              Create account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center rounded-full border border-[#0A0F1E]/30 px-7 py-3.5 text-sm font-semibold text-[#0A0F1E] transition-colors hover:bg-[#0A0F1E]/10 focus-visible:ring-2 focus-visible:ring-[#0A0F1E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#22C55E] focus-visible:outline-none"
            >
              Browse programs
            </Link>
          </div>
        </div>
      </Stage>
    </div>
  );
}
