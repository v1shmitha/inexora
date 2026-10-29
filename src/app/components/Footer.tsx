import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

const shortcuts = [
  { label: "Programs", href: "/programs" },
  { label: "Careers", href: "/careers" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

const resources = [
  { label: "Digital Library", href: "/maintenance" },
  { label: "Student Support", href: "/maintenance" },
  { label: "Partner Portal", href: "/maintenance" },
  { label: "Research Hub", href: "/maintenance" },
];

const contact = [
  { icon: MapPin, label: "Colombo, Sri Lanka" },
  { icon: Mail, label: "info@merittz.com", href: "mailto:info@merittz.com" },
  { icon: Phone, label: "+94 11 234 5678", href: "tel:+94112345678" },
];

const linkClass =
  "text-sm text-gray-400 transition-colors hover:text-[#22C55E] focus-visible:text-[#22C55E] focus-visible:outline-none focus-visible:underline underline-offset-4";

const pillClass =
  "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:border-[#22C55E]/50 hover:bg-[#22C55E]/10 hover:text-[#22C55E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/60";

const headingClass = "text-sm font-semibold text-white";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gray-950">
      {/* Soft glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#22C55E]/10 blur-3xl" />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#22C55E]/60 to-transparent" />

      <div className="relative w-full px-6 lg:px-17">
        {/* Row 1: logo + shortcuts, centered on the same line */}
        <div className="flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between lg:py-12">
          <Link
            href="/"
            aria-label="Merittz home"
            className="inline-flex shrink-0 items-center gap-3"
          >
            <img
              src="/logo.png"
              alt=""
              className="h-12 w-auto object-contain sm:h-14"
            />
            <span
              className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl ml-1"
              style={{
                fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif",
              }}
            >
              Merittz
            </span>
          </Link>

          <nav aria-label="Shortcuts">
            <ul className="flex flex-wrap items-center gap-3">
              {shortcuts.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={pillClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="h-px w-full bg-white/10" />

        {/* Row 2: about, resources, contact on one row */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-5">
            <p className="max-w-md text-sm leading-7 text-gray-400">
              Empowering learners with clarity, purpose, and real-world
              direction through next-generation education and career
              development.
            </p>
          </div>

          <div className="lg:col-span-3 lg:col-start-6">
            <h3 className={headingClass}>Resources</h3>
            <ul className="mt-4 space-y-3">
              {resources.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className={headingClass}>Get in touch</h3>
            <ul className="mt-4 space-y-3">
              {contact.map(({ icon: Icon, label, href }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-[#22C55E]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {href ? (
                    <a href={href} className={linkClass}>
                      {label}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Merittz. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link
              href="/privacy"
              className="transition-colors hover:text-gray-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-gray-300"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
