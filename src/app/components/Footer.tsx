import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">

          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center space-x-2">
              {/* <GraduationCap className="h-8 w-8 text-blue-500" /> */}
              <img src="/logo.png" alt="iNEXORA" className="h-10 w-36" />
              {/* <img src="/favicon.ico" alt="iNEXORA" className="h-8 w-8" />
              <span className="text-xl font-bold text-white">iNEXORA</span> */}
            </div>
            <p className="text-sm leading-relaxed">
              Sri Lanka&apos;s gateway to global education and careers.
              Bridging students, universities, and opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/careers" className="transition hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/universities" className="transition hover:text-white">
                  Universities
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-white">
                  Contact Us
                </Link>
              </li>             
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/resources" className="transition hover:text-white">
                  Digital Library
                </Link>
              </li>
              <li>
                <Link href="/support" className="transition hover:text-white">
                  Student Support
                </Link>
              </li>
              <li>
                <Link href="/partners" className="transition hover:text-white">
                  Partner Portal
                </Link>
              </li>
              <li>
                <Link href="/research" className="transition hover:text-white">
                  Research Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>Colombo, Sri Lanka</span>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>info@inexora.lk</span>
              </li>
              <li className="flex items-start space-x-2">
                <Phone className="mt-1 h-4 w-4 flex-shrink-0" />
                <span>+94 11 234 5678</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Digital Educational Hub of Sri
            Lanka. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}